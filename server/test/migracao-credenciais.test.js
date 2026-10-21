import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { migrarCredenciais } from '../migracao-credenciais.js';
import { gerarHash, verificarSenha, hashValido } from '../credenciais.js';
import { carregarAplicacaoIsolada } from './helpers/aplicacao.js';
import { mysqlDisponivel, iniciarMysqlTemporario } from './helpers/mysql-temporario.js';

describe('P01: migração em MySQL descartável real', { skip: !mysqlDisponivel, concurrency: 1 }, () => {
    let instancia, banco, hash;
    before(async () => {
        instancia = await iniciarMysqlTemporario(); banco = instancia.banco;
        console.log('MySQL descartável P01:', (await banco.query('SELECT VERSION() AS versao'))[0][0].versao);
        hash = await gerarHash('senha-ja-convertida');
        await banco.query('CREATE TABLE usuarios (id INT PRIMARY KEY, usuario VARCHAR(100) UNIQUE, senha VARCHAR(255) NOT NULL, perfil VARCHAR(50)) ENGINE=InnoDB');
    });
    beforeEach(async () => {
        await banco.query('DROP TRIGGER IF EXISTS fixture_falha');
        await banco.query('DELETE FROM usuarios');
        await banco.query('INSERT INTO usuarios VALUES (1, ?, ?, ?), (2, ?, ?, ?), (3, ?, ?, ?)', [
            'legado-a', '  senha com espaços ç🔬  ', 'administrador',
            'legado-b', 'outra-senha-fixture', 'aluno',
            'convertido', hash, 'professor'
        ]);
    });
    after(async () => { if (instancia) await instancia.encerrar(); });
    it('simulação padrão não modifica nenhuma senha', async () => {
        const [antes] = await banco.query('SELECT * FROM usuarios ORDER BY id');
        assert.deepEqual(await migrarCredenciais(banco), { total: 3, convertidas: 2, preservadas: 1, aplicado: false });
        const [depois] = await banco.query('SELECT * FROM usuarios ORDER BY id');
        assert.deepEqual(depois, antes);
    });
    it('aplica preservando senhas, identidades e perfis e repete sem alterações', async () => {
        const resultado = await migrarCredenciais(banco, true);
        assert.equal(resultado.convertidas, 2);
        const [rows] = await banco.query('SELECT * FROM usuarios ORDER BY id');
        assert.ok(rows.every(row => hashValido(row.senha)));
        assert.ok(await verificarSenha('  senha com espaços ç🔬  ', rows[0].senha));
        assert.ok(await verificarSenha('outra-senha-fixture', rows[1].senha));
        assert.equal(rows[2].senha, hash);
        assert.deepEqual(rows.map(({ id, usuario, perfil }) => ({ id, usuario, perfil })), [
            { id: 1, usuario: 'legado-a', perfil: 'administrador' },
            { id: 2, usuario: 'legado-b', perfil: 'aluno' },
            { id: 3, usuario: 'convertido', perfil: 'professor' }
        ]);
        assert.equal((await migrarCredenciais(banco, true)).convertidas, 0);
        assert.deepEqual((await banco.query('SELECT * FROM usuarios ORDER BY id'))[0], rows);
    });
    it('erro SQL após primeira conversão reverte todas as gravações', async () => {
        const [antes] = await banco.query('SELECT * FROM usuarios ORDER BY id');
        await banco.query("CREATE TRIGGER fixture_falha BEFORE UPDATE ON usuarios FOR EACH ROW BEGIN IF NEW.id = 2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha fixture'; END IF; END");
        await assert.rejects(migrarCredenciais(banco, true));
        assert.deepEqual((await banco.query('SELECT * FROM usuarios ORDER BY id'))[0], antes);
    });
    it('hash malformado interrompe migração sem conversões parciais', async () => {
        await banco.query('UPDATE usuarios SET senha = ? WHERE id = 2', ['$scrypt$invalido']);
        const [antes] = await banco.query('SELECT * FROM usuarios ORDER BY id');
        await assert.rejects(migrarCredenciais(banco, true), /incompatível/);
        assert.deepEqual((await banco.query('SELECT * FROM usuarios ORDER BY id'))[0], antes);
    });
    it('conta migrada autentica pela API usando persistência real', async () => {
        await migrarCredenciais(banco, true);
        const app = await carregarAplicacaoIsolada(); app.configurarBancoDeTeste(banco);
        const servidor = app.app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        try {
            const res = await fetch(`http://127.0.0.1:${servidor.address().port}/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: 'legado-a', senha: '  senha com espaços ç🔬  ' })
            });
            assert.equal(res.status, 200); assert.equal((await res.json()).perfil, 'administrador');
            assert.ok(res.headers.getSetCookie().length > 0);
        } finally { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
    });
    it('recusa mecanismo sem suporte transacional', async () => {
        await banco.query('ALTER TABLE usuarios ENGINE=MyISAM');
        try { await assert.rejects(migrarCredenciais(banco, true), /InnoDB/); }
        finally { await banco.query('ALTER TABLE usuarios ENGINE=InnoDB'); }
    });
});
