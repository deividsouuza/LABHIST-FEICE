import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import { carregarAplicacaoIsolada } from './helpers/aplicacao.js';
import { abrirNavegador,chromePath } from './helpers/navegador.js';

describe('P28: quiz administrativo no Chrome com API controlada',{skip:!chromePath,concurrency:1},()=>{
    let nav,servidor,origem,papel,modo,quizzes;const pedidos=[],erros=[];
    before(async()=>{
        const app=await carregarAplicacaoIsolada();servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));
        nav.on('Fetch.requestPaused',async e=>{try{
            const u=new URL(e.request.url),method=e.request.method,headers=[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origem},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'Content-Type'}];
            if(u.hostname!=='localhost')return await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,body:''});
            if(method==='OPTIONS')return await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:204,responseHeaders:headers});
            const body=e.request.postData?JSON.parse(e.request.postData):undefined;pedidos.push({url:u.pathname,method,body});let status=200,data;
            if(u.pathname==='/sessao')data={conta_id:papel==='administrador'?1:42,pessoa_id:papel==='administrador'?null:42,perfil:papel,nome:'Fixture'};
            else if(u.pathname.startsWith('/quizzes')&&papel!=='administrador'){status=403;data={erro:'Sem permissao'};}
            else if(modo&&modo.url===u.pathname&&(!modo.method||modo.method===method)){status=modo.status;data={erro:'Falha fixture'};}
            else if(u.pathname==='/quizzes'&&method==='POST'){
                let aid=200;const id=quizzes.size+1;quizzes.set(id,{id,...body,perguntas:body.perguntas.map((p,i)=>({id:100+i,...p,alternativas:p.alternativas.map(a=>({id:++aid,...a}))}))});status=201;data={id,mensagem:'Criado.'};
            }
            else if(/^\/quizzes\/\d+$/.test(u.pathname)&&method==='DELETE'){quizzes.delete(Number(u.pathname.split('/')[2]));data={mensagem:'Excluído.'};}
            else if(/^\/quizzes\/\d+$/.test(u.pathname)&&method==='PUT'){const id=Number(u.pathname.split('/')[2]);let aid=500;quizzes.set(id,{id,...body,perguntas:body.perguntas.map((p,i)=>({id:p.id||400+i,...p,alternativas:p.alternativas.map(a=>({id:a.id||++aid,...a}))}))});data={mensagem:'Atualizado.'};}
            else if(u.pathname==='/quizzes')data=[...quizzes.values()].map(({id,titulo,descricao})=>({id,titulo,descricao}));
            else if(/^\/quizzes\/\d+$/.test(u.pathname)){data=quizzes.get(Number(u.pathname.split('/')[2]));if(!data){status=404;data={erro:'Ausente'};}}
            else{status=404;data={erro:'Rota inesperada'};}
            await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:headers,body:Buffer.from(JSON.stringify(data)).toString('base64')});
        }catch(e){erros.push(e.message);}});
        await nav.send('Fetch.enable',{patterns:[{urlPattern:'http://localhost:3000/*'},{urlPattern:'https://fonts.googleapis.com/*'}]});await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__alerts=[];window.alert=m=>__alerts.push(m);window.__confirmar=true;window.__confirmacoes=[];window.confirm=m=>{__confirmacoes.push(m);return __confirmar;};'});
    });
    async function carregar(perfil='administrador'){
        papel=perfil;await nav.evaluate("if(document.body)document.body.dataset.sessao='pendente'");await nav.send('Page.navigate',{url:origem+'/mainPage/menuCadastro.html'});await nav.waitFor('document.body && document.body.dataset.sessao==="confirmada"');
    }
    beforeEach(async()=>{modo=null;quizzes=new Map();pedidos.length=0;await carregar();});
    after(async()=>{if(nav)await nav.close();servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));assert.deepEqual(erros,[]);});
    const preencher=`novoQuiz();document.getElementById('quizTitulo').value='Quiz <img src=x>';document.getElementById('quizDescricao').value='Memória ç';for(const [i,p] of Array.from(document.querySelectorAll('.quiz-pergunta')).entries()){p.querySelector('.quiz-pergunta-texto').value='Pergunta '+i;p.querySelectorAll('.quiz-alternativa-texto').forEach((a,j)=>a.value='Alternativa '+j);p.querySelector('.quiz-correta').checked=true;}`;
    it('compoe varias perguntas, revisa, salva e consulta mesma estrutura',async()=>{
        await nav.evaluate(preencher);await nav.evaluate("adicionarPerguntaQuiz();const p=document.querySelectorAll('.quiz-pergunta')[1];p.querySelector('.quiz-pergunta-texto').value='Outra pergunta';p.querySelectorAll('.quiz-alternativa-texto').forEach((a,i)=>a.value='Opcao '+i);p.querySelectorAll('.quiz-correta')[1].checked=true;revisarQuiz()");assert.ok(await nav.evaluate("document.getElementById('quizRevisao').textContent.includes('(correta)')"));await nav.evaluate('submitQuiz()');assert.equal(quizzes.size,1);assert.equal(quizzes.get(1).perguntas.length,2);await nav.evaluate('abrirQuiz(1)');assert.equal(await nav.evaluate("document.getElementById('quizDetalheTitulo').textContent"),'Quiz <img src=x>');assert.equal(await nav.evaluate("document.querySelector('#detalheQuiz img')"),null);assert.ok(await nav.evaluate("document.getElementById('quizDetalheCorpo').textContent.includes('Outra pergunta')"));
    });
    for(const [nome,alterar] of [['titulo',"document.getElementById('quizTitulo').value=' '"],['pergunta',"document.querySelector('.quiz-pergunta-texto').value=''"],['alternativa',"document.querySelector('.quiz-alternativa-texto').value=''"],['correta',"document.querySelector('.quiz-correta').checked=false"],['sem perguntas',"document.getElementById('quizPerguntas').replaceChildren()"]])it(`${nome} invalido mostra erro sem POST ou perda de rascunho`,async()=>{
        await nav.evaluate(preencher);await nav.evaluate(alterar+';submitQuiz()');assert.equal(pedidos.some(p=>p.method==='POST'),false);assert.ok(await nav.evaluate("document.getElementById('quizFormAviso').textContent.includes('Confira')"));assert.equal(await nav.evaluate("document.getElementById('quizDescricao').value"),'Memória ç');
    });
    for(const status of [400,403,500])it(`POST${status} preserva toda composicao e reabilita campos`,async()=>{
        await nav.evaluate(preencher);modo={url:'/quizzes',method:'POST',status};const antes=await nav.evaluate('JSON.stringify(capturarQuiz())');await nav.evaluate('submitQuiz()');assert.equal(await nav.evaluate('JSON.stringify(capturarQuiz())'),antes);assert.equal(await nav.evaluate("document.getElementById('quizSalvar').disabled"),false);assert.equal(await nav.evaluate("document.getElementById('quizTitulo').disabled"),false);assert.equal(quizzes.size,0);
    });
    for(const perfil of ['aluno'])it(`${perfil} nao abre formulario nem consulta gabarito por chamada direta`,async()=>{
        await carregar(perfil);pedidos.length=0;await nav.evaluate('showQuizzes();novoQuiz();abrirQuiz(1);submitQuiz()');assert.equal(pedidos.length,0);assert.equal(await nav.evaluate("document.getElementById('formQuiz').style.display"),'none');assert.equal(await nav.evaluate("getComputedStyle(document.getElementById('navChildren')).display"),'none');
    });
    it('remover/recompor alternativas mantem escolha unica e revisao atualizada',async()=>{
        await nav.evaluate(preencher);await nav.evaluate("const p=document.querySelector('.quiz-pergunta');Array.from(p.querySelectorAll('button')).find(b=>b.textContent==='+ Alternativa').click();p.querySelectorAll('.quiz-alternativa-texto')[2].value='Terceira';p.querySelectorAll('.quiz-correta')[2].click();revisarQuiz()");assert.equal(await nav.evaluate('capturarQuiz().perguntas[0].alternativas.filter(a=>a.correta).length'),1);await nav.evaluate("document.querySelector('.quiz-alternativa-texto').value='Mudou';document.querySelector('.quiz-alternativa-texto').dispatchEvent(new Event('input',{bubbles:true}))");assert.equal(await nav.evaluate("document.getElementById('quizRevisao').textContent"),'');
    });
    it('detalhe404 mantem lista e nao abre tela vazia',async()=>{await nav.evaluate('showQuizzes()');modo={url:'/quizzes/999',status:404};await nav.evaluate('abrirQuiz(999)');assert.equal(await nav.evaluate("document.getElementById('detalheQuiz').style.display"),'none');assert.equal(await nav.evaluate("document.getElementById('listQuizzes').style.display"),'block');});
    it('clique duplo envia um POST e sucesso limpa composicao',async()=>{await nav.evaluate(preencher);await nav.evaluate('Promise.all([submitQuiz(),submitQuiz()])');assert.equal(pedidos.filter(p=>p.method==='POST').length,1);assert.equal(await nav.evaluate("document.getElementById('quizTitulo').value"),'');assert.equal(await nav.evaluate("document.getElementById('quizPerguntas').children.length"),0);});
    it('mudanca de perfil na reconfirmacao de sessao apaga gabarito e rascunho anterior',async()=>{
        await nav.evaluate(preencher);await nav.evaluate('submitQuiz()');await nav.evaluate('abrirQuiz(1)');assert.ok(await nav.evaluate("document.getElementById('quizDetalheCorpo').textContent.includes('(correta)')"));await nav.evaluate(preencher);papel='aluno';await nav.evaluate('inicializarSessao()');assert.equal(await nav.evaluate('perfilAtual()'),'aluno');for(const id of ['quizDetalheCorpo','quizRevisao','quizPerguntas'])assert.equal(await nav.evaluate(`document.getElementById('${id}').textContent`),'');assert.equal(await nav.evaluate("document.getElementById('quizTitulo').value"),'');assert.equal(await nav.evaluate("document.getElementById('formQuiz').style.display"),'none');
    });

    async function prepararEdicao(){await nav.evaluate(preencher);await nav.evaluate('submitQuiz()');await nav.evaluate('abrirQuiz(1)');await nav.evaluate('editarQuiz()');}
    it('P30: carrega IDs, altera textos e gabarito, salva e recarrega',async()=>{
        await prepararEdicao();const antes=structuredClone(quizzes.get(1));assert.deepEqual(await nav.evaluate('capturarQuiz().perguntas'),antes.perguntas);
        await nav.evaluate("document.getElementById('quizTitulo').value='Editado';document.getElementById('quizDescricao').value='Descrição editada';document.querySelector('.quiz-pergunta-texto').value='Pergunta editada';document.querySelector('.quiz-alternativa-texto').value='Alternativa editada';document.querySelectorAll('.quiz-correta')[1].checked=true;submitQuiz()");
        const q=quizzes.get(1);assert.equal(q.titulo,'Editado');assert.equal(q.perguntas[0].id,antes.perguntas[0].id);assert.deepEqual(q.perguntas[0].alternativas.map(a=>a.id),antes.perguntas[0].alternativas.map(a=>a.id));assert.equal(q.perguntas[0].alternativas[1].correta,true);assert.equal(await nav.evaluate("document.getElementById('detalheQuiz').style.display"),'block');
    });
    for(const status of [400,403,404,409,500])it('P30: PUT'+status+' preserva edição e não mostra sucesso',async()=>{
        await prepararEdicao();modo={url:'/quizzes/1',method:'PUT',status};await nav.evaluate("document.getElementById('quizTitulo').value='Rascunho editado'");const antes=await nav.evaluate('JSON.stringify(capturarQuiz())');await nav.evaluate('submitQuiz()');assert.ok(await nav.evaluate("document.getElementById('quizFormAviso').textContent.includes('preservad')"));assert.equal(await nav.evaluate('JSON.stringify(capturarQuiz())'),antes);assert.equal(await nav.evaluate("document.getElementById('formQuiz').style.display"),'block');assert.equal(quizzes.get(1).titulo,'Quiz <img src=x>');
    });
    for(const status of [403,404,500])it('P30: GET'+status+' não substitui formulário existente',async()=>{
        await prepararEdicao();const antes=await nav.evaluate('JSON.stringify(capturarQuiz())');modo={url:'/quizzes/1',method:'GET',status};await nav.evaluate('editarQuiz(1)');assert.equal(await nav.evaluate('JSON.stringify(capturarQuiz())'),antes);
    });
    it('P30: adição/remoção mantém IDs retidos e cancelar limpa modo de edição',async()=>{
        await prepararEdicao();await nav.evaluate("const p=document.querySelector('.quiz-pergunta');Array.from(p.querySelectorAll('button')).find(b=>b.textContent==='+ Alternativa').click();p.querySelectorAll('.quiz-alternativa-texto')[2].value='Nova alternativa';p.querySelectorAll('.quiz-alternativa button')[1].click()");const b=await nav.evaluate('capturarQuiz()');assert.ok(b.perguntas[0].alternativas[0].id);assert.equal(b.perguntas[0].alternativas[1].id,undefined);await nav.evaluate('showQuizzes();novoQuiz()');assert.equal(await nav.evaluate('quizEditandoId'),null);assert.equal(await nav.evaluate("document.getElementById('quizSalvar').textContent"),'Cadastrar quiz');
    });
    it('P30: estrutura inválida impede PUT e perfil acadêmico não carrega edição',async()=>{
        await prepararEdicao();await nav.evaluate("document.querySelector('.quiz-pergunta-texto').value='';submitQuiz()");assert.equal(pedidos.some(p=>p.method==='PUT'),false);await carregar('aluno');pedidos.length=0;await nav.evaluate('editarQuiz(1)');assert.equal(pedidos.length,0);
    });

    async function prepararExclusao(){await nav.evaluate(preencher);await nav.evaluate('submitQuiz()');await nav.evaluate('abrirQuiz(1)');}
    it('P32: cancelar confirmação não envia DELETE nem altera item',async()=>{await prepararExclusao();await nav.evaluate('__confirmar=false;excluirQuiz()');assert.equal(pedidos.some(p=>p.method==='DELETE'),false);assert.equal(quizzes.size,1);assert.ok(await nav.evaluate("__confirmacoes[0].includes('Quiz <img src=x>')"));});
    it('P32: sucesso confirmado atualiza lista, limpa seleção e clique duplo envia um DELETE',async()=>{await prepararExclusao();await nav.evaluate('Promise.all([excluirQuiz(),excluirQuiz()])');assert.equal(pedidos.filter(p=>p.method==='DELETE').length,1);assert.equal(quizzes.size,0);assert.equal(await nav.evaluate('quizDetalheId'),null);assert.equal(await nav.evaluate("document.getElementById('listQuizzes').style.display"),'block');});
    for(const status of [403,404,409,500])it('P32: DELETE'+status+' mantém item/detalhe e informa impedimento',async()=>{await prepararExclusao();modo={url:'/quizzes/1',method:'DELETE',status};await nav.evaluate('excluirQuiz()');assert.equal(quizzes.size,1);assert.equal(await nav.evaluate('quizDetalheId'),1);assert.equal(await nav.evaluate("document.getElementById('detalheQuiz').style.display"),'block');assert.ok(await nav.evaluate("document.getElementById('quizDetalheAviso').textContent.includes('mantido')"));assert.equal(await nav.evaluate("document.getElementById('quizExcluir').disabled"),false);});
    it('P32: perfil acadêmico não exclui nem por chamada direta',async()=>{await carregar('professor');pedidos.length=0;await nav.evaluate('excluirQuiz(1)');assert.equal(pedidos.length,0);});

    it('P30: GET falho após PUT confirmado mantém edição e encerra indicação de salvamento',async()=>{await prepararEdicao();modo={url:'/quizzes/1',method:'GET',status:500};await nav.evaluate("document.getElementById('quizTitulo').value='Gravado';submitQuiz()");assert.equal(quizzes.get(1).titulo,'Gravado');assert.equal(await nav.evaluate("document.getElementById('quizTitulo').value"),'Gravado');assert.equal(await nav.evaluate("document.getElementById('formQuiz').style.display"),'block');assert.ok(await nav.evaluate("document.getElementById('quizFormAviso').textContent.includes('visualização')"));assert.equal(await nav.evaluate("document.getElementById('quizSalvar').disabled"),false);});
});
