import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador,chromePath} from './helpers/navegador.js';
import {contas,senhaFixture} from './helpers/aplicacao.js';
import {executarMigracoes,verificarEsquema} from '../banco/migrador.js';

describe('Professor cadastra quizzes: HTTP/MySQL/Chrome isolados',{concurrency:1},()=>{
    let f,nav,tempo=0;const erros=[];
    const conteudo=()=>({titulo:'Quiz do professor',descricao:'Memória e história',perguntas:[{descricao:'Pergunta <img src=x>',alternativas:[{descricao:'Correta',correta:true},{descricao:'Incorreta',correta:false}]}]});
    const payload=(extra={})=>({...conteudo(),projeto_id:51,subprojeto_id:null,...extra});
    const gravar=(url,body,papel='professor',method='POST')=>f.request(url,papel,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const criar=(extra={},papel='professor')=>gravar('/professor/quizzes',payload(extra),papel);
    async function login(papel='professor',usuario='fixture-professor'){
        const r=await fetch(f.origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario,senha:senhaFixture})});assert.equal(r.status,200);f.cookies[papel]=r.headers.getSetCookie()[0].split(';')[0];
    }
    before(async()=>{
        f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});
        await f.banco.query("INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (91,'fixture-prof-b',?,'professor')",[contas[1].senha]);await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (91,'professor',43)");await login('professor-b','fixture-prof-b');
        assert.ok(chromePath);nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
        await nav.send('Network.enable');await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__avisos=[];window.alert=m=>__avisos.push(m);'});
    });
    beforeEach(async()=>{
        tempo+=900001;await nav.send('Page.navigate',{url:'about:blank'});await f.banco.query('DROP TRIGGER IF EXISTS fixture_quiz_prof_falha');
        for(const t of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin','quiz_resposta','quiz_resultado','quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query('DELETE FROM '+t);await f.preencher(2);await f.banco.query('UPDATE projeto_professor SET professor_id=43 WHERE projeto_id=52');
    });
    after(async()=>{if(nav)await nav.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});
    it('migra17→18 sem deduzir autores para quizzes legados nem mudar conteúdo/versões antigas',async()=>{
        const c=await gravar('/quizzes',conteudo(),'administrador');assert.equal(c.status,201);
        await f.banco.query('ALTER TABLE quiz DROP FOREIGN KEY labhist_fk_quiz_autor_conta');await f.banco.query('ALTER TABLE quiz DROP FOREIGN KEY labhist_fk_quiz_autor_professor');await f.banco.query('ALTER TABLE quiz DROP CHECK labhist_quiz_autoria');await f.banco.query('ALTER TABLE quiz DROP COLUMN autor_conta_id,DROP COLUMN autor_professor_id');await f.banco.query('DELETE FROM schema_migrations WHERE versao>=18');
        const [antes]=await f.banco.query('SELECT * FROM schema_migrations ORDER BY versao');assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-17},(_,i)=>i+18)});assert.deepEqual((await f.banco.query('SELECT * FROM schema_migrations WHERE versao<=17 ORDER BY versao'))[0],antes);
        const [rows]=await f.banco.query('SELECT titulo,autor_conta_id,autor_professor_id FROM quiz WHERE id=?',[c.data.id]);assert.equal(rows[0].titulo,conteudo().titulo);assert.equal(rows[0].autor_conta_id,null);assert.equal(rows[0].autor_professor_id,null);assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});
    });
    it('professor cria rascunho privado, autoria vem da sessão e estrutura persiste integralmente',async()=>{
        const r=await criar();assert.equal(r.status,201);const [rows]=await f.banco.query('SELECT * FROM quiz WHERE id=?',[r.data.id]),q=rows[0];assert.equal(q.autor_conta_id,41);assert.equal(q.autor_professor_id,41);assert.equal(q.projeto_id,51);assert.equal(q.estado,'rascunho');assert.equal(q.introducao_publica,0);
        const l=await f.request('/professor/quizzes/'+q.id,'professor');assert.equal(l.status,200);assert.equal(l.data.perguntas.length,1);assert.deepEqual(l.data.perguntas[0].alternativas.map(a=>a.correta),[true,false]);assert.equal((await f.request('/quizzes/'+q.id)).status,200);
    });
    it('conta91 registra pessoa43 sem confundir IDs',async()=>{
        const r=await criar({projeto_id:52},'professor-b');assert.equal(r.status,201);const [[q]]=await f.banco.query('SELECT autor_conta_id,autor_professor_id FROM quiz WHERE id=?',[r.data.id]);assert.deepEqual(q,{autor_conta_id:91,autor_professor_id:43});
    });
    it('exige projeto autorizado e não usa o responsável legado como vínculo',async()=>{
        assert.equal((await criar({projeto_id:52})).status,403);assert.equal((await criar({projeto_id:999})).status,403);assert.equal((await criar({projeto_id:null})).status,400);
        await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');assert.equal((await criar()).status,403);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz'))[0][0].n,0);
    });
    it('subprojeto opcional tem de pertencer ao projeto escolhido',async()=>{
        const a=await gravar('/projetos/51/subprojetos',{titulo:'Ser Digital'},'administrador'),b=await gravar('/projetos/52/subprojetos',{titulo:'Outro'},'administrador');
        assert.equal((await criar({subprojeto_id:a.data.id})).status,201);assert.equal((await criar({subprojeto_id:b.data.id})).status,400);
    });
    it('não permite forjar autoria, perfil, publicação ou pontuação; valida perguntas e gabarito',async()=>{
        for(const extra of [{autor_conta_id:91},{autor_professor_id:43},{perfil:'administrador'},{estado:'publicado'},{publico:true},{perguntas:[]},{perguntas:[{descricao:'P',alternativas:[{descricao:'A',correta:true},{descricao:'B',correta:true}]}]}])assert.equal((await criar(extra)).status,400);
        assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz'))[0][0].n,0);
    });
    it('aluno/anônimo não cadastram nem consultam; rotas administrativas permanecem protegidas',async()=>{
        const r=await criar();for(const papel of ['aluno','']){
            assert.equal((await criar({},papel)).status,papel?403:401);
            for(const url of ['/professor/quizzes','/professor/quizzes/'+r.data.id])assert.equal((await f.request(url,papel)).status,papel?403:401);
        }
        assert.equal((await gravar('/quizzes',conteudo())).status,403);assert.equal((await f.request('/quizzes','professor')).status,403);
    });
    it('outro professor, mesmo colega de projeto, não vê o gabarito nem o quiz na lista própria',async()=>{
        const r=await criar();await f.banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,43)');assert.equal((await f.request('/professor/quizzes/'+r.data.id,'professor-b')).status,404);assert.deepEqual((await f.request('/professor/quizzes','professor-b')).data,[]);
        const legado=await gravar('/quizzes',conteudo(),'administrador');assert.equal((await f.request('/professor/quizzes/'+legado.data.id,'professor')).status,404);
    });
    it('remoção do vínculo revoga leitura e lista sem apagar o quiz',async()=>{
        const r=await criar();await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');assert.equal((await f.request('/professor/quizzes/'+r.data.id,'professor')).status,403);assert.deepEqual((await f.request('/professor/quizzes','professor')).data,[]);assert.equal((await f.request('/quizzes/'+r.data.id)).status,200);
    });
    it('edição, exclusão e publicação continuam administrativas; aluno recebe atividade sem gabarito após publicação',async()=>{
        const r=await criar(),url='/quizzes/'+r.data.id;
        assert.equal((await gravar(url,conteudo(),'professor','PUT')).status,403);assert.equal((await f.request(url,'professor',{method:'DELETE'})).status,403);
        const disp={projeto_id:51,subprojeto_id:null,estado:'publicado',publico:false};assert.equal((await gravar(url+'/disponibilidade',disp,'professor','PUT')).status,403);assert.deepEqual((await f.request('/aluno/quizzes','aluno')).data,[]);
        assert.equal((await gravar(url+'/disponibilidade',disp,'administrador','PUT')).status,200);assert.ok((await f.request('/aluno/quizzes','aluno')).data.some(q=>q.id===r.data.id));
        const atividade=(await f.request('/aluno/quizzes/'+r.data.id+'/atividade','aluno')).data;assert.equal(atividade.perguntas[0].alternativas.some(a=>Object.hasOwn(a,'correta')),false);
    });
    it('reassociar conta não transfere os quizzes para outra pessoa',async()=>{
        const r=await criar();await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id IN (41,91)');await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (41,'professor',43),(91,'professor',41)");await f.banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,43)');
        try{await login();assert.equal((await f.request('/professor/quizzes/'+r.data.id,'professor')).status,404);assert.deepEqual((await f.request('/professor/quizzes','professor')).data,[]);}
        finally{await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id IN (41,91)');await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (41,'professor',41),(91,'professor',43)");await login();}
    });
    it('falha na inserção das alternativas reverte quiz e perguntas',async()=>{
        await f.banco.query("CREATE TRIGGER fixture_quiz_prof_falha BEFORE INSERT ON quiz_alternativa FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture-privada'");const r=await criar();assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('fixture-privada'),false);
        for(const t of ['quiz','quiz_pergunta','quiz_alternativa'])assert.equal((await f.banco.query('SELECT COUNT(*) n FROM '+t))[0][0].n,0);
    });
    it('partida verifica as novas FKs',async()=>{
        await f.banco.query('ALTER TABLE quiz DROP FOREIGN KEY labhist_fk_quiz_autor_conta');try{await assert.rejects(verificarEsquema(f.banco),/FK de autoria de quiz/);}finally{await f.banco.query('ALTER TABLE quiz ADD CONSTRAINT labhist_fk_quiz_autor_conta FOREIGN KEY (autor_conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT');}
    });
    async function entrar(papel='professor'){
        await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('typeof fazerLogin==="function"');await nav.evaluate(`document.getElementById('usuario-log').value='fixture-${papel==='administrador'?'admin':papel}';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('perfil-log').value=${JSON.stringify(papel==='administrador'?'':papel)};fazerLogin()`);await nav.waitFor('location.pathname.includes("menuCadastro")&&document.body.dataset.sessao==="confirmada"');
    }
    async function abrirCadastro(){await entrar();await nav.evaluate('document.getElementById("navQuizzesProfessor").click()');await nav.waitFor('document.getElementById("listQuizzes").style.display==="block"');await nav.evaluate('novoQuiz()');await nav.waitFor('document.querySelectorAll("#quizCadastroProjeto option").length===2');await nav.evaluate('document.getElementById("quizCadastroProjeto").value="51";carregarSubprojetosCadastroQuiz()');}
    const preencher=`document.getElementById('quizTitulo').value='Quiz criado pelo professor';document.getElementById('quizDescricao').value='Introdução';document.querySelector('#quizPerguntas .quiz-pergunta-texto').value='Questão';document.querySelectorAll('#quizPerguntas .quiz-alternativa-texto').forEach((e,i)=>e.value='Resposta '+i);document.querySelector('#quizPerguntas .quiz-correta').checked=true;`;
    it('Chrome: professor monta perguntas, escolhe projeto/subprojeto, salva e consulta seu quiz',async()=>{
        const sub=await gravar('/projetos/51/subprojetos',{titulo:'Ludo'},'administrador');await abrirCadastro();await nav.evaluate('document.getElementById("quizCadastroSubprojeto").value='+JSON.stringify(String(sub.data.id)));await nav.evaluate(preencher+'revisarQuiz();submitQuiz()');
        assert.equal(await nav.evaluate('document.getElementById("quizDetalheTitulo").textContent.includes("Quiz criado pelo professor")'),true);const [[q]]=await f.banco.query('SELECT id,subprojeto_id FROM quiz');assert.equal(q.subprojeto_id,sub.data.id);await nav.evaluate('abrirQuiz('+q.id+')');
        assert.equal(await nav.evaluate('document.getElementById("quizDetalheCorpo").textContent.includes("(correta)")'),true);for(const id of ['quizEditar','quizExcluir','quizDisponibilidade'])assert.equal(await nav.evaluate('document.getElementById('+JSON.stringify(id)+').hidden'),true);
    });
    it('Chrome: erro preserva conteúdo e seleção; campos cabem em celular',async()=>{
        await abrirCadastro();await nav.evaluate(preencher);await f.banco.query("CREATE TRIGGER fixture_quiz_prof_falha BEFORE INSERT ON quiz_alternativa FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");await nav.evaluate('submitQuiz()');assert.equal(await nav.evaluate('document.getElementById("quizTitulo").value'),'Quiz criado pelo professor');assert.equal(await nav.evaluate('document.getElementById("quizCadastroProjeto").value'),'51');assert.equal(await nav.evaluate('document.getElementById("quizSalvar").disabled'),false);
        await nav.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await nav.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await nav.send('Emulation.clearDeviceMetricsOverride');
    });
    it('Chrome: aluno não cadastra; administrador mantém o cadastro anterior sem projeto obrigatório',async()=>{
        await entrar('aluno');assert.equal(await nav.evaluate('getComputedStyle(document.getElementById("navQuizzesProfessor")).display'),'none');await nav.evaluate('novoQuiz()');assert.equal(await nav.evaluate('document.getElementById("formQuiz").style.display'),'none');
        await entrar('administrador');await nav.evaluate('novoQuiz()');assert.equal(await nav.evaluate('document.getElementById("quizVinculoProfessor").hidden'),true);await nav.evaluate(preencher+'submitQuiz()');assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz'))[0][0].n,1);
    });
    it('Chrome: resposta tardia de projetos não restaura dados após sair da sessão',async()=>{
        await entrar();await nav.evaluate(`window.__apiOriginal=apiFetch;apiFetch=async(...args)=>{const r=await __apiOriginal(...args);if(args[0].endsWith('/projetos'))await new Promise(resolve=>window.__soltar=resolve);return r;};novoQuiz()`);await nav.waitFor('typeof __soltar==="function"');await nav.evaluate('limparEstadoSessao();__soltar();apiFetch=__apiOriginal');assert.equal(await nav.evaluate('document.getElementById("quizCadastroProjeto").children.length'),0);assert.equal(await nav.evaluate('document.getElementById("quizPerguntas").children.length'),0);
    });
    it('Chrome: reconfirmar a mesma sessão preserva rascunho; mudar para aluno apaga gabarito e seleção',async()=>{
        await abrirCadastro();await nav.evaluate(preencher+'inicializarSessao()');assert.equal(await nav.evaluate('document.getElementById("quizTitulo").value'),'Quiz criado pelo professor');assert.equal(await nav.evaluate('document.getElementById("quizCadastroProjeto").value'),'51');
        await nav.evaluate(`fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-aluno',senha:${JSON.stringify(senhaFixture)},perfil:'aluno'})}).then(r=>{if(r.status!==200)throw Error('Login fixture');return inicializarSessao()})`);
        assert.equal(await nav.evaluate('document.getElementById("quizPerguntas").children.length'),0);assert.equal(await nav.evaluate('document.getElementById("quizCadastroProjeto").children.length'),0);assert.equal(await nav.evaluate('document.getElementById("formQuiz").style.display'),'none');
    });
});
