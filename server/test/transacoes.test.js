import assert from 'node:assert/strict';
import { before, after, beforeEach, afterEach, describe, it } from 'node:test';
import mysql from 'mysql2/promise';
import { executarTransacao } from '../banco/transacao.js';
import { conectarPool } from '../banco/conexao.js';
import { executarMigracoes } from '../banco/migrador.js';
import { carregarAplicacaoIsolada, contas, senhaFixture, aluno, professor } from './helpers/aplicacao.js';
import { mysqlDisponivel, iniciarMysqlTemporario } from './helpers/mysql-temporario.js';

describe('P05: falhas do ciclo transacional', () => {
    for (const fase of ['sucesso', 'aquisição', 'begin', 'operação', 'commit', 'rollback', 'conexão perdida']) {
        it(`trata ${fase} sem repetir operação ou devolver conexão insegura`, async () => {
            const eventos = [];
            const erro = Object.assign(new Error('falha fixture'), fase === 'conexão perdida' ? { code: 'PROTOCOL_CONNECTION_LOST', fatal: true } : {});
            const banco = {
                async beginTransaction() { eventos.push('begin'); if (fase === 'begin') throw erro; },
                async commit() { eventos.push('commit'); if (fase === 'commit') throw erro; },
                async rollback() { eventos.push('rollback'); if (fase === 'rollback') throw new Error('rollback fixture'); },
                release() { eventos.push('release'); }, destroy() { eventos.push('destroy'); }
            };
            const pool = { async getConnection() { eventos.push('acquire'); if (fase === 'aquisição') throw erro; return banco; } };
            const resultado = executarTransacao(pool, async conexao => {
                assert.equal(conexao, banco); eventos.push('operação');
                if (['operação', 'rollback', 'conexão perdida'].includes(fase)) throw erro;
                return 123;
            });
            if (fase === 'sucesso') { assert.equal(await resultado, 123); assert.deepEqual(eventos, ['acquire', 'begin', 'operação', 'commit', 'release']); }
            else {
                await assert.rejects(resultado, e => e === erro);
                assert.equal(eventos.filter(e => e === 'acquire').length, 1);
                assert.equal(eventos.filter(e => e === 'operação').length, fase === 'begin' || fase === 'aquisição' ? 0 : 1);
                if (fase === 'aquisição') assert.deepEqual(eventos, ['acquire']);
                else assert.equal(eventos.at(-1), ['operação'].includes(fase) ? 'release' : 'destroy');
                if (fase === 'conexão perdida') assert.equal(eventos.includes('rollback'), false);
            }
        });
    }
});

function observar(pool, depoisDaQuery = async () => {}) {
    const eventos = [];
    return {
        eventos,
        query(...args) { eventos.push({ fase: 'query-global', sql: args[0] }); return pool.query(...args); },
        async getConnection() {
            const banco = await pool.getConnection();
            const id = banco.threadId;
            eventos.push({ fase: 'acquire', id });
            return {
                async query(sql, parametros) {
                    eventos.push({ fase: 'query', id, sql });
                    let resultado;
                    try { resultado = await banco.query(sql, parametros); }
                    catch (erro) { eventos.push({ fase: 'erro', id, codigo: erro.code }); throw erro; }
                    await depoisDaQuery({ id, sql, parametros, resultado });
                    return resultado;
                },
                async beginTransaction() { eventos.push({ fase: 'begin', id }); await banco.beginTransaction(); },
                async commit() { eventos.push({ fase: 'commit', id }); await banco.commit(); },
                async rollback() { eventos.push({ fase: 'rollback', id }); await banco.rollback(); },
                release() { eventos.push({ fase: 'release', id }); banco.release(); },
                destroy() { eventos.push({ fase: 'destroy', id }); banco.destroy(); }
            };
        }
    };
}

async function esperar(promise) {
    let timer;
    try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Barreira de concorrência não alcançada.')), 6000); })]); }
    finally { clearTimeout(timer); }
}

describe('P05: concorrência e CRUD HTTP em MySQL descartável real', { skip: !mysqlDisponivel, concurrency: 1 }, () => {
    let instancia, banco, pool, app, servidor, origem, cookie, config;
    const projeto = nome => ({ status:'em andamento', nome, descricao: 'fixture', objetivo: 'fixture', professor_ids: [41], aluno_ids: [42] });
    async function request(method, url, body) {
        const res = await fetch(origem + url, { method, signal: AbortSignal.timeout(12000),
            headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body) });
        return { status: res.status, data: await res.json(), res };
    }
    before(async () => {
        instancia = await iniciarMysqlTemporario('p05'); banco = instancia.banco;
        console.log('MySQL descartável P05:', (await banco.query('SELECT VERSION() AS v'))[0][0].v);
        await executarMigracoes(banco);
        config = { host: '127.0.0.1', port: banco.config.port, database: 'fixture_p01', user: 'root' };
        pool = await conectarPool(config);
        await banco.query('INSERT INTO usuarios (id, usuario, senha, perfil) VALUES (1, ?, ?, ?)', [contas[0].usuario, contas[0].senha, contas[0].perfil]);
        app = await carregarAplicacaoIsolada(); app.configurarBancoDeTeste(pool);
        servidor = app.app.listen(0, '127.0.0.1'); await new Promise(resolve => servidor.once('listening', resolve));
        origem = `http://127.0.0.1:${servidor.address().port}`;
        const login = await request('POST', '/login', { usuario: contas[0].usuario, senha: senhaFixture });
        assert.equal(login.status, 200); cookie = login.res.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(async () => {
        app.configurarBancoDeTeste(pool);
        await banco.query('DROP TRIGGER IF EXISTS fixture_p05_falha');
        for (const tabela of ['documentos', 'projeto_aluno', 'projeto_professor', 'projeto', 'aluno', 'professor']) await banco.query(`DELETE FROM ${tabela}`);
        await banco.query('INSERT INTO professor (id, nome) VALUES (41, ?)', [professor.nome]);
        await banco.query('INSERT INTO aluno (id, nome) VALUES (42, ?)', [aluno.nome]);
    });
    afterEach(async () => {
        app?.configurarBancoDeTeste(pool);
        if (pool) {
            // Saturar o limite força verificar que nenhuma conexão ficou reservada.
            const obtidas = [];
            try {
                for (let i = 0; i < 10; i++) obtidas.push(await esperar(pool.getConnection()));
                assert.equal(new Set(obtidas.map(c => c.threadId)).size, 10);
            } finally { obtidas.forEach(c => c.release()); }
        }
    });
    after(async () => {
        if (servidor) { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
        if (pool) await pool.end();
        if (instancia) await instancia.encerrar();
    });
    async function instalarFalha(titulo) {
        await banco.query(`CREATE TRIGGER fixture_p05_falha BEFORE INSERT ON projeto_aluno FOR EACH ROW
            BEGIN IF (SELECT titulo FROM projeto WHERE id=NEW.projeto_id) = '${titulo}' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='falha intermediaria fixture'; END IF; END`);
    }
    for (const falhaA of [true, false]) {
        it(`requisições simultâneas: ${falhaA ? 'rollback A não desfaz commit B' : 'rollback B não desfaz operação A ainda aberta'}`, async () => {
            await instalarFalha(falhaA ? 'A' : 'B');
            const entrou = Promise.withResolvers(), liberar = Promise.withResolvers();
            const observado = observar(pool, async ({ sql, parametros }) => {
                if (sql.startsWith('INSERT INTO projeto (') && parametros[0] === 'A') { entrou.resolve(); await liberar.promise; }
            });
            app.configurarBancoDeTeste(observado);
            const operacaoA = request('POST', '/projetos', projeto('A'));
            try {
                await esperar(entrou.promise);
                const b = await request('POST', '/projetos', projeto('B'));
                assert.equal(b.status, falhaA ? 200 : 500);
                const [durante] = await banco.query('SELECT titulo FROM projeto ORDER BY titulo');
                assert.deepEqual(durante.map(r => r.titulo), falhaA ? ['B'] : []);
                liberar.resolve();
                const a = await operacaoA; assert.equal(a.status, falhaA ? 500 : 200);
                const [depois] = await banco.query('SELECT titulo FROM projeto ORDER BY titulo');
                assert.deepEqual(depois.map(r => r.titulo), falhaA ? ['B'] : ['A']);
                const aquisicoes = observado.eventos.filter(e => e.fase === 'acquire');
                assert.equal(aquisicoes.length, 2); assert.notEqual(aquisicoes[0].id, aquisicoes[1].id);
                assert.equal(observado.eventos.filter(e => e.fase === 'query-global').length, 0);
                for (const { id } of aquisicoes) {
                    const eventos = observado.eventos.filter(e => e.id === id);
                    assert.equal(eventos.at(-1).fase, 'release');
                    assert.equal(eventos.filter(e => ['commit', 'rollback'].includes(e.fase)).length, 1);
                    assert.ok(eventos.some(e => e.sql?.startsWith('INSERT INTO projeto_professor')));
                }
            } finally { liberar.resolve(); await operacaoA; }
        });
    }
    it('duas transações bem-sucedidas persistem projetos e participantes independentes', async () => {
        const ambas = Promise.withResolvers(); let chegaram = 0;
        const observado = observar(pool, async ({ sql }) => {
            if (sql.startsWith('INSERT INTO projeto (')) {
                if (++chegaram === 2) ambas.resolve();
                await esperar(ambas.promise);
            }
        }); app.configurarBancoDeTeste(observado);
        const resultados = await Promise.all(['C', 'D'].map(t => request('POST', '/projetos', projeto(t))));
        assert.ok(resultados.every(r => r.status === 200), JSON.stringify(observado.eventos.filter(e => e.fase === 'erro')));
        assert.notEqual(resultados[0].data.id, resultados[1].data.id);
        for (const t of ['projeto', 'projeto_professor', 'projeto_aluno']) assert.equal((await banco.query(`SELECT * FROM ${t}`))[0].length, 2);
    });
    it('edição de projeto com falha intermediária mantém título e participantes anteriores', async () => {
        const criado = await request('POST', '/projetos', projeto('original')); assert.equal(criado.status, 200);
        await instalarFalha('editado');
        const res = await request('PUT', `/projetos/${criado.data.id}`, projeto('editado')); assert.equal(res.status, 500);
        const leitura = await request('GET', `/projetos/${criado.data.id}`);
        assert.equal(leitura.data.nome, 'original');
        assert.deepEqual(leitura.data.professor_ids, [41]); assert.deepEqual(leitura.data.aluno_ids, [42]);
    });
    it('CRUD de projeto com commit usa somente a conexão adquirida nas três mutações', async () => {
        const observado = observar(pool); app.configurarBancoDeTeste(observado);
        const criado = await request('POST', '/projetos', projeto('original')); assert.equal(criado.status, 200);
        assert.equal((await request('PUT', `/projetos/${criado.data.id}`, projeto('atualizado'))).status, 200);
        assert.equal((await request('DELETE', `/projetos/${criado.data.id}`)).status, 200);
        assert.equal((await banco.query('SELECT * FROM projeto'))[0].length, 0);
        assert.equal(observado.eventos.filter(e => e.fase === 'query-global').length, 0);
        assert.equal(observado.eventos.filter(e => e.fase === 'commit').length, 3);
        assert.equal(observado.eventos.filter(e => e.fase === 'release').length, 3);
    });
    it('exclusão de projeto que falha restaura os participantes removidos', async () => {
        const criado = await request('POST', '/projetos', projeto('preservar'));
        await banco.query("CREATE TRIGGER fixture_p05_falha BEFORE DELETE ON projeto FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='falha fixture'");
        assert.equal((await request('DELETE', `/projetos/${criado.data.id}`)).status, 500);
        assert.equal((await banco.query('SELECT * FROM projeto_professor'))[0].length, 1);
        assert.equal((await banco.query('SELECT * FROM projeto_aluno'))[0].length, 1);
        assert.equal((await banco.query('SELECT * FROM projeto'))[0].length, 1);
    });
    for (const perfil of ['professor', 'aluno']) {
        it(`CRUD de ${perfil} persiste; exclusão de pessoa usa conexão dedicada`, async () => {
            const payload = perfil === 'aluno' ? aluno : professor;
            const criado = await request('POST', '/cadastro-dashboard', { ...payload, perfil }); assert.equal(criado.status, 200);
            assert.equal((await request('PUT', `/usuarios/${criado.data.id}?perfil=${perfil}`, { ...payload, nome: 'Nome alterado' })).status, 200);
            const leitura = await request('GET', `/usuarios/${criado.data.id}?perfil=${perfil}`); assert.equal(leitura.data.nome, 'Nome alterado');
            const observado = observar(pool); app.configurarBancoDeTeste(observado);
            assert.equal((await request('DELETE', `/usuarios/${criado.data.id}?perfil=${perfil}`)).status, 200);
            assert.equal(observado.eventos.filter(e => e.fase === 'query-global').length, 0);
            assert.equal(observado.eventos.at(-1).fase, 'release');
            assert.equal((await banco.query(`SELECT * FROM ${perfil} WHERE id=?`, [criado.data.id]))[0].length, 0);
        });
    }
    it('falha na exclusão de professor preserva pessoa, vínculo e referência no projeto', async () => {
        await request('POST', '/projetos', projeto('preservar'));
        await banco.query("CREATE TRIGGER fixture_p05_falha BEFORE DELETE ON professor FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='falha fixture'");
        assert.equal((await request('DELETE', '/usuarios/41?perfil=professor')).status, 500);
        assert.equal((await banco.query('SELECT professor_id FROM projeto'))[0][0].professor_id, 41);
        assert.equal((await banco.query('SELECT * FROM projeto_professor'))[0].length, 1);
        assert.equal((await banco.query('SELECT * FROM professor WHERE id=41'))[0].length, 1);
    });
    it('perda real de conexão descarta transação e não grava resultado parcial nem tenta repetir', async () => {
        const eventos = observar(pool, async ({ id, sql }) => {
            if (sql.startsWith('INSERT INTO projeto (')) await banco.query(`KILL CONNECTION ${Number(id)}`);
        });
        app.configurarBancoDeTeste(eventos);
        const res = await request('POST', '/projetos', projeto('conexao-perdida')); assert.equal(res.status, 500);
        assert.equal((await banco.query('SELECT * FROM projeto'))[0].length, 0);
        assert.equal(eventos.eventos.filter(e => e.fase === 'acquire').length, 1);
        assert.equal(eventos.eventos.at(-1).fase, 'destroy');
        app.configurarBancoDeTeste(pool);
        assert.equal((await request('POST', '/projetos', projeto('proxima-operacao'))).status, 200);
    });
    it('indisponibilidade do pool retorna erro sem iniciar operação nem retentar', async () => {
        const fechado = mysql.createPool(config); await fechado.end();
        app.configurarBancoDeTeste(fechado);
        assert.equal((await request('POST', '/projetos', projeto('nao-criar'))).status, 500);
        assert.equal((await banco.query('SELECT * FROM projeto'))[0].length, 0);
    });
    it('partida com esquema inválido encerra o pool e devolve a conexão de verificação', async () => {
        let terminou = false, devolveu = false;
        const outro = mysql.createPool(config);
        await banco.query('RENAME TABLE schema_migrations TO fixture_historico_guardado');
        try {
            await assert.rejects(conectarPool(config, () => ({
                async getConnection() { const c = await outro.getConnection(); return { query: (...a) => c.query(...a), release() { devolveu = true; c.release(); } }; },
                async end() { terminou = true; await outro.end(); }
            })), /Histórico.*ausente/);
            assert.ok(terminou); assert.ok(devolveu);
        } finally { await banco.query('RENAME TABLE fixture_historico_guardado TO schema_migrations'); }
    });
    it('pool verifica esquema e consulta com conta somente leitura, sem DDL na partida', async () => {
        await banco.query("CREATE USER 'fixture_p05_leitura'@'127.0.0.1' IDENTIFIED BY 'fixture-p05-only'");
        await banco.query("GRANT SELECT ON fixture_p01.* TO 'fixture_p05_leitura'@'127.0.0.1'");
        const leitura = await conectarPool({ ...config, user: 'fixture_p05_leitura', password: 'fixture-p05-only' });
        try { assert.equal((await leitura.query('SELECT * FROM professor WHERE id=41'))[0].length, 1); }
        finally { await leitura.end(); }
    });
});
