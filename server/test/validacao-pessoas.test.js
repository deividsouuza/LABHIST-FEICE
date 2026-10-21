import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { aluno, professor, senhaFixture, criarBancoSimulado, carregarAplicacaoIsolada } from './helpers/aplicacao.js';

// HTTP real, sem MySQL ou escrita de arquivos reais.
describe('P11: validação do cadastro e edição de pessoas', { concurrency: 1 }, () => {
    let aplicacao, servidor, origem, banco, cookieAdmin;

    async function requisitar(metodo, url, body, cookie = cookieAdmin) {
        const resposta = await fetch(origem + url, {
            method: metodo,
            headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        return { resposta, data: await resposta.json() };
    }

    before(async () => {
        aplicacao = await carregarAplicacaoIsolada();
        aplicacao.configurarBancoDeTeste(criarBancoSimulado());
        servidor = aplicacao.app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        origem = `http://127.0.0.1:${servidor.address().port}`;
        const { resposta } = await requisitar('POST', '/login', { usuario: 'fixture-admin', senha: senhaFixture });
        assert.equal(resposta.status, 200);
        cookieAdmin = resposta.headers.getSetCookie()[0].split(';')[0];
    });

    beforeEach(() => {
        banco = criarBancoSimulado();
        aplicacao.configurarBancoDeTeste(banco);
    });

    after(async () => {
        if (servidor) {
            servidor.closeAllConnections();
            await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
        }
    });

    async function salvar(metodo, perfil, dados) {
        return metodo === 'POST'
            ? requisitar('POST', '/cadastro-dashboard', { ...dados, perfil })
            : requisitar('PUT', `/usuarios/${perfil === 'aluno' ? 42 : 41}?perfil=${perfil}`, dados);
    }

    function escrita() {
        return banco.chamadas.find(c => c.tipo === 'query' && /^(INSERT INTO|UPDATE) (aluno|professor) /.test(c.sql));
    }

    for (const metodo of ['POST', 'PUT']) {
        for (const campo of ['nome', 'matricula', 'curso', 'turma', 'email', 'telefone']) {
            for (const valor of [undefined, null, '', '   ', {}, [], true]) {
                it(`${metodo} aluno rejeita ${campo} inválido: ${JSON.stringify(valor)}`, async () => {
                    const { resposta, data } = await salvar(metodo, 'aluno', { ...aluno, [campo]: valor });
                    assert.equal(resposta.status, 400);
                    assert.equal(typeof data.erro, 'string');
                    assert.equal(typeof data.campos?.[campo], 'string');
                    assert.equal(banco.chamadas.length, 0, 'Não consultar nem escrever antes de validar todo o payload.');
                });
            }
        }

        const invalidos = [
            ['nome', 'A'.repeat(256)], ['nome', 42], ['nome', 'Nome\u0000inválido'],
            ['matricula', '-1'], ['matricula', '1.5'], ['matricula', '1e3'], ['matricula', '12abc'],
            ['matricula', -1], ['matricula', 1.5], ['matricula', Number.MAX_SAFE_INTEGER + 1], ['matricula', '1'.repeat(101)],
            ['email', 'pessoa'], ['email', 'pessoa@'], ['email', '@example.com'], ['email', 'pessoa@example'],
            ['email', 'a b@example.com'], ['email', 'pessoa@@example.com'], ['email', '.pessoa@example.com'],
            ['email', 'pessoa..teste@example.com'], ['email', 'pessoa@-example.com'], ['email', 'pessoa@example..com'],
            ['email', 'pessoa@example.com\nBcc:outro@example.com'], ['email', 'a'.repeat(256)],
            ['telefone', '7999991111'], ['telefone', '799999911111'], ['telefone', '(79) 9999-1111'],
            ['telefone', '(79) abcde-1111'], ['telefone', 'telefone 79999991111'], ['telefone', 79999991111],
            ['telefone', '1'.repeat(51)], ['curso', 'Curso inexistente'], ['curso', '__proto__'], ['curso', 'A'.repeat(256)],
            ['turma', '4° Ano'], ['turma', 1], ['turma', '1'.repeat(101)]
        ];
        for (const [campo, valor] of invalidos) {
            it(`${metodo} aluno rejeita formato/tamanho incorreto de ${campo}: ${JSON.stringify(valor).slice(0, 65)}`, async () => {
                const { resposta, data } = await salvar(metodo, 'aluno', { ...aluno, [campo]: valor });
                assert.equal(resposta.status, 400);
                assert.equal(typeof data.campos?.[campo], 'string');
                assert.equal(banco.chamadas.length, 0);
            });
        }

        it(`${metodo} aluno informa todos os campos inválidos sem persistência parcial`, async () => {
            const { resposta, data } = await salvar(metodo, 'aluno', { nome: ' ', matricula: '-1', email: 'errado', telefone: '123', curso: 'outro', turma: '4° Ano' });
            assert.equal(resposta.status, 400);
            assert.deepEqual(Object.keys(data.campos).sort(), ['curso', 'email', 'matricula', 'nome', 'telefone', 'turma']);
            assert.equal(banco.chamadas.length, 0);
        });

        it(`${metodo} aluno válido mantém acentos, zeros da matrícula e normaliza telefone`, async () => {
            const { resposta } = await salvar(metodo, 'aluno', { ...aluno, nome: "  José D'Ávila  ", matricula: '  000042  ', email: '  nome.sobrenome+teste@dominio.com.br  ', telefone: '  79999991111  ', curso: ' Integrado em Edificações ', turma: ' 1º ano ' });
            assert.equal(resposta.status, 200);
            assert.deepEqual(Array.from(escrita().parametros).slice(0, 6), ["José D'Ávila", '000042', 'nome.sobrenome+teste@dominio.com.br', '(79) 99999-1111', 'Edificações', '1° Ano']);
            assert.equal(banco.chamadas.filter(c => /^(INSERT|UPDATE)/.test(c.sql || '')).length, 1);
        });

        it(`${metodo} aluno aceita matrícula numérica inteira sem inventar unicidade`, async () => {
            const { resposta } = await salvar(metodo, 'aluno', { ...aluno, matricula: 420 });
            assert.equal(resposta.status, 200);
            assert.equal(escrita().parametros[1], '420');
            assert.equal(banco.chamadas.filter(c => /^(INSERT|UPDATE)/.test(c.sql || '')).length, 1);
        });

        it(`${metodo} aluno aceita limites de nome e matrícula do schema`, async () => {
            const { resposta } = await salvar(metodo, 'aluno', { ...aluno, nome: 'Á'.repeat(255), matricula: '0'.repeat(99) + '1' });
            assert.equal(resposta.status, 200);
            assert.equal(escrita().parametros[0], 'Á'.repeat(255));
            assert.equal(escrita().parametros[1], '0'.repeat(99) + '1');
        });

        for (const curso of ['Programação de Jogos Digitais', 'Integrado em Programação de Jogos Digitais', 'Desenvolvimento de Jogos Digitais', 'Integrado em Desenvolvimento de Jogos Digitais', '  DESENVOLVIMENTO DE JOGOS DIGITAIS  ']) {
            it(`${metodo} aceita curso atual/ERS/legado sem quebrar o valor do formulário: ${curso}`, async () => {
                const { resposta } = await salvar(metodo, 'aluno', { ...aluno, curso });
                assert.equal(resposta.status, 200);
                assert.equal(escrita().parametros[4], 'Programação de Jogos Digitais');
            });
        }

        for (const curso of ['Energias Renováveis', 'Edificações', 'Eletrotécnica']) {
            it(`${metodo} aceita curso previsto na ERS: Integrado em ${curso}`, async () => {
                const { resposta } = await salvar(metodo, 'aluno', { ...aluno, curso: `Integrado em ${curso}` });
                assert.equal(resposta.status, 200);
                assert.equal(escrita().parametros[4], curso);
            });
        }

        for (const ano of [1, 2, 3]) {
            it(`${metodo} aceita turma prevista na ERS: ${ano}º ano`, async () => {
                const { resposta } = await salvar(metodo, 'aluno', { ...aluno, turma: `${ano}º ano` });
                assert.equal(resposta.status, 200);
                assert.equal(escrita().parametros[5], `${ano}° Ano`);
            });
        }

        it(`${metodo} professor exige só nome e permite opcionais omitidos`, async () => {
            const { resposta } = await salvar(metodo, 'professor', { nome: '  Professora Conceição  ' });
            assert.equal(resposta.status, 200);
            assert.deepEqual(Array.from(escrita().parametros).slice(0, 4), ['Professora Conceição', '', '', '']);
        });

        it(`${metodo} professor permite opcionais vazios/nulos sem exigir domínio institucional`, async () => {
            const { resposta } = await salvar(metodo, 'professor', { nome: 'Professora', matricula: null, email: '', telefone: '   ' });
            assert.equal(resposta.status, 200);
            assert.deepEqual(Array.from(escrita().parametros).slice(0, 4), ['Professora', '', '', '']);
        });

        it(`${metodo} professor valida e normaliza os opcionais informados`, async () => {
            const { resposta } = await salvar(metodo, 'professor', { ...professor, nome: '  Professora Lúcia  ', matricula: ' 000041 ', email: '  docente@dominio.com.br ', telefone: '79999992222' });
            assert.equal(resposta.status, 200);
            assert.deepEqual(Array.from(escrita().parametros).slice(0, 4), ['Professora Lúcia', '000041', 'docente@dominio.com.br', '(79) 99999-2222']);
        });

        for (const [campo, valor] of [['nome', ''], ['nome', {}], ['nome', 'A'.repeat(256)], ['matricula', '-1'], ['matricula', []], ['matricula', '1'.repeat(101)], ['email', 'inválido'], ['email', {}], ['email', 'a'.repeat(256)], ['telefone', '123'], ['telefone', []], ['telefone', '1'.repeat(51)]]) {
            it(`${metodo} professor rejeita ${campo} inválido quando informado`, async () => {
                const { resposta, data } = await salvar(metodo, 'professor', { ...professor, [campo]: valor });
                assert.equal(resposta.status, 400);
                assert.equal(typeof data.campos?.[campo], 'string');
                assert.equal(banco.chamadas.length, 0);
            });
        }
    }

    for (const perfil of ['administrador', 'visitante', '__proto__', 'constructor', '', 42, [], {}]) {
        it(`POST rejeita perfil de pessoa inválido: ${JSON.stringify(perfil)}`, async () => {
            const { resposta, data } = await requisitar('POST', '/cadastro-dashboard', { ...aluno, perfil });
            assert.equal(resposta.status, 400);
            assert.equal(typeof data.campos?.perfil, 'string');
            assert.equal(banco.chamadas.length, 0);
        });
    }

    for (const perfil of ['administrador', 'visitante', '__proto__', 'constructor', '']) {
        it(`PUT rejeita perfil de pessoa inválido: ${perfil}`, async () => {
            const { resposta, data } = await requisitar('PUT', `/usuarios/42?perfil=${perfil}`, aluno);
            assert.equal(resposta.status, 400);
            assert.equal(typeof data.campos?.perfil, 'string');
            assert.equal(banco.chamadas.length, 0);
        });
    }

    for (const metodo of ['POST', 'PUT']) {
        it(`${metodo} rejeita corpo não objeto antes de acessar campos`, async () => {
            const url = metodo === 'POST' ? '/cadastro-dashboard' : '/usuarios/42?perfil=aluno';
            const { resposta, data } = await requisitar(metodo, url, []);
            assert.equal(resposta.status, 400);
            assert.equal(typeof data.campos?.corpo, 'string');
            assert.equal(banco.chamadas.length, 0);
        });
    }

    it('normaliza curso/turma conhecidos na leitura sem regravar dados legados', async () => {
        banco = criarBancoSimulado({ aluno: { ...aluno, curso: 'Integrado em Desenvolvimento de Jogos Digitais', turma: '2º ano' } });
        aplicacao.configurarBancoDeTeste(banco);
        const { resposta, data } = await requisitar('GET', '/usuarios/42?perfil=aluno');
        assert.equal(resposta.status, 200);
        assert.equal(data.curso, 'Programação de Jogos Digitais');
        assert.equal(data.turma, '2° Ano');
        assert.equal(banco.chamadas.length, 1);
        assert.ok(banco.chamadas[0].sql.startsWith('SELECT '));
    });

    it('preserva curso/turma legados desconhecidos na leitura, sem apagar ou migrar registros', async () => {
        banco = criarBancoSimulado({ aluno: { ...aluno, curso: 'Valor legado para revisão', turma: 'Turma antiga' } });
        aplicacao.configurarBancoDeTeste(banco);
        const { resposta, data } = await requisitar('GET', '/usuarios/42?perfil=aluno');
        assert.equal(resposta.status, 200);
        assert.equal(data.curso, 'Valor legado para revisão');
        assert.equal(data.turma, 'Turma antiga');
        assert.equal(banco.chamadas.length, 1);
    });
});
