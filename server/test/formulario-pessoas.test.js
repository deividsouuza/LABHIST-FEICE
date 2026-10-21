import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { aluno, professor, senhaFixture, criarBancoSimulado, carregarAplicacaoIsolada } from './helpers/aplicacao.js';
import { abrirNavegador, chromePath } from './helpers/navegador.js';

// Requer Chrome/Edge local (ou CHROME_BIN); não usa navegador/perfil pessoal.
// API, sessões e arquivos frontend são reais; SQL e operações de fs são doubles.
describe('P12: formulário de pessoas no navegador', { concurrency: 1, skip: !chromePath }, () => {
    let aplicacao, servidor, origem, navegador, cookieAdmin, banco;
    const escritas = [];
    const errosPagina = [];
    const alunoLegado = { ...aluno, nome: 'José de teste', matricula: '000042', curso: 'Integrado em Desenvolvimento de Jogos Digitais', telefone: '79999991111' };
    const outroAluno = { ...aluno, id: 43, nome: 'Outro aluno', curso: 'Edificações' };
    const valido = { nome: '  José D’Ávila  ', matricula: '000042', email: 'nome+teste@dominio.com.br', telefone: '(79) 99999-1111', curso: 'Programação de Jogos Digitais', turma: '1° Ano' };

    function preencherPagina(dados, prefixo) {
        for (const campo of ['nome', 'matricula', 'email', 'telefone']) {
            document.getElementById(prefixo + '-' + campo).value = dados[campo] || '';
        }
        if (prefixo === 'aluno') {
            for (const campo of ['curso', 'turma']) {
                document.querySelectorAll('input[name="' + campo + '"]').forEach(r => r.checked = r.value === dados[campo]);
            }
        }
    }

    async function preencher(dados = valido, tipo = 'aluno') {
        await navegador.evaluate('(' + preencherPagina.toString() + ')(' + JSON.stringify(dados) + ',' + JSON.stringify(tipo === 'aluno' ? 'aluno' : 'prof') + ')');
    }

    async function inserir(texto, id = 'aluno-telefone') {
        await navegador.evaluate('document.getElementById(' + JSON.stringify(id) + ').focus()');
        await navegador.send('Input.insertText', { text: texto });
    }

    before(async () => {
        aplicacao = await carregarAplicacaoIsolada();
        aplicacao.configurarBancoDeTeste(criarBancoSimulado());
        servidor = aplicacao.app.listen(0, '127.0.0.1');
        await new Promise(resolve => servidor.once('listening', resolve));
        origem = 'http://127.0.0.1:' + servidor.address().port;
        const login = await fetch(origem + '/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: 'fixture-admin', senha: senhaFixture })
        });
        assert.equal(login.status, 200);
        cookieAdmin = login.headers.getSetCookie()[0].split(';')[0];
        navegador = await abrirNavegador();
        navegador.on('Runtime.exceptionThrown', details => errosPagina.push(details.exceptionDetails.text));
        navegador.on('Fetch.requestPaused', async request => {
            const { requestId } = request;
            const url = new URL(request.request.url);
            if (url.hostname !== 'localhost') {
                await navegador.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/css' }], body: '' });
                return;
            }
            const method = request.request.method;
            if (method !== 'GET' && method !== 'OPTIONS') {
                escritas.push({ method, url: url.pathname + url.search, body: JSON.parse(request.request.postData || '{}') });
            }
            const response = await fetch(origem + url.pathname + url.search, {
                method,
                headers: { Cookie: cookieAdmin, 'Content-Type': 'application/json', Origin: origem },
                body: ['GET', 'HEAD', 'OPTIONS'].includes(method) ? undefined : request.request.postData
            });
            await navegador.send('Fetch.fulfillRequest', {
                requestId, responseCode: response.status,
                responseHeaders: [
                    { name: 'Content-Type', value: 'application/json; charset=utf-8' },
                    { name: 'Access-Control-Allow-Origin', value: origem },
                    { name: 'Access-Control-Allow-Credentials', value: 'true' },
                    { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { name: 'Access-Control-Allow-Headers', value: 'content-type' }
                ],
                body: Buffer.from(await response.text()).toString('base64')
            });
        });
        await navegador.send('Fetch.enable', { patterns: [{ urlPattern: 'http://localhost:3000/*' }, { urlPattern: 'https://fonts.googleapis.com/*' }] });
        await navegador.send('Page.addScriptToEvaluateOnNewDocument', {
            source: "localStorage.setItem('perfil','administrador'); window.__alerts=[]; window.alert=m=>window.__alerts.push(String(m));"
        });
        await navegador.send('Page.navigate', { url: origem + '/mainPage/menuCadastro.html' });
        await navegador.waitFor('typeof showRegisterForm === "function" && document.readyState === "complete" && document.body.dataset.sessao === "confirmada"');
        console.log('Navegador P12:', navegador.version.product);
    });

    beforeEach(async () => {
        banco = criarBancoSimulado({ aluno: alunoLegado, professor: { ...professor, telefone: '79999992222' } });
        const queryOriginal = banco.query.bind(banco);
        banco.query = async (sql, parametros) => {
            const result = await queryOriginal(sql, parametros);
            return sql.includes('FROM aluno ORDER BY nome') ? [[alunoLegado, outroAluno]] : result;
        };
        aplicacao.configurarBancoDeTeste(banco);
        await navegador.evaluate('showForm("aluno")');
        await navegador.evaluate('showRegisterForm("aluno"); __alerts.length = 0');
        escritas.length = 0;
    });

    after(async () => {
        try {
            if (navegador) {
                assert.deepEqual(errosPagina, [], 'Página não deve gerar exceções JavaScript.');
                assert.equal(navegador.errors.length, 0, 'Proxy/DevTools não deve falhar.');
            }
        } finally {
            if (navegador) await navegador.close();
            if (servidor) {
                servidor.closeAllConnections();
                await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
            }
        }
    });

    const invalidos = [
        ['nome', ''], ['matricula', ''], ['matricula', '-1'], ['matricula', '1.2'], ['matricula', '1e3'],
        ['email', ''], ['email', 'inválido'], ['email', 'a..b@example.com'],
        ['telefone', ''], ['telefone', '(79) 9999-1111'], ['telefone', '799999911111'],
        ['telefone', 'abc79999991111'], ['curso', ''], ['turma', '']
    ];
    for (const [campo, valor] of invalidos) {
        it('não envia aluno com ' + campo + ' inválido: ' + JSON.stringify(valor), async () => {
            await preencher({ ...valido, [campo]: valor });
            await navegador.evaluate('document.getElementById("btnSubmitAluno").click()');
            assert.equal(escritas.length, 0);
            assert.ok(await navegador.evaluate('__alerts.length > 0'));
        });
    }

    it('cadastra aluno válido, preservando matrícula e integração com a API P11', async () => {
        await preencher();
        await navegador.evaluate('submitAluno()');
        assert.equal(escritas.length, 1);
        assert.equal(escritas[0].method, 'POST');
        assert.equal(escritas[0].body.matricula, '000042');
        assert.equal(escritas[0].body.nome, 'José D’Ávila');
        assert.equal(escritas[0].body.curso, 'Programação de Jogos Digitais');
        assert.ok(banco.chamadas.some(c => c.sql?.startsWith('INSERT INTO aluno ')));
        await navegador.waitFor('document.getElementById("listAluno").style.display === "block"');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '');
    });

    it('edição carrega telefone legado formatado e envia PUT válido', async () => {
        await navegador.evaluate('editUser(42, "aluno")');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '(79) 99999-1111');
        assert.equal(await navegador.evaluate('document.querySelector("input[name=curso]:checked").value'), 'Programação de Jogos Digitais');
        await navegador.evaluate('submitAluno()');
        assert.equal(escritas.length, 1);
        assert.equal(escritas[0].method, 'PUT');
        assert.ok(banco.chamadas.some(c => c.sql?.startsWith('UPDATE aluno ')));
    });

    it('formata digitação sem deslocar o cursor para o fim ao editar no meio', async () => {
        await inserir('79999991111');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '(79) 99999-1111');
        await navegador.evaluate('document.getElementById("aluno-telefone").setSelectionRange(6,7)');
        await inserir('8');
        const state = await navegador.evaluate('({value:document.getElementById("aluno-telefone").value, cursor:document.getElementById("aluno-telefone").selectionStart})');
        assert.equal(state.value, '(79) 98999-1111');
        assert.equal(state.cursor, 7);
    });

    it('digitação dígito a dígito mantém a máscara parcial e o cursor utilizável', async () => {
        const telefone = '79999991111';
        for (let index = 0; index < telefone.length; index++) {
            await inserir(telefone[index]);
            const state = await navegador.evaluate('({value:document.getElementById("aluno-telefone").value, cursor:document.getElementById("aluno-telefone").selectionStart})');
            assert.equal(state.value.replace(/\D/g, ''), telefone.slice(0, index + 1));
            assert.equal(state.cursor, state.value.length);
        }
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '(79) 99999-1111');
    });

    it('edição de aluno não envia PUT inválido e preserva os dados até a correção', async () => {
        await navegador.evaluate('editUser(42,"aluno")');
        await navegador.evaluate('document.getElementById("aluno-telefone").value="123"; submitAluno()');
        assert.equal(escritas.length, 0);
        assert.equal(await navegador.evaluate('document.getElementById("aluno-matricula").value'), '000042');
        await navegador.evaluate('document.getElementById("aluno-telefone").value="79999991111"; submitAluno()');
        assert.equal(escritas.length, 1);
        assert.equal(escritas[0].method, 'PUT');
    });

    it('Backspace atravessa a pontuação sem ficar preso no hífen', async () => {
        await inserir('79999991111');
        await navegador.evaluate('document.getElementById("aluno-telefone").setSelectionRange(11,11)');
        await navegador.key('Backspace');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value.replace(/\\D/g,"").length'), 10);
        await navegador.key('Backspace');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value.replace(/\\D/g,"").length'), 9);
    });

    it('Delete atravessa fechamento do DDD e remove o próximo dígito', async () => {
        await inserir('79999991111');
        await navegador.evaluate('document.getElementById("aluno-telefone").setSelectionRange(3,3)');
        await navegador.key('Delete');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value.replace(/\\D/g,"")'), '7999991111');
    });

    it('inserção em bloco preserva máscara e substituição da seleção, sem usar clipboard do SO', async () => {
        await inserir('(79) 99999-1111');
        await navegador.evaluate('document.getElementById("aluno-telefone").setSelectionRange(0,15)');
        await inserir('11988887777');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '(11) 98888-7777');
        await navegador.evaluate('document.getElementById("aluno-telefone").setSelectionRange(0,15)');
        await navegador.key('Backspace');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '');
    });

    it('não transforma inserção com dígito excedente em telefone válido truncado', async () => {
        await preencher({ ...valido, telefone: '' });
        await inserir('799999911112');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value.replace(/\\D/g,"").length'), 12);
        await navegador.evaluate('submitAluno()');
        assert.equal(escritas.length, 0);
    });

    it('não esconde caracteres inválidos de uma inserção em bloco', async () => {
        await preencher({ ...valido, telefone: '' });
        await inserir('abc79999991111');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), 'abc79999991111');
        await navegador.evaluate('submitAluno()');
        assert.equal(escritas.length, 0);
    });

    it('rótulo da ERS e filtro continuam ligados ao curso legado correto', async () => {
        assert.ok(await navegador.evaluate('document.querySelector("input[name=curso]").closest("label").textContent.includes("Desenvolvimento de Jogos Digitais")'));
        await navegador.evaluate('showForm("aluno")');
        await navegador.evaluate('document.querySelector("#cursoChips .chip").click()');
        const text = await navegador.evaluate('document.getElementById("alunoListBody").textContent');
        assert.ok(text.includes('José de teste'));
        assert.ok(text.includes('Desenvolvimento de Jogos Digitais'));
        assert.ok(!text.includes('Programação de Jogos Digitais'));
        assert.ok(!text.includes('Outro aluno'));
        await navegador.evaluate('document.querySelector("#cursoChips .chip").click()');
        assert.ok(await navegador.evaluate('document.getElementById("alunoListBody").textContent.includes("Outro aluno")'));
    });

    it('limpar e voltar preservam fluxo de cadastro e não deixam seleção/telefone anteriores', async () => {
        await preencher();
        await navegador.evaluate('clearForm("formAluno")');
        assert.ok(await navegador.evaluate('!document.getElementById("aluno-nome").value && !document.getElementById("aluno-telefone").value && !document.querySelector("input[name=curso]:checked") && !document.querySelector("input[name=turma]:checked")'));
        await preencher();
        await navegador.evaluate('backToList("aluno")');
        await navegador.waitFor('document.getElementById("listAluno").style.display === "block"');
        await navegador.evaluate('showRegisterForm("aluno")');
        assert.equal(await navegador.evaluate('document.getElementById("aluno-telefone").value'), '');
    });

    it('professor recebe máscara e continua podendo cadastrar só com nome', async () => {
        await navegador.evaluate('showForm("professor")');
        await navegador.evaluate('showRegisterForm("professor")');
        await inserir('79999992222', 'prof-telefone');
        assert.equal(await navegador.evaluate('document.getElementById("prof-telefone").value'), '(79) 99999-2222');
        await navegador.evaluate('clearForm("formProfessor"); document.getElementById("prof-nome").value="Professora Lúcia"');
        await navegador.evaluate('submitProfessor()');
        assert.equal(escritas.length, 1);
        assert.equal(escritas[0].body.telefone, '');
        assert.equal(escritas[0].body.perfil, 'professor');
        assert.ok(banco.chamadas.some(c => c.sql?.startsWith('INSERT INTO professor ')));
    });

    it('professor edita telefone legado e bloqueia opcional inválido antes do envio', async () => {
        await navegador.evaluate('showForm("professor")');
        await navegador.evaluate('editUser(41,"professor")');
        assert.equal(await navegador.evaluate('document.getElementById("prof-telefone").value'), '(79) 99999-2222');
        await preencher({ nome: 'Professora', email: 'inválido' }, 'professor');
        await navegador.evaluate('submitProfessor()');
        assert.equal(escritas.length, 0);
    });
    for (const tipo of ['professor','aluno']) {
        it(`P06: formulario envia credenciais opcionais de ${tipo} e limpa senha no sucesso`,async()=>{
            await navegador.evaluate(`showRegisterForm('${tipo}')`);
            await preencher(tipo==='aluno'?valido:{nome:'Professora'},tipo);
            const prefixo=tipo==='aluno'?'aluno':'prof';
            await navegador.evaluate(`document.getElementById('${prefixo}-usuario').value='acesso-'+${JSON.stringify(tipo)};document.getElementById('${prefixo}-senha').value='senha-fixture';`);
            await navegador.evaluate(tipo==='aluno'?'submitAluno()':'submitProfessor()');
            assert.equal(escritas.length,1);assert.equal(escritas[0].body.credenciais.usuario,'acesso-'+tipo);
            assert.equal(await navegador.evaluate(`document.getElementById('${prefixo}-senha').value`),'');
        });
    }
    it('P06: credencial incompleta preserva campos sem enviar cadastro',async()=>{
        await preencher();await navegador.evaluate("document.getElementById('aluno-usuario').value='sem-senha';submitAluno()");
        assert.equal(escritas.length,0);assert.equal(await navegador.evaluate("document.getElementById('aluno-usuario').value"),'sem-senha');
    });
});
