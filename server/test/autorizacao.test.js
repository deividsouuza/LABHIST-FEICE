import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { aluno, professor, payloadProjeto, contas, senhaFixture, criarBancoSimulado, carregarAplicacaoIsolada } from './helpers/aplicacao.js';

// Execute com node --experimental-vm-modules --test server/test/autorizacao.test.js.

const mutacoes = [
    { nome: 'criar conta', metodo: 'POST', url: '/cadastro', body: { usuario: 'fixture-nova', senha: senhaFixture, perfil: 'administrador' }, sql: /^INSERT INTO usuarios / },
    { nome: 'cadastrar aluno', metodo: 'POST', url: '/cadastro-dashboard', body: { ...aluno, perfil: 'aluno' }, sql: /^INSERT INTO aluno / },
    { nome: 'cadastrar professor', metodo: 'POST', url: '/cadastro-dashboard', body: { ...professor, perfil: 'professor' }, sql: /^INSERT INTO professor / },
    { nome: 'editar aluno', metodo: 'PUT', url: '/usuarios/42?perfil=aluno', body: aluno, sql: /^UPDATE aluno / },
    { nome: 'editar professor', metodo: 'PUT', url: '/usuarios/41?perfil=professor', body: professor, sql: /^UPDATE professor / },
    { nome: 'excluir aluno', metodo: 'DELETE', url: '/usuarios/42?perfil=aluno', sql: /^DELETE FROM aluno / },
    { nome: 'excluir professor', metodo: 'DELETE', url: '/usuarios/41?perfil=professor', sql: /^DELETE FROM professor / },
    { nome: 'criar projeto', metodo: 'POST', url: '/projetos', body: payloadProjeto, sql: /^INSERT INTO projeto / },
    { nome: 'editar projeto', metodo: 'PUT', url: '/projetos/51', body: payloadProjeto, sql: /^UPDATE projeto / },
    { nome: 'excluir projeto', metodo: 'DELETE', url: '/projetos/51', sql: /^DELETE FROM projeto / },
    { nome: 'excluir documento', metodo: 'DELETE', url: '/documentos/61', sql: /^DELETE FROM documentos / }
];

describe('P02: autorização das operações administrativas', { concurrency: 1 }, () => {
    let aplicacao, servidor, origem, banco;
    const cookies = new Map();

    async function requisitar(metodo, url, body, cookie, headers = {}) {
        const resposta = await fetch(origem + url, {
            method: metodo,
            headers: { ...headers, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await resposta.json();
        return { resposta, data };
    }

    before(async () => {
        aplicacao = await carregarAplicacaoIsolada();
        aplicacao.configurarBancoDeTeste(criarBancoSimulado());
        servidor = aplicacao.app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        origem = `http://127.0.0.1:${servidor.address().port}`;
        aplicacao.rotasDeTeste.post('/fixture-papel-adversarial',(req,res)=>{req.session.identidade={origem:'login',id:99,perfil:req.body.perfil};res.json({fixture:true});});
        for (const conta of contas) {
            const { resposta } = await requisitar('POST', ['administrador','aluno','professor'].includes(conta.perfil)?'/login':'/fixture-papel-adversarial', { usuario: conta.usuario, senha: senhaFixture, perfil:conta.perfil });
            assert.equal(resposta.status, 200, 'Login de fixture deve obter sessão real.');
            const cookie = resposta.headers.getSetCookie()[0]?.split(';')[0];
            assert.ok(cookie, 'Login de fixture deve devolver cookie de sessão.');
            cookies.set(conta.perfil ?? 'sem-perfil', cookie);
        }
    });

    beforeEach(() => {
        banco = criarBancoSimulado();
        aplicacao.configurarBancoDeTeste(banco);
        aplicacao.remocoes.length = 0;
    });

    after(async () => {
        if (servidor) {
            servidor.closeAllConnections();
            await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
        }
    });

    for (const papel of ['anônimo', 'aluno', 'professor', 'visitante', 'outro-perfil', 'sem-perfil']) {
        for (const rota of mutacoes) {
            it(`${papel} não pode ${rota.nome}, mesmo forjando o perfil da requisição`, async () => {
                const separador = rota.url.includes('?') ? '&' : '?';
                const { resposta, data } = await requisitar(rota.metodo, rota.url + separador + 'role=administrador&usuario_id=1',
                    rota.body === undefined ? undefined : { ...rota.body, perfil: 'administrador' },
                    cookies.get(papel), { 'X-Perfil': 'administrador', 'X-Usuario-Id': '1' });
                assert.equal(resposta.status, papel === 'anônimo' ? 401 : 403);
                assert.equal(typeof data.erro, 'string');
                assert.equal(banco.chamadas.length, 0, 'Negação deve acontecer antes de SQL ou transação.');
                assert.equal(aplicacao.remocoes.length, 0, 'Negação não pode remover arquivos.');
            });
        }
    }

    for (const rota of mutacoes) {
        it(`administrador pode ${rota.nome} e alcança a operação SQL existente`, async () => {
            const { resposta, data } = await requisitar(rota.metodo, rota.url, rota.body, cookies.get('administrador'));
            assert.equal(resposta.status, 200);
            assert.equal(typeof data.mensagem, 'string');
            assert.ok(banco.chamadas.some(c => c.tipo === 'query' && rota.sql.test(c.sql)));
        });
    }

    for (const perfil of ['administrador', 'professor', 'aluno', ' AlUnO ']) {
        it(`administrador cria conta somente com perfil permitido: ${perfil}`, async () => {
            const { resposta } = await requisitar('POST', '/cadastro', { usuario: 'fixture-perfil', senha: senhaFixture, perfil, pessoa_id: perfil.trim().toLowerCase()==='professor'?41:42 }, cookies.get('administrador'));
            assert.equal(resposta.status, 200);
            const insert = banco.chamadas.find(c => c.sql?.startsWith('INSERT INTO usuarios '));
            assert.equal(insert.parametros[2], perfil.trim().toLowerCase());
        });
    }

    it('preserva o perfil administrativo padrão quando o campo é omitido por administrador', async () => {
        const { resposta } = await requisitar('POST', '/cadastro', { usuario: 'fixture-padrao', senha: senhaFixture }, cookies.get('administrador'));
        assert.equal(resposta.status, 200);
        assert.equal(banco.chamadas.find(c => c.sql?.startsWith('INSERT INTO usuarios ')).parametros[2], 'administrador');
    });

    for (const perfil of ['visitante', 'superadmin', '__proto__', 'constructor', '', null, 42, {}, [], ['administrador']]) {
        it(`rejeita perfil de conta inválido antes de SQL: ${JSON.stringify(perfil)}`, async () => {
            const { resposta, data } = await requisitar('POST', '/cadastro', { usuario: 'fixture-invalida', senha: senhaFixture, perfil }, cookies.get('administrador'));
            assert.equal(resposta.status, 400);
            assert.equal(typeof data.erro, 'string');
            assert.equal(banco.chamadas.length, 0);
        });
    }

    it('nega aluno antes da validação do projeto, mesmo sem banco conectado', async () => {
        aplicacao.configurarBancoDeTeste(null);
        const { resposta } = await requisitar('POST', '/projetos', {}, cookies.get('aluno'));
        assert.equal(resposta.status, 403);
        assert.equal(banco.chamadas.length, 0);
    });

    const leituras = ['/usuarios?perfil=aluno', '/usuarios?perfil=professor', '/usuarios/42?perfil=aluno', '/usuarios/41?perfil=professor', '/projetos', '/projetos/51', '/documentos?projeto_id=51'];
    for (const papel of ['administrador', 'professor', 'aluno']) {
        for (const url of leituras) {
            it(`aplica leitura autorizada a ${papel}: ${url}`, async () => {
                const { resposta, data } = await requisitar('GET', url, undefined, cookies.get(papel));
                const permitido=papel==='administrador'||!url.startsWith('/usuarios?')&&(!url.startsWith('/usuarios/')||(papel==='aluno'?url.includes('/42?perfil=aluno'):url.includes('/41?perfil=professor')));
                assert.equal(resposta.status,permitido?200:403);
                if(!permitido)return;
                assert.ok(data && typeof data === 'object');
                assert.ok(banco.chamadas.some(c => c.tipo === 'query'));
            });
        }
    }
});
