import assert from 'node:assert/strict';
import { before, after, describe, it } from 'node:test';
import { gerarHash, verificarSenha, hashValido, criarLimitadorLogin } from '../credenciais.js';
import { carregarConfiguracao } from '../configuracao.js';
import { carregarAplicacaoIsolada, criarBancoSimulado, contas, senhaFixture } from './helpers/aplicacao.js';

describe('P01: hash e configuração', () => {
    it('usa salt exclusivo, preserva espaços/Unicode e rejeita senha incorreta ou hash como senha', async () => {
        const senha = '  Senha ç🔬 de teste  ';
        const a = await gerarHash(senha), b = await gerarHash(senha);
        assert.notEqual(a, b);
        assert.ok(hashValido(a));
        assert.ok(a.length <= 255);
        assert.ok(await verificarSenha(senha, a));
        assert.equal(await verificarSenha(senha.trim(), a), false);
        assert.equal(await verificarSenha(a, a), false);
        assert.equal(await verificarSenha(senha, senha), false);
        assert.equal(await verificarSenha(senha, a.replace('65536', '999999999')), false);
    });
    for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SESSION_SECRET']) {
        it(`falha sem ${nome} sem incluir segredo no diagnóstico`, () => {
            const env = { DB_HOST: 'test', DB_USER: 'test', DB_PASSWORD: 'segredo-nao-imprimir', DB_NAME: 'test', SESSION_SECRET: 'x'.repeat(40) };
            delete env[nome];
            assert.throws(() => carregarConfiguracao(env), erro => erro.message.includes(nome) && !erro.message.includes('segredo-nao-imprimir'));
        });
    }
    it('rejeita segredo curto e porta inválida', () => {
        const env = { DB_HOST: 'test', DB_USER: 'test', DB_PASSWORD: 'test', DB_NAME: 'test', SESSION_SECRET: 'curto' };
        assert.throws(() => carregarConfiguracao(env), /SESSION_SECRET/);
        assert.throws(() => carregarConfiguracao({ ...env, SESSION_SECRET: 'x'.repeat(40), DB_PORT: 'abc' }), /DB_PORT/);
    });
    it('limita por conta e por IP, ignora cabeçalho forjado e libera após janela', () => {
        let tempo = 0;
        const limitar = criarLimitadorLogin(() => tempo);
        let liberadas = 0, bloqueadas = 0;
        const res = { set() {}, status(status) { assert.equal(status, 429); return this; }, json() { bloqueadas++; } };
        for (let i = 0; i < 11; i++) limitar({ ip: `ip-${i}`, body: { usuario: 'mesma-conta' } }, res, () => liberadas++);
        assert.equal(liberadas, 10); assert.equal(bloqueadas, 1);
        tempo = 900001;
        limitar({ ip: 'ip-0', body: { usuario: 'mesma-conta' } }, res, () => liberadas++);
        assert.equal(liberadas, 11);
        for (let i = 0; i < 31; i++) limitar({ ip: 'outro-ip', body: { usuario: `conta-${i}` } }, res, () => liberadas++);
        assert.equal(bloqueadas, 2);
    });
});

describe('P01: autenticação HTTP e sessões reais', { concurrency: 1 }, () => {
    let app, servidor, origem, banco, cookie;
    async function request(url, body, sessao = cookie, method = 'POST') {
        return fetch(origem + url, { method, headers: { 'Content-Type': 'application/json', ...(sessao ? { Cookie: sessao } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(body) });
    }
    before(async () => {
        app = await carregarAplicacaoIsolada(); banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco);
        servidor = app.app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        origem = `http://127.0.0.1:${servidor.address().port}`;
    });
    after(async () => { servidor?.closeAllConnections(); if (servidor) await new Promise(resolve => servidor.close(resolve)); });
    it('nega ID de outra pessoa e enumeração pública sem consultar banco nem criar cookie', async () => {
        for (const [url, method] of [['/sessao/pessoa', 'POST'], ['/pessoas?perfil=aluno', 'GET']]) {
            banco.chamadas.length = 0;
            const res = await request(url, { perfil: 'administrador', pessoa_id: 42 }, undefined, method);
            assert.equal(res.status, 410); assert.equal(res.headers.getSetCookie().length, 0);
            assert.equal(banco.chamadas.length, 0);
        }
    });
    it('sessão legada com origem pessoa não autoriza acesso', async () => {
        app.rotasDeTeste.post('/fixture-sessao-antiga', (req, res) => {
            req.session.identidade = { origem: 'pessoa', perfil: 'administrador', id: 1 };
            res.json({ fixture: true });
        });
        const res = await request('/fixture-sessao-antiga', {});
        const antiga = res.headers.getSetCookie()[0].split(';')[0];
        assert.equal((await request('/usuarios', undefined, antiga, 'GET')).status, 401);
    });
    for (const [nome, body] of [
        ['senha errada', { usuario: 'fixture-admin', senha: 'errada' }],
        ['usuário desconhecido', { usuario: 'nao-existe', senha: senhaFixture }],
        ['hash como senha', { usuario: 'fixture-admin', senha: contas[0].senha }],
        ['senha objeto', { usuario: 'fixture-admin', senha: {} }],
        ['usuário objeto', { usuario: {}, senha: senhaFixture }],
        ['campo ausente', {}],
        ['senha excessiva', { usuario: 'fixture-admin', senha: 'a'.repeat(1025) }]
    ]) {
        it(`resposta uniforme para ${nome}`, async () => {
            const res = await request('/login', body);
            assert.equal(res.status, 401); assert.deepEqual(await res.json(), { erro: 'Usuario ou senha incorretos.' });
            assert.equal(res.headers.getSetCookie().length, 0);
        });
    }
    it('não autentica senha legada em texto puro', async () => {
        const antigo = criarBancoSimulado();
        app.configurarBancoDeTeste({ async query() { return [[{ ...contas[0], senha: senhaFixture }]]; } });
        assert.equal((await request('/login', { usuario: 'fixture-admin', senha: senhaFixture })).status, 401);
        app.configurarBancoDeTeste(antigo);
    });
    it('perfil enviado pelo cliente não eleva a conta e login não revela hash', async () => {
        const res = await request('/login', { usuario: 'fixture-aluno', senha: senhaFixture, perfil: 'aluno', pessoa_id: 1 });
        assert.equal(res.status, 200);
        const data = await res.json(); assert.equal(data.perfil, 'aluno'); assert.equal(data.senha, undefined);
        cookie = res.headers.getSetCookie()[0].split(';')[0];
        assert.equal((await request('/cadastro', { usuario: 'invasor', senha: senhaFixture })).status, 403);
    });
    it('regenera sessão no login administrativo e invalida a sessão anterior', async () => {
        const antiga = cookie;
        const res = await request('/login', { usuario: 'fixture-admin', senha: senhaFixture });
        assert.equal(res.status, 200); cookie = res.headers.getSetCookie()[0].split(';')[0];
        assert.notEqual(cookie, antiga);
        assert.equal((await request('/usuarios', undefined, antiga, 'GET')).status, 401);
        assert.equal((await request('/usuarios', undefined, cookie, 'GET')).status, 200);
    });
    it('administrador cadastra somente hash e a nova conta entra com a mesma senha', async () => {
        banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco);
        const res = await request('/cadastro', { usuario: 'nova-fixture', senha: senhaFixture, perfil: 'professor', pessoa_id:41 });
        assert.equal(res.status, 200);
        const insert = banco.chamadas.find(c => c.sql?.startsWith('INSERT INTO usuarios'));
        assert.ok(hashValido(insert.parametros[1]));
        assert.ok(await verificarSenha(senhaFixture, insert.parametros[1]));
        app.configurarBancoDeTeste({ async query(sql) { return sql.includes('FROM conta_pessoa') ? [[{id:41,nome:'Professor fixture'}]] : [[{ id: 200, usuario: 'nova-fixture', senha: insert.parametros[1], perfil: 'professor' }]]; } });
        assert.equal((await request('/login', { usuario: 'nova-fixture', senha: senhaFixture }, '')).status, 200);
        app.configurarBancoDeTeste(banco);
    });
    it('logout invalida o cookie e encerra acesso', async () => {
        assert.equal((await request('/logout', {})).status, 200);
        assert.equal((await request('/usuarios', undefined, cookie, 'GET')).status, 401);
        cookie = undefined;
    });
    it('erro SQL no login/cadastro não revela credenciais nem SQL na resposta', async () => {
        const login = await request('/login', { usuario: 'fixture-professor', senha: senhaFixture });
        // Obter sessão administrativa antes de simular indisponibilidade do banco.
        assert.equal(login.status, 200);
        const admin = await request('/login', { usuario: 'fixture-admin', senha: senhaFixture });
        const adminCookie = admin.headers.getSetCookie()[0].split(';')[0];
        app.configurarBancoDeTeste({ async query() { throw new Error('segredo-fixture-que-nao-pode-aparecer SELECT senha'); } });
        try {
            for (const url of ['/login', '/cadastro']) {
                const res = await request(url, { usuario: 'fixture-admin', senha: senhaFixture }, adminCookie);
                assert.equal(res.status, 500);
                const resposta = await res.text();
                assert.equal(resposta.includes('segredo-fixture'), false);
                assert.equal(resposta.includes('SELECT'), false);
                assert.equal(resposta.includes(senhaFixture), false);
            }
        } finally { app.configurarBancoDeTeste(banco); }
    });
    it('bloqueia repetição de tentativas HTTP antes de SQL', async () => {
        app.configurarBancoDeTeste(banco);
        for (let i = 0; i < 10; i++) assert.equal((await request('/login', { usuario: 'limite-fixture', senha: 'errada' })).status, 401);
        banco.chamadas.length = 0;
        const res = await request('/login', { usuario: 'limite-fixture', senha: 'errada' });
        assert.equal(res.status, 429); assert.equal(res.headers.get('retry-after'), '900'); assert.equal(banco.chamadas.length, 0);
    });
});

it('P03: CLI de banco não exige configuração web ou SMTP',()=>{const c=carregarConfiguracao({DB_HOST:'fixture.invalid',DB_USER:'fixture',DB_PASSWORD:'fixture',DB_NAME:'fixture',NODE_ENV:'production',SMTP_HOST:'parcial'},false);assert.equal(c.banco.host,'fixture.invalid');assert.equal(c.operacao,undefined);assert.equal(c.recuperacao,undefined);});
