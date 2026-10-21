import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { carregarAplicacaoIsolada, aluno, professor, projeto } from './helpers/aplicacao.js';
import { abrirNavegador, chromePath } from './helpers/navegador.js';

// HTML/JS e Chrome reais; respostas HTTP controladas por DevTools, sem MySQL.
describe('P15: regressão dos estados HTTP na interface atual', {skip:!chromePath,concurrency:1},()=>{
    let app,servidor,origem,navegador,status=400,escritas=0;
    const erros=[];
    const projetoTela={...projeto,nome:projeto.titulo,professor_ids:[41],aluno_ids:[42],professores:[professor],alunos:[aluno]};
    before(async()=>{
        app=await carregarAplicacaoIsolada();servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        navegador=await abrirNavegador();
        navegador.on('Fetch.requestPaused',async evento=>{
            try{
                const url=new URL(evento.request.url),method=evento.request.method;
                if(url.hostname!=='localhost')return await navegador.send('Fetch.fulfillRequest',{requestId:evento.requestId,responseCode:200,body:''});
                let code=200,data={};
                if(method==='GET'){
                    if(url.pathname==='/sessao')data={conta_id:1,perfil:'administrador',pessoa_id:null,nome:'Admin fixture'};
                    else if(url.pathname==='/fixture-status401'){code=401;data={erro:'Sessão expirada.'};}
                    else if(url.pathname==='/projetos')data=[projetoTela];
                    else if(url.pathname.startsWith('/projetos/'))data=projetoTela;
                    else if(url.pathname.startsWith('/usuarios/'))data=url.searchParams.get('perfil')==='professor'?professor:aluno;
                    else data=url.searchParams.get('perfil')==='professor'?[professor]:url.searchParams.get('perfil')==='aluno'?[aluno]:[professor,aluno];
                }else if(method!=='OPTIONS'){escritas++;code=status;data={erro:'Falha fixture '+status};}
                await navegador.send('Fetch.fulfillRequest',{requestId:evento.requestId,responseCode:code,responseHeaders:[
                    {name:'Content-Type',value:'application/json; charset=utf-8'},
                    {name:'Access-Control-Allow-Origin',value:origem},{name:'Access-Control-Allow-Credentials',value:'true'},
                    {name:'Access-Control-Allow-Methods',value:'GET, POST, PUT, DELETE, OPTIONS'},{name:'Access-Control-Allow-Headers',value:'content-type'}
                ],body:Buffer.from(JSON.stringify(data)).toString('base64')});
            }catch(erro){erros.push(erro.message);}
        });
        await navegador.send('Fetch.enable',{patterns:[{urlPattern:'http://localhost:3000/*'},{urlPattern:'https://fonts.googleapis.com/*'}]});
        await navegador.send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('perfil','administrador');window.__alerts=[];window.alert=m=>__alerts.push(String(m));window.confirm=()=>true;"});
        await navegador.send('Page.navigate',{url:origem+'/mainPage/menuCadastro.html'});
        await navegador.waitFor('typeof submitAluno === "function" && document.readyState === "complete" && document.body.dataset.sessao === "confirmada"');
        await navegador.evaluate('window.__showFormOriginal=showForm;window.__refreshes=0;showForm=async(...args)=>{__refreshes++;return __showFormOriginal(...args)}');
        console.log('Navegador P15:',navegador.version.product);
    });
    beforeEach(async()=>{escritas=0;await navegador.evaluate('__alerts.length=0;__refreshes=0');});
    after(async()=>{if(navegador)await navegador.close();if(servidor){servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}assert.deepEqual(erros,[]);});
    for(const codigo of [400,403,404,409,500]){
        for(const perfil of ['aluno','professor']){
            it(`${perfil} mantém edição e mostra erro ${codigo} sem limpar formulário`,async()=>{
                status=codigo;await navegador.evaluate(`showRegisterForm('${perfil}')`);
                const prefixo=perfil==='aluno'?'aluno':'prof',dados=perfil==='aluno'?aluno:professor;
                await navegador.evaluate(`currentEditId=${dados.id};`+['nome','matricula','email','telefone'].map(c=>`document.getElementById('${prefixo}-${c}').value=${JSON.stringify(dados[c])};`).join(''));
                if(perfil==='aluno')await navegador.evaluate(`document.querySelectorAll('input[name="curso"]').forEach(r=>r.checked=r.value===${JSON.stringify(aluno.curso)});document.querySelectorAll('input[name="turma"]').forEach(r=>r.checked=r.value===${JSON.stringify(aluno.turma)});`);
                await navegador.evaluate(perfil==='aluno'?'submitAluno()':'submitProfessor()');
                assert.equal(escritas,1);assert.ok(await navegador.evaluate(`__alerts.includes(${JSON.stringify(codigo===500?'O servidor não conseguiu concluir a operação. Tente novamente.':'Falha fixture '+codigo)})`));
                assert.equal(await navegador.evaluate(`document.getElementById('${prefixo}-nome').value`),dados.nome);
                assert.equal(await navegador.evaluate('__refreshes'),0);
            });
        }
        it(`projeto mantém edição e equipe após erro ${codigo}`,async()=>{
            status=codigo;await navegador.evaluate('showRegisterForm("projeto")');
            await navegador.evaluate(`currentEditProjetoId=51;document.getElementById('proj-status').value='em andamento';selectedProjetoProfessores=[${JSON.stringify(professor)}];selectedProjetoAlunos=[${JSON.stringify(aluno)}];document.getElementById('proj-nome').value='Projeto preservado';`);
            await navegador.evaluate('submitProjeto()');assert.equal(escritas,1);
            assert.ok(await navegador.evaluate(`__alerts.includes(${JSON.stringify(codigo===500?'O servidor não conseguiu concluir a operação. Tente novamente.':'Falha fixture '+codigo)})`));assert.equal(await navegador.evaluate('document.getElementById("proj-nome").value'),'Projeto preservado');
            assert.equal(await navegador.evaluate('selectedProjetoProfessores.length+selectedProjetoAlunos.length'),2);
            assert.equal(await navegador.evaluate('__refreshes'),0);
        });
        for(const tipo of ['aluno','professor','projeto']){
            it(`exclusão de ${tipo} não atualiza a lista como sucesso após erro ${codigo}`,async()=>{
                status=codigo;
                await navegador.evaluate(tipo==='projeto'?'deleteProjeto({stopPropagation(){}},51)':`deleteUser({stopPropagation(){}},${tipo==='aluno'?42:41},'${tipo}')`);
                assert.equal(escritas,1);assert.equal(await navegador.evaluate('__refreshes'),0);
                assert.ok(await navegador.evaluate('__alerts.length>0'));
            });
        }
    }
    it('401 mantém redirecionamento para login',async()=>{
        await navegador.evaluate('apiFetch("http://localhost:3000/fixture-status401").catch(()=>{})');
        await navegador.waitFor('location.pathname === "/login/login.html"');
        assert.equal(await navegador.evaluate('location.pathname'),'/login/login.html');
    });
});
