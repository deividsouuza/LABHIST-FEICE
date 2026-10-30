import {versaoEsperada} from '../banco/migracoes.js';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { executarMigracoes, verificarEsquema, diagnosticoBanco } from '../banco/migrador.js';
import { conectarBanco } from '../banco/conexao.js';
import { tabelas } from '../banco/esquema.js';
import { mysqlDisponivel, iniciarMysqlTemporario } from './helpers/mysql-temporario.js';

describe('P04: instalação e atualização em MySQL descartável real', { skip: !mysqlDisponivel, concurrency: 1 }, () => {
    let instancia, banco, leitura;
    before(async () => {
        instancia = await iniciarMysqlTemporario('p04'); banco = instancia.banco;
        console.log('MySQL descartável P04:', (await banco.query('SELECT VERSION() AS v'))[0][0].v);
        await banco.query("CREATE USER 'fixture_p04_leitura'@'127.0.0.1' IDENTIFIED BY 'fixture-p04-only'");
        await banco.query("GRANT SELECT ON fixture_p01.* TO 'fixture_p04_leitura'@'127.0.0.1'");
        leitura = await mysql.createConnection({ host: '127.0.0.1', port: banco.config.port, database: 'fixture_p01', user: 'fixture_p04_leitura', password: 'fixture-p04-only' });
    });
    beforeEach(async () => {
        // Apenas o schema da instância criada por esta suíte, nunca o banco do projeto.
        for (const tabela of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin','mensagem','mensagem_conversa','subprojeto_aluno','quiz_resposta','quiz_resultado','recuperacao_senha','contatos_recuperacao','sessoes','quiz_alternativa','quiz_pergunta','quiz','subprojeto', 'limpeza_arquivos', 'conta_pessoa', 'documentos', 'projeto_aluno', 'projeto_professor', 'projeto', 'aluno', 'professor', 'usuarios', 'schema_migrations']) {
            await banco.query(`DROP TABLE IF EXISTS \`${tabela}\``);
        }
    });
    after(async () => { if (leitura) await leitura.end(); if (instancia) await instancia.encerrar(); });
    it('instala banco vazio com documentos e sem conta padrão', async () => {
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas:Array.from({length:versaoEsperada-1+1},(_,i)=>i+1) });
        assert.deepEqual(await verificarEsquema(banco), { versao:versaoEsperada });
        assert.equal((await banco.query('SELECT * FROM usuarios'))[0].length, 0);
        for (const tabela of Object.keys(tabelas)) await banco.query(`SELECT * FROM \`${tabela}\` LIMIT 0`);
        await banco.query("INSERT INTO projeto (titulo) VALUES ('fixture')");
        await banco.query("INSERT INTO documentos (projeto_id, descricao, arquivo_caminho, arquivo_nome, enviado_por, enviado_por_perfil) VALUES (1, 'fixture', 'fixture.pdf', 'fixture.pdf', 900, 'professor')");
        assert.equal((await banco.query('SELECT * FROM documentos'))[0][0].enviado_por, 900);
    });
    it('segunda execução não duplica alterações nem registros do histórico', async () => {
        await executarMigracoes(banco);
        const [antes] = await banco.query('SELECT * FROM schema_migrations');
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas: [] });
        assert.deepEqual((await banco.query('SELECT * FROM schema_migrations'))[0], antes);
    });
    it('atualiza versão 1 para 2 preservando dados fictícios', async () => {
        await executarMigracoes(banco, 1);
        await banco.query("INSERT INTO usuarios (usuario, senha) VALUES ('fixture', 'fixture-sem-valor-real')");
        await banco.query("INSERT INTO aluno (nome, matricula) VALUES ('Fixture', '000123')");
        const [antes] = await banco.query('SELECT * FROM aluno');
        await assert.rejects(verificarEsquema(banco), /desatualizado/);
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas:Array.from({length:versaoEsperada-2+1},(_,i)=>i+2) });
        assert.deepEqual((await banco.query('SELECT * FROM aluno'))[0], antes);
        assert.equal((await banco.query('SELECT senha FROM usuarios'))[0][0].senha, 'fixture-sem-valor-real');
    });
    it('adota legado sem histórico, adiciona opcionais e preserva autoria desconhecida/FK existente', async () => {
        await executarMigracoes(banco, 1);
        await banco.query('DROP TABLE schema_migrations');
        for (const [t, c] of [['professor', 'matricula'], ['aluno', 'telefone'], ['aluno', 'curso'], ['projeto', 'objetivo'], ['projeto', 'professor_id']]) await banco.query(`ALTER TABLE ${t} DROP COLUMN ${c}`);
        await banco.query("INSERT INTO usuarios (id, usuario, senha) VALUES (1, 'fixture', 'fixture-sem-valor-real')");
        await banco.query("INSERT INTO projeto (id, titulo) VALUES (1, 'Projeto legado')");
        await banco.query(`CREATE TABLE documentos (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, projeto_id INT NOT NULL,
            descricao VARCHAR(255) NOT NULL, arquivo_caminho VARCHAR(500) NOT NULL, arquivo_nome VARCHAR(255) NOT NULL,
            enviado_por INT NOT NULL, enviado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE,
            CONSTRAINT autor_legado FOREIGN KEY (enviado_por) REFERENCES usuarios(id)) ENGINE=InnoDB`);
        await banco.query("INSERT INTO documentos (projeto_id, descricao, arquivo_caminho, arquivo_nome, enviado_por) VALUES (1, 'legado', 'preservar.pdf', 'preservar.pdf', 1)");
        await executarMigracoes(banco);
        const [[doc]] = await banco.query('SELECT * FROM documentos');
        assert.equal(doc.enviado_por, 1); assert.equal(doc.enviado_por_perfil, null); assert.equal(doc.arquivo_caminho, 'preservar.pdf');
        assert.equal((await banco.query("SELECT * FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='autor_legado'"))[0].length, 1);
    });
    it('coluna incompatível interrompe antes de executar DDL de atualização', async () => {
        await executarMigracoes(banco, 1);
        await banco.query('ALTER TABLE aluno MODIFY COLUMN telefone INT NULL');
        await assert.rejects(executarMigracoes(banco), /Coluna incompatível: aluno.telefone/);
        assert.equal((await banco.query("SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='documentos'"))[0].length, 0);
        assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, 1);
    });
    it('recusa tabela sem suporte transacional', async () => {
        await executarMigracoes(banco, 1);
        await banco.query('ALTER TABLE aluno ENGINE=MyISAM');
        await assert.rejects(executarMigracoes(banco), /esperado InnoDB/);
    });
    it('recusa histórico com checksum alterado', async () => {
        await executarMigracoes(banco);
        await banco.query("UPDATE schema_migrations SET checksum = REPEAT('0',64) WHERE versao=1");
        await assert.rejects(verificarEsquema(banco), /incompatível/);
        await assert.rejects(executarMigracoes(banco), /incompatível/);
    });
    it('recusa versão futura e lacuna no histórico', async () => {
        await executarMigracoes(banco);
        await banco.query("INSERT INTO schema_migrations (versao,nome,checksum) VALUES (99,'fixture',REPEAT('0',64))");
        await assert.rejects(executarMigracoes(banco), /incompatível/);
        await banco.query('DELETE FROM schema_migrations WHERE versao IN (1,99)');
        await assert.rejects(verificarEsquema(banco), /incompatível/);
    });
    it('permissão SQL negada é diagnosticada sem segredo/SQL', async () => {
        await assert.rejects(executarMigracoes(leitura), erro => {
            assert.equal(diagnosticoBanco(erro), 'Permissão SQL insuficiente para a operação.');
            return true;
        });
    });
    it('partida e reinício verificam apenas leitura e funcionam sem permissão DDL', async () => {
        await executarMigracoes(banco);
        for (let i = 0; i < 2; i++) {
            const conexao = await conectarBanco({}, async () => leitura);
            assert.equal(conexao, leitura);
        }
        assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, versaoEsperada);
    });
    it('partida com versão incompatível fecha conexão e falha sem alterar banco', async () => {
        let fechou = false;
        const proxy = { query: (...args) => banco.query(...args), end: async () => { fechou = true; } };
        await assert.rejects(conectarBanco({}, async () => proxy), /Histórico.*ausente/);
        assert.ok(fechou);
        assert.equal((await banco.query('SHOW TABLES'))[0].length, 0);
    });
    it('interrupção no meio do DDL não registra versão e retomada conclui', async () => {
        let falhou = false;
        const proxy = { async query(sql, ...args) {
            if (sql.startsWith('CREATE TABLE IF NOT EXISTS `aluno`') && !falhou) { falhou = true; throw Object.assign(new Error('fixture SQL sensível'), { code: 'ER_TABLEACCESS_DENIED_ERROR' }); }
            return banco.query(sql, ...args);
        } };
        await assert.rejects(executarMigracoes(proxy));
        assert.equal((await banco.query('SELECT * FROM schema_migrations'))[0].length, 0);
        assert.deepEqual(await executarMigracoes(banco), { versao:versaoEsperada, aplicadas:Array.from({length:versaoEsperada-1+1},(_,i)=>i+1) });
    });
    it('lock concorrente impede outro executor e é liberado depois', async () => {
        await banco.query("SELECT GET_LOCK(SHA2(CONCAT('labhist:', DATABASE()),256),0)");
        try { await assert.rejects(executarMigracoes(leitura), /Outra migração/); }
        finally { await banco.query("SELECT RELEASE_LOCK(SHA2(CONCAT('labhist:', DATABASE()),256))"); }
        await executarMigracoes(banco);
    });
    it('CLI retorna erro e diagnóstico sanitizado para permissão negada', async () => {
        const resultado = await new Promise((resolve, reject) => {
            const filho = spawn(process.execPath, [fileURLToPath(new URL('../scripts/banco.js',import.meta.url)), 'migrate'], { windowsHide: true,
                env: { ...process.env, DB_HOST: '127.0.0.1', DB_PORT: String(banco.config.port), DB_NAME: 'fixture_p01', DB_USER: 'fixture_p04_leitura', DB_PASSWORD: 'fixture-p04-only' } });
            let out = ''; filho.stdout.on('data', b => out += b); filho.stderr.on('data', b => out += b);
            filho.on('error', reject); filho.on('close', codigo => resolve({ codigo, out }));
        });
        assert.equal(resultado.codigo, 1);
        assert.match(resultado.out, /Permissão SQL insuficiente/);
        assert.equal(resultado.out.includes('fixture-p04-only'), false);
        assert.equal(resultado.out.includes('CREATE TABLE'), false);
    });
});
