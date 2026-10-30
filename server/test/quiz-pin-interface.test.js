import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador,chromePath} from './helpers/navegador.js';
import {senhaFixture} from './helpers/aplicacao.js';

describe('PIN do Quiz: professor, aluno e visitante no Chrome real',{concurrency:1},()=>{
    let f,prof,aluno,visitante,tempo=0;const erros=[];
    const base=()=>({titulo:'Quiz para compartilhar <img src=x>',descricao:'Texto literal',projeto_id:51,subprojeto_id:null,perguntas:[0,1].map(n=>({descricao:'Questão '+n,alternativas:[{descricao:'A '+n,correta:n===0},{descricao:'B '+n,correta:n===1}]}))});
    const criar=async()=>{const r=await f.request('/professor/quizzes','professor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(base())});assert.equal(r.status,201);return r.data;};
    const total=async()=>(await f.banco.query('SELECT COUNT(*) n FROM quiz_resultado_visitante'))[0][0].n;
    before(async()=>{
        f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});assert.ok(chromePath);prof=await abrirNavegador();aluno=await abrirNavegador();visitante=await abrirNavegador();
        for(const nav of [prof,aluno,visitante]){nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));await nav.send('Network.enable');await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__paginaPin=Date.now()+Math.random();window.__avisos=[];window.alert=m=>__avisos.push(m);window.confirm=()=>true;'});}
    });
    beforeEach(async()=>{
        tempo+=900001;for(const nav of [prof,aluno,visitante]){await nav.evaluate('try{sessionStorage.clear()}catch{}');await nav.send('Page.navigate',{url:'about:blank'});}
        for(const t of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin','quiz_resposta','quiz_resultado','quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query('DELETE FROM '+t);await f.preencher(1);
    });
    after(async()=>{for(const n of [prof,aluno,visitante])if(n)await n.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});
    async function login(nav,papel){await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('typeof fazerLogin==="function"');await nav.evaluate(`document.getElementById('perfil-log').value=${JSON.stringify(papel)};document.getElementById('usuario-log').value='fixture-${papel}';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};fazerLogin()`);await nav.waitFor('location.pathname.includes("menuCadastro")&&document.body.dataset.sessao==="confirmada"');}
    async function abrirPublico(c,comLink=false,nav=visitante){await nav.send('Page.navigate',{url:f.origem+'/publico/index.html'+(comLink?'?pin='+c.pin.codigo+'#pin-do-quiz':'')});await nav.waitFor('typeof participacaoPin!=="undefined"');if(!comLink)await nav.evaluate('participacaoPin.abrir('+JSON.stringify(c.pin.codigo)+')');await nav.waitFor('!document.querySelector("#quizPinVisitante [data-pin=atividade]").hidden');}
    async function responder(nav,id){await nav.evaluate(`(()=>{const root=document.getElementById(${JSON.stringify(id)});root.querySelectorAll('[data-pin=perguntas] fieldset').forEach((b,n)=>b.querySelectorAll('input')[n%2].checked=true);root.querySelector('[data-pin=enviar]').closest('form').requestSubmit()})()`);await nav.waitFor(`document.querySelector('#${id} [data-pin=resultado]').textContent.includes('Resultado registrado')`);}
    it('professor salva quiz, vê o PIN imediatamente e compartilha link que abre a atividade',async()=>{
        await login(prof,'professor');await prof.evaluate('novoQuiz()');await prof.waitFor('document.querySelectorAll("#quizCadastroProjeto option").length===2');await prof.evaluate('document.getElementById("quizCadastroProjeto").value="51";carregarSubprojetosCadastroQuiz()');
        await prof.evaluate(`document.getElementById('quizTitulo').value='Criado na tela';document.querySelector('#quizPerguntas .quiz-pergunta-texto').value='Questão da tela';document.querySelectorAll('#quizPerguntas .quiz-alternativa-texto').forEach((i,n)=>i.value='Opção '+n);document.querySelector('#quizPerguntas .quiz-correta').checked=true;submitQuiz()`);
        const codigo=await prof.evaluate('document.getElementById("quizPinCodigo").value');assert.match(codigo,/^\d{8}$/);assert.equal(await prof.evaluate('document.getElementById("quizPinGestao").hidden'),false);
        const link=await prof.evaluate('document.getElementById("quizPinLink").href');assert.ok(link.includes('?pin='+codigo));await visitante.send('Page.navigate',{url:link});await visitante.waitFor('document.querySelector("#quizPinVisitante [data-pin=atividade]")?.hidden===false');assert.equal(await visitante.evaluate('document.querySelector("#quizPinVisitante h4").textContent'),'Criado na tela');
        await responder(visitante,'quizPinVisitante');assert.equal(await total(),1);await prof.evaluate('limparEstadoSessao()');assert.equal(await prof.evaluate('document.getElementById("quizPinCodigo").value'),'');assert.equal(await prof.evaluate('document.getElementById("quizPinLink").hasAttribute("href")'),false);
    });
    it('visitante responde sem conta; HTML literal não executa e nota vem do servidor',async()=>{
        const c=await criar();await abrirPublico(c);assert.equal(await visitante.evaluate('document.querySelector("#quizPinVisitante img")'),null);assert.equal(await visitante.evaluate('document.querySelector("#quizPinVisitante h4").textContent'),base().titulo);await responder(visitante,'quizPinVisitante');assert.ok(await visitante.evaluate('document.querySelector("#quizPinVisitante [data-pin=resultado]").textContent.includes("2 de 2")'));assert.deepEqual(await visitante.evaluate('__avisos'),[]);assert.equal(await total(),1);
    });
    it('aluno informa PIN dentro de Quizzes disponíveis mesmo sem vínculo ao projeto',async()=>{
        const c=await criar();await f.banco.query('DELETE FROM projeto_aluno WHERE aluno_id=42');await login(aluno,'aluno');await aluno.evaluate('showCatalogoQuizzes()');await aluno.evaluate('quizPinAluno.abrir('+JSON.stringify(c.pin.codigo)+')');await aluno.waitFor('!document.querySelector("#quizPinAluno [data-pin=atividade]").hidden');await responder(aluno,'quizPinAluno');assert.equal((await f.banco.query('SELECT aluno_id FROM quiz_resultado'))[0][0].aluno_id,42);assert.equal(await total(),0);
        await aluno.evaluate('logout()');await aluno.waitFor('location.pathname.includes("login.html")');assert.equal(await aluno.evaluate('sessionStorage.getItem("labhist.quiz-pin.aluno")'),null);
    });
    it('recarregar o link preserva a mesma participação e recupera o resultado sem duplicação',async()=>{
        const c=await criar();await abrirPublico(c,true);await responder(visitante,'quizPinVisitante');const pagina=await visitante.evaluate('__paginaPin');await visitante.send('Page.reload');await visitante.waitFor('window.__paginaPin!==undefined&&window.__paginaPin!=='+JSON.stringify(pagina));await visitante.waitFor('document.querySelector("#quizPinVisitante [data-pin=resultado]")?.textContent.includes("Resultado registrado")');assert.equal(await total(),1);
    });
    it('confirmação perdida mantém respostas e consulta recupera resultado já salvo',async()=>{
        const c=await criar();await abrirPublico(c);await visitante.evaluate(`window.__fetchPin=fetch;window.__perder=true;fetch=async(u,o)=>{const r=await __fetchPin(u,o);if(__perder&&String(u).endsWith('/quizzes/pin/respostas')){__perder=false;throw new TypeError('Resposta perdida após commit');}return r;};`);
        await visitante.evaluate(`document.querySelectorAll('#quizPinVisitante [data-pin=perguntas] fieldset').forEach((b,n)=>b.querySelectorAll('input')[n].checked=true);document.querySelector('#quizPinVisitante [data-pin=enviar]').closest('form').requestSubmit()`);await visitante.waitFor('document.querySelector("#quizPinVisitante [data-pin=aviso]").textContent.includes("preservadas")');assert.equal(await total(),1);assert.equal(await visitante.evaluate('document.querySelectorAll("#quizPinVisitante input:checked").length'),2);
        await visitante.evaluate('document.querySelector("#quizPinVisitante [data-pin=atividade]>button").click()');await visitante.waitFor('document.querySelector("#quizPinVisitante [data-pin=resultado]").textContent.includes("Resultado registrado")');assert.equal(await total(),1);
    });
    it('PIN encerrado bloqueia atividade aberta; renovação mostra outro código',async()=>{
        const c=await criar();await login(prof,'professor');await prof.evaluate('abrirQuiz('+c.id+')');await abrirPublico(c);await prof.evaluate('alterarPinQuiz("desativar")');assert.ok(await prof.evaluate('document.getElementById("quizPinStatus").textContent.includes("encerrado")'));
        await visitante.evaluate(`document.querySelectorAll('#quizPinVisitante [data-pin=perguntas] fieldset').forEach((b,n)=>b.querySelectorAll('input')[n].checked=true);document.querySelector('#quizPinVisitante [data-pin=enviar]').closest('form').requestSubmit()`);await visitante.waitFor('document.querySelector("#quizPinVisitante [data-pin=atividade]").hidden');assert.equal(await total(),0);await prof.evaluate('alterarPinQuiz("gerar")');assert.notEqual(await prof.evaluate('document.getElementById("quizPinCodigo").value'),c.pin.codigo);
    });
    it('PIN inválido/questões pendentes dão retorno sem gravar respostas',async()=>{
        const c=await criar();await visitante.send('Page.navigate',{url:f.origem+'/publico/index.html'});await visitante.waitFor('typeof participacaoPin!=="undefined"');await visitante.evaluate('participacaoPin.abrir("12")');assert.ok(await visitante.evaluate('document.querySelector("#quizPinVisitante [data-pin=aviso]").textContent.includes("8 dígitos")'));await visitante.evaluate('participacaoPin.abrir('+JSON.stringify(c.pin.codigo)+')');await visitante.evaluate('document.querySelector("#quizPinVisitante [data-pin=enviar]").closest("form").requestSubmit()');assert.ok(await visitante.evaluate('document.querySelector("#quizPinVisitante [data-pin=aviso]").textContent.includes("todas")'));assert.equal(await total(),0);
    });
    it('sessão de aluno encerrada não vira participação anônima silenciosamente',async()=>{
        const c=await criar();await login(aluno,'aluno');await aluno.evaluate('showCatalogoQuizzes()');await aluno.evaluate('fetch(API+"/logout",{method:"POST",credentials:"include"})');await aluno.evaluate('quizPinAluno.abrir('+JSON.stringify(c.pin.codigo)+')');await aluno.waitFor('location.pathname.includes("login.html")');assert.equal(await total(),0);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz_resultado'))[0][0].n,0);
    });
    it('celular/tablet/desktop não têm overflow; participação pública não usa a conta de professor',async()=>{
        const c=await criar();await login(prof,'professor');await abrirPublico(c,true,prof);await responder(prof,'quizPinVisitante');assert.equal(await total(),1);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz_resultado'))[0][0].n,0);
        for(const [width,height] of [[1280,900],[768,1024],[390,844],[360,800],[800,360]]){await prof.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});assert.equal(await prof.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
        await prof.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await prof.evaluate('document.getElementById("pin-do-quiz").scrollIntoView()');const foto=await prof.send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(tmpdir(),'labhist-quiz-pin-mobile.png'),Buffer.from(foto.data,'base64'));await prof.send('Emulation.clearDeviceMetricsOverride');
    });
});
