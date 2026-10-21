import {versaoEsperada} from '../banco/migracoes.js';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { executarMigracoes, verificarEsquema } from '../banco/migrador.js';
import { diagnosticarProjetos } from '../banco/integridade-projetos.js';
import { conectarPool } from '../banco/conexao.js';
import { carregarAplicacaoIsolada, criarBancoSimulado, contas, senhaFixture, payloadProjeto } from './helpers/aplicacao.js';
import { mysqlDisponivel, iniciarMysqlTemporario } from './helpers/mysql-temporario.js';
import v3 from '../banco/versoes/003-integridade-projetos.js';
import { spawn } from 'node:child_process';

describe('P10: validação HTTP antes de SQL', { concurrency: 1 }, () => {
    let app, banco, servidor, origem, cookie;
    async function request(method, body, caminho = '/projetos') {
        const res = await fetch(origem + caminho, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
        return { status: res.status, data: await res.json() };
    }
    before(async () => {
        app = await carregarAplicacaoIsolada(); banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco);
        servidor = app.app.listen(0, '127.0.0.1'); await new Promise(resolve => servidor.once('listening', resolve));
        origem = `http://127.0.0.1:${servidor.address().port}`;
        const login = await fetch(origem + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: contas[0].usuario, senha: senhaFixture }) });
        assert.equal(login.status, 200); cookie = login.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(() => { banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco); });
    after(async () => { servidor?.closeAllConnections(); if (servidor) await new Promise(resolve => servidor.close(resolve)); });
    const invalidos = [0, -1, 1.5, true, false, null, {}, [], '', ' ', 'abc', '1.5', '1e2', '0x29', '+41', 'Infinity', 2147483648, Number.MAX_SAFE_INTEGER];
    for (const method of ['POST', 'PUT']) {
        for (const campo of ['professor_ids', 'aluno_ids']) {
            for (const id of invalidos) {
                it(`${method} rejeita ${campo} com ${JSON.stringify(id)} sem descartar a entrada`, async () => {
                    const body = { ...payloadProjeto, [campo]: [campo === 'professor_ids' ? 41 : 42, id] };
                    const res = await request(method, body, method === 'POST' ? '/projetos' : '/projetos/51');
                    assert.equal(res.status, 400); assert.equal(typeof res.data.erro, 'string'); assert.equal(banco.chamadas.length, 0);
                });
            }
            for (const valor of [null, 41, '41', {}, []]) {
                it(`${method} rejeita lista inválida ou vazia em ${campo}: ${JSON.stringify(valor)}`, async () => {
                    const res = await request(method, { ...payloadProjeto, [campo]: valor }, method === 'POST' ? '/projetos' : '/projetos/51');
                    assert.equal(res.status, 400); assert.equal(banco.chamadas.length, 0);
                });
            }
            it(`${method} rejeita duplicidade numérica normalizada em ${campo}`, async () => {
                const id = campo === 'professor_ids' ? 41 : 42;
                const res = await request(method, { ...payloadProjeto, [campo]: [id, `0${id}`] }, method === 'POST' ? '/projetos' : '/projetos/51');
                assert.equal(res.status, 400); assert.equal(banco.chamadas.length, 0);
            });
        }
        for (const campo of ['professor_ids', 'aluno_ids']) {
            it(`${method} mantém obrigatória a presença de ${campo}`, async () => {
                const body = { ...payloadProjeto }; delete body[campo];
                assert.equal((await request(method, body, method === 'POST' ? '/projetos' : '/projetos/51')).status, 400);
                assert.equal(banco.chamadas.length, 0);
            });
        }
    }
    it('preserva fallback professor_id com string decimal e normaliza IDs de listas', async () => {
        const body = { ...payloadProjeto, professor_id: '041', aluno_ids: ['042'] }; delete body.professor_ids;
        assert.equal((await request('POST', body)).status, 200);
        const insert = banco.chamadas.find(c => c.sql?.startsWith('INSERT INTO projeto ('));
        assert.equal(insert.parametros[3], 41);
    });
    for (const valor of [{}, null, '1e2', 0, 1.5]) {
        it(`não ignora professor_id inválido mesmo com lista válida: ${JSON.stringify(valor)}`, async () => {
            assert.equal((await request('POST', { ...payloadProjeto, professor_id: valor })).status, 400);
            assert.equal(banco.chamadas.length, 0);
        });
    }
    it('responsável explícito divergente da lista não é silenciosamente substituído', async () => {
        assert.equal((await request('POST', { ...payloadProjeto, professor_id: 99 })).status, 400);
        assert.equal(banco.chamadas.length, 0);
    });
    for (const body of [null, [], 'projeto', {}]) {
        it(`corpo inválido é recusado antes de SQL: ${JSON.stringify(body)}`, async () => {
            assert.equal((await request('POST', body)).status, 400); assert.equal(banco.chamadas.length, 0);
        });
    }
    for (const id of ['0', '-1', '1.5', 'abc', '2147483648']) {
        it(`edição recusa ID de projeto inválido: ${id}`, async () => {
            assert.equal((await request('PUT', payloadProjeto, `/projetos/${id}`)).status, 400); assert.equal(banco.chamadas.length, 0);
        });
    }
    for (const campo of ['professor_ids', 'aluno_ids']) {
        it(`participante inexistente em ${campo} causa rollback sem gravação`, async () => {
            assert.equal((await request('POST', { ...payloadProjeto, [campo]: [999] })).status, 400);
            assert.equal(banco.chamadas.some(c => /^(INSERT|UPDATE|DELETE)/.test(c.sql || '')), false);
            assert.ok(banco.chamadas.some(c => c.tipo === 'rollback')); assert.equal(banco.chamadas.at(-1).tipo, 'release');
        });
    }
});

describe('P10: FKs, diagnóstico e consistência em MySQL descartável real', { skip: !mysqlDisponivel, concurrency: 1 }, () => {
    let instancia, banco, pool, app, servidor, origem, cookie;
    const body = (nome = 'Projeto P10') => ({ status:'em andamento', nome, descricao: 'fixture', objetivo: 'fixture', professor_ids: [41, 43], aluno_ids: [42, 44] });
    async function request(method, path, payload) {
        const res = await fetch(origem + path, { method, signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: payload === undefined ? undefined : JSON.stringify(payload) });
        return { status: res.status, data: await res.json() };
    }
    before(async () => {
        instancia = await iniciarMysqlTemporario('p10'); banco = instancia.banco;
        console.log('MySQL descartável P10:', (await banco.query('SELECT VERSION() AS v'))[0][0].v);
        await executarMigracoes(banco);
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (1,?,?,?)', [contas[0].usuario, contas[0].senha, contas[0].perfil]);
        pool = await conectarPool({ host: '127.0.0.1', port: banco.config.port, database: 'fixture_p01', user: 'root' });
        app = await carregarAplicacaoIsolada(); app.configurarBancoDeTeste(pool);
        servidor = app.app.listen(0, '127.0.0.1'); await new Promise(resolve => servidor.once('listening', resolve)); origem = `http://127.0.0.1:${servidor.address().port}`;
        const login = await fetch(origem + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: contas[0].usuario, senha: senhaFixture }) });
        assert.equal(login.status, 200); cookie = login.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(async () => {
        await banco.query('DROP TRIGGER IF EXISTS fixture_p10_falha');
        for (const t of ['subprojeto_aluno','quiz_resposta','quiz_resultado','recuperacao_senha','contatos_recuperacao','sessoes','quiz_alternativa','quiz_pergunta','quiz','subprojeto', 'limpeza_arquivos', 'conta_pessoa', 'documentos', 'projeto_professor', 'projeto_aluno', 'projeto', 'professor', 'aluno']) await banco.query(`DELETE FROM ${t}`);
        await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Prof A'),(43,'Prof B')");
        await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno A'),(44,'Aluno B')");
    });
    after(async () => {
        if (servidor) { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
        if (pool) await pool.end(); if (instancia) await instancia.encerrar();
    });
    it('cria múltiplos membros e edição preserva a equipe não alterada', async () => {
        const criado = await request('POST', '/projetos', body()); assert.equal(criado.status, 200);
        assert.equal((await request('PUT', `/projetos/${criado.data.id}`, body('Novo título'))).status, 200);
        const leitura = await request('GET', `/projetos/${criado.data.id}`);
        assert.equal(leitura.data.nome, 'Novo título'); assert.deepEqual(leitura.data.professor_ids, [41, 43]); assert.deepEqual(leitura.data.aluno_ids, [42, 44]);
        assert.equal((await banco.query('SELECT professor_id FROM projeto WHERE id=?', [criado.data.id]))[0][0].professor_id, 41);
    });
    for (const campo of ['professor_ids', 'aluno_ids']) {
        it(`POST/PUT com participante ausente em ${campo} não deixa mudança parcial`, async () => {
            const criado = await request('POST', '/projetos', body());
            const invalido = { ...body('Não gravar'), [campo]: [999] };
            assert.equal((await request('POST', '/projetos', invalido)).status, 400);
            assert.equal((await request('PUT', `/projetos/${criado.data.id}`, invalido)).status, 400);
            assert.equal((await banco.query('SELECT * FROM projeto'))[0].length, 1);
            const leitura = await request('GET', `/projetos/${criado.data.id}`);
            assert.equal(leitura.data.nome, 'Projeto P10'); assert.deepEqual(leitura.data.professor_ids, [41, 43]); assert.deepEqual(leitura.data.aluno_ids, [42, 44]);
        });
    }
    it('projeto inexistente não recebe participantes pela edição', async () => {
        assert.equal((await request('PUT', '/projetos/999', body())).status, 404);
        assert.equal((await banco.query('SELECT * FROM projeto_professor'))[0].length, 0);
    });
    it('falha intermediária real reverte título e todos os vínculos', async () => {
        const criado = await request('POST', '/projetos', body());
        await banco.query("CREATE TRIGGER fixture_p10_falha BEFORE INSERT ON projeto_aluno FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='falha fixture'");
        assert.equal((await request('PUT', `/projetos/${criado.data.id}`, body('Não gravar'))).status, 500);
        const leitura = await request('GET', `/projetos/${criado.data.id}`);
        assert.equal(leitura.data.nome, 'Projeto P10'); assert.deepEqual(leitura.data.professor_ids, [41,43]); assert.deepEqual(leitura.data.aluno_ids, [42,44]);
    });
    for (const [tabela, campo, valor] of [['projeto_professor','projeto_id',999], ['projeto_professor','professor_id',999], ['projeto_aluno','projeto_id',999], ['projeto_aluno','aluno_id',999]]) {
        it(`SQL direto rejeita órfão ${tabela}.${campo}`, async () => {
            const criado = await request('POST', '/projetos', body());
            const col = tabela === 'projeto_professor' ? 'professor_id' : 'aluno_id';
            const parametros = [campo === 'projeto_id' ? valor : criado.data.id, campo === col ? valor : col === 'professor_id' ? 41 : 42];
            await assert.rejects(banco.query(`INSERT INTO ${tabela} (projeto_id,${col}) VALUES (?,?)`, parametros), e => e.code === 'ER_NO_REFERENCED_ROW_2');
        });
    }
    it('SQL direto rejeita responsável ausente e pares duplicados', async () => {
        await assert.rejects(banco.query("INSERT INTO projeto (titulo,professor_id) VALUES ('Órfão',999)"), e => e.code === 'ER_NO_REFERENCED_ROW_2');
        const criado = await request('POST', '/projetos', body());
        for (const [t,c,id] of [['projeto_professor','professor_id',41],['projeto_aluno','aluno_id',42]]) {
            await assert.rejects(banco.query(`INSERT INTO ${t} (projeto_id,${c}) VALUES (?,?)`, [criado.data.id,id]), e => e.code === 'ER_DUP_ENTRY');
        }
    });
    it('FK impede exclusão SQL de membro referenciado; rota existente remove de forma consistente', async () => {
        await request('POST', '/projetos', body());
        await assert.rejects(banco.query('DELETE FROM professor WHERE id=41'), e => e.code === 'ER_ROW_IS_REFERENCED_2');
        assert.equal((await request('DELETE', '/usuarios/41?perfil=professor')).status, 200);
        assert.equal((await banco.query('SELECT professor_id FROM projeto'))[0][0].professor_id, null);
        assert.equal((await banco.query('SELECT * FROM projeto_professor WHERE professor_id=41'))[0].length, 0);
    });
    it('histórico não encobre FK removida do esquema', async () => {
        await banco.query('ALTER TABLE projeto DROP FOREIGN KEY labhist_fk_projeto_responsavel');
        try { await assert.rejects(verificarEsquema(banco), /Restrição ausente/); }
        finally { await banco.query(v3.passos.at(-1).sql); }
    });
});

describe('P10: atualização de legado em MySQL real, sem limpeza automática', { skip: !mysqlDisponivel, concurrency: 1 }, () => {
    let instancia, banco;
    before(async () => {
        instancia = await iniciarMysqlTemporario('p10'); banco = instancia.banco;
        await banco.query("CREATE USER 'fixture_p10_diag'@'127.0.0.1' IDENTIFIED BY 'fixture-p10-only'");
        await banco.query("GRANT SELECT ON fixture_p01.* TO 'fixture_p10_diag'@'127.0.0.1'");
    });
    beforeEach(async () => {
        for (const t of ['subprojeto_aluno','quiz_resposta','quiz_resultado','recuperacao_senha','contatos_recuperacao','sessoes','quiz_alternativa','quiz_pergunta','quiz','subprojeto', 'limpeza_arquivos', 'conta_pessoa', 'documentos','projeto_professor','projeto_aluno','projeto','professor','aluno','usuarios','schema_migrations']) await banco.query(`DROP TABLE IF EXISTS ${t}`);
        await executarMigracoes(banco, 2);
        await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Fixture')");
        await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Fixture')");
        await banco.query("INSERT INTO projeto (id,titulo,professor_id) VALUES (51,'Fixture',41)");
        await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');
        await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42)');
    });
    after(async () => { if (instancia) await instancia.encerrar(); });
    async function snapshot() { return Promise.all(['projeto','projeto_professor','projeto_aluno'].map(async t => [t,(await banco.query(`SELECT * FROM ${t} ORDER BY id`))[0]])); }
    it('migra 2→3 com mesmos dados e repete sem novas restrições', async () => {
        const antes = await snapshot();
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas:Array.from({length:versaoEsperada-3+1},(_,i)=>i+3) });
        assert.deepEqual(await snapshot(), antes.map(([t,rows])=>[t,t==='projeto'?rows.map(p=>({...p,status:null})):rows]));
        assert.equal((await diagnosticarProjetos(banco)).incidencias, 0);
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas: [] });
    });
    for (const [t,c] of [['projeto_professor','projeto_id'],['projeto_professor','professor_id'],['projeto_aluno','projeto_id'],['projeto_aluno','aluno_id'],['projeto','professor_id']]) {
        it(`órfão legado ${t}.${c} interrompe antes das FKs e preserva todos os dados`, async () => {
            await banco.query(`UPDATE ${t} SET ${c}=999`);
            const antes = await snapshot();
            const diag = await diagnosticarProjetos(banco); assert.ok(diag.incidencias > 0); assert.equal(diag.orfaos[`${t}.${c}`], 1);
            await assert.rejects(executarMigracoes(banco), /Legados incompatíveis/);
            assert.deepEqual(await snapshot(), antes);
            assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, 2);
            assert.equal((await banco.query("SELECT * FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME LIKE 'labhist_fk_%'"))[0].length, 0);
        });
    }
    it('pares legados duplicados interrompem sem deduplicação ou exclusão', async () => {
        await banco.query('ALTER TABLE projeto_professor DROP INDEX projeto_professor_unique');
        await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');
        const antes = await snapshot();
        assert.equal((await diagnosticarProjetos(banco)).duplicados.projeto_professor, 1);
        await assert.rejects(executarMigracoes(banco), /Legados incompatíveis/); assert.deepEqual(await snapshot(), antes);
    });
    it('legado sem índice UNIQUE recebe proteção após diagnóstico limpo', async () => {
        await banco.query('ALTER TABLE projeto_aluno DROP INDEX projeto_aluno_unique');
        await executarMigracoes(banco);
        await assert.rejects(banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42)'), e => e.code === 'ER_DUP_ENTRY');
    });
    it('FK divergente é recusada sem remoção/substituição automática', async () => {
        await banco.query('ALTER TABLE projeto_professor ADD CONSTRAINT fixture_cascade FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE CASCADE');
        const antes = await snapshot(); await assert.rejects(executarMigracoes(banco), /FK incompatível/); assert.deepEqual(await snapshot(), antes);
        assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, 2);
    });
    it('FK equivalente com nome diferente é preservada', async () => {
        await banco.query('ALTER TABLE projeto ADD CONSTRAINT fixture_responsavel FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT');
        await executarMigracoes(banco); await verificarEsquema(banco);
        assert.equal((await banco.query("SELECT * FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='fixture_responsavel'"))[0].length, 1);
    });
    it('falha parcial no DDL permite retomada sem reaplicar FK pronta', async () => {
        let falhou = false;
        const proxy = { async query(sql,...args) {
            if (sql.includes('ADD CONSTRAINT labhist_fk_pa_projeto') && !falhou) { falhou=true; throw new Error('falha fixture'); }
            return banco.query(sql,...args);
        } };
        await assert.rejects(executarMigracoes(proxy));
        assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, 2);
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas:Array.from({length:versaoEsperada-3+1},(_,i)=>i+3) });
    });
    it('CLI de diagnóstico usa somente leitura e imprime contagens sem registros/segredos', async () => {
        await banco.query('UPDATE projeto SET professor_id=999'); const antes = await snapshot();
        const resultado = await new Promise((resolve, reject) => {
            const filho = spawn(process.execPath, [fileURLToPath(new URL('../scripts/banco.js',import.meta.url)),'diagnose'], { windowsHide: true,
                env: { ...process.env, DB_HOST: '127.0.0.1', DB_PORT: String(banco.config.port), DB_NAME: 'fixture_p01', DB_USER: 'fixture_p10_diag', DB_PASSWORD: 'fixture-p10-only' } });
            let out=''; filho.stdout.on('data', b => out+=b); filho.stderr.on('data', b => out+=b);
            filho.on('error', reject); filho.on('close', codigo => resolve({ codigo, out }));
        });
        assert.equal(resultado.codigo, 0); assert.equal(JSON.parse(resultado.out).orfaos['projeto.professor_id'], 1);
        assert.equal(resultado.out.includes('fixture-p10-only'), false); assert.equal(resultado.out.includes('Fixture'), false);
        assert.deepEqual(await snapshot(), antes);
    });
});
