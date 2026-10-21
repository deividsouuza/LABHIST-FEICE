import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { carregarAplicacaoIsolada, aluno, professor, projeto } from './helpers/aplicacao.js';
import { abrirNavegador, chromePath } from './helpers/navegador.js';

describe('P14: erros HTTP/JSON/rede no Chrome com respostas controladas', {skip:!chromePath,concurrency:1},()=>{
    let app,servidor,origem,nav,falha=null;const erros=[],pedidos=[];
    const projetoTela={...projeto,nome:projeto.titulo,professor_ids:[41],aluno_ids:[42]};
    const modos=[403,404,500,'json','rede','formato'];
    before(async()=>{
        app=await carregarAplicacaoIsolada();servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));
        nav.on('Fetch.requestPaused',async e=>{
            try{
                const url=new URL(e.request.url);if(url.hostname!=='localhost')return await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,body:''});
                pedidos.push(e.request);const rota=url.pathname+url.search,aplicar=falha&&rota===falha.rota;
                if(aplicar&&falha.modo==='rede')return await nav.send('Fetch.failRequest',{requestId:e.requestId,errorReason:'ConnectionRefused'});
                let status=aplicar&&typeof falha.modo==='number'?falha.modo:200,data;
                if(e.request.method!=='GET')data={mensagem:'Operacao realizada.',id:99};
                else if(url.pathname==='/sessao')data={conta_id:1,pessoa_id:null,perfil:'administrador',nome:'Admin'};
                else if(url.pathname==='/projetos')data=[projetoTela];
                else if(url.pathname.startsWith('/projetos/'))data=projetoTela;
                else if(url.pathname==='/documentos')data=[];
                else if(url.pathname.startsWith('/usuarios/'))data=url.searchParams.get('perfil')==='aluno'?aluno:professor;
                else data=url.searchParams.get('perfil')==='aluno'?[aluno]:[professor];
                if(status!==200)data={erro:status===500?'SQL senha-nao-expor':'Falha controlada '+status};
                if(aplicar&&falha.modo==='formato')data={id:42,nome:999};
                const body=aplicar&&falha.modo==='json'?'<html>invalido</html>':JSON.stringify(data);
                await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origem},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(body).toString('base64')});
            }catch(erro){erros.push(erro.message);}
        });
        await nav.send('Fetch.enable',{patterns:[{urlPattern:'http://localhost:3000/*'},{urlPattern:'https://fonts.googleapis.com/*'}]});
        await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__alerts=[];window.alert=m=>__alerts.push(m);window.confirm=()=>true;'});
        await nav.send('Page.navigate',{url:origem+'/mainPage/menuCadastro.html'});await nav.waitFor('document.body.dataset.sessao === "confirmada"');
    });
    beforeEach(async()=>{falha=null;pedidos.length=0;await nav.evaluate('__alerts.length=0');});
    after(async()=>{if(nav)await nav.close();if(servidor){servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}assert.deepEqual(erros,[]);});
    for(const tipo of ['aluno','professor','projeto'])for(const modo of modos){
        it(`${tipo}: detalhe ${modo} nao inicia edicao nem sobrescreve campos`,async()=>{
            const prefixo=tipo==='professor'?'prof':tipo==='aluno'?'aluno':'proj',id=tipo==='professor'?41:tipo==='aluno'?42:51;
            await nav.evaluate(`currentEditId=77;currentEditProjetoId=88;document.getElementById('${prefixo}-nome').value='Preservado';selectedProjetoProfessores=[{id:77}];selectedProjetoAlunos=[{id:88}];`);
            falha={rota:tipo==='projeto'?'/projetos/51':`/usuarios/${id}?perfil=${tipo}`,modo};
            await nav.evaluate(tipo==='projeto'?'editProjeto(51)':`editUser(${id},'${tipo}')`);
            assert.equal(await nav.evaluate('currentEditId'),77);assert.equal(await nav.evaluate('currentEditProjetoId'),88);
            assert.equal(await nav.evaluate(`document.getElementById('${prefixo}-nome').value`),'Preservado');assert.ok(await nav.evaluate('__alerts.length>0'));
            assert.equal(await nav.evaluate('__alerts.some(m=>m.includes("SQL")||m.includes("senha-nao-expor"))'),false);
        });
        it(`${tipo}: lista ${modo} preserva dados corretos sem TypeError`,async()=>{
            await nav.evaluate(`showForm('${tipo}')`);const corpo=tipo==='aluno'?'alunoListBody':tipo==='professor'?'profListBody':'projetoListBody';const antes=await nav.evaluate(`document.getElementById('${corpo}').innerHTML`);
            falha={rota:tipo==='projeto'?'/projetos':`/usuarios?perfil=${tipo}`,modo};await nav.evaluate(`showForm('${tipo}')`);
            assert.equal(await nav.evaluate(`document.getElementById('${corpo}').innerHTML`),antes);assert.ok(await nav.evaluate('__alerts.length>0'));
        });
    }
    it('falha ao carregar participantes preserva toda a edicao de projeto',async()=>{
        await nav.evaluate("currentEditProjetoId=77;document.getElementById('proj-nome').value='Preservado';selectedProjetoAlunos=[{id:88}]");
        falha={rota:'/usuarios?perfil=aluno',modo:500};await nav.evaluate('editProjeto(51)');assert.equal(await nav.evaluate('currentEditProjetoId'),77);assert.equal(await nav.evaluate('selectedProjetoAlunos[0].id'),88);assert.equal(await nav.evaluate("document.getElementById('proj-nome').value"),'Preservado');
    });
    it('P42: lista mostra descricao e resumos separados sem HTML arbitrario',async()=>{
        const html=await nav.evaluate(`renderList('projeto',[{id:51,nome:'Titulo',descricao:'Texto original',professores_texto:'<img src=x onerror=alert(1)>',alunos_texto:'Aluno & colega'}])`);
        assert.equal((html.match(/Texto original/g)||[]).length,1);assert.ok(html.includes('&lt;img'));assert.equal(html.includes('<img src=x'),false);assert.ok(html.includes('Aluno &amp; colega'));
    });
    it('resposta valida de edicao carrega equipe e IDs somente depois das consultas',async()=>{
        await nav.evaluate('editProjeto(51)');assert.equal(await nav.evaluate('currentEditProjetoId'),51);assert.equal(await nav.evaluate('selectedProjetoProfessores[0].id'),41);assert.equal(await nav.evaluate('selectedProjetoAlunos[0].id'),42);
    });
    it('multipart envia campos e arquivo e limpa somente apos confirmacao valida',async()=>{
        await nav.evaluate("sessaoAtual={conta_id:42,pessoa_id:42,perfil:'aluno',nome:'Aluno'};projetoAtualDetalheId=51;document.getElementById('docUploadDescricao').value='Relatorio';document.getElementById('docUploadTexto').value='Explicação separada';window.__fetchAntes=fetch;window.fetch=(u,o)=>{if(o?.body instanceof FormData)window.__textoEnviado=o.body.get('texto_explicativo');return __fetchAntes(u,o)};const dt=new DataTransfer();dt.items.add(new File(['PDF fixture'],'fixture.pdf',{type:'application/pdf'}));document.getElementById('docUploadArquivo').files=dt.files;enviarDocumento()");
        await nav.evaluate('fetch=__fetchAntes');assert.equal(await nav.evaluate('__textoEnviado'),'Explicação separada');assert.equal(await nav.evaluate("document.getElementById('docUploadTexto').value"),'');
        const envio=pedidos.find(p=>p.method==='POST'&&p.url.includes('/documentos'));assert.ok(envio);assert.ok(Object.values(envio.headers).some(v=>String(v).includes('multipart/form-data; boundary=')));assert.equal(await nav.evaluate("document.getElementById('docUploadDescricao').value"),'');
    });
    it('mutacao 200 com corpo invalido nao limpa formulario nem encerra edicao',async()=>{
        await nav.evaluate("currentEditId=41;document.getElementById('prof-nome').value='Preservado'");falha={rota:'/usuarios/41?perfil=professor',modo:'formato'};await nav.evaluate('submitProfessor()');assert.equal(await nav.evaluate('currentEditId'),41);assert.equal(await nav.evaluate("document.getElementById('prof-nome').value"),'Preservado');
    });
    it('P08: link usa ID autenticado e ignora caminho/URL recebidos no documento',async()=>{
        await nav.evaluate(`renderDocumentosList([{id:61,projeto_id:51,descricao:'Arquivo',arquivo_nome:'Relatorio.pdf',arquivo_caminho:'../../privado',download_url:'https://externo.invalid/arquivo'}],'aluno')`);
        assert.equal(await nav.evaluate("document.querySelector('#detalheDocumentosBody a').href"),'http://localhost:3000/documentos/61/download');
    });

    it('P37: falha no envio preserva descrição e texto explicativo',async()=>{falha={rota:'/projetos/51/documentos',modo:500};await nav.evaluate("sessaoAtual={conta_id:42,pessoa_id:42,perfil:'aluno',nome:'Aluno'};projetoAtualDetalheId=51;document.getElementById('docUploadDescricao').value='Descrição preservada';document.getElementById('docUploadTexto').value='Texto preservado';const dtFalha=new DataTransfer();dtFalha.items.add(new File(['PDF fixture'],'fixture.pdf',{type:'application/pdf'}));document.getElementById('docUploadArquivo').files=dtFalha.files;enviarDocumento()");assert.equal(await nav.evaluate("document.getElementById('docUploadTexto').value"),'Texto preservado');assert.equal(await nav.evaluate("document.getElementById('docUploadDescricao').value"),'Descrição preservada');});
    it('401 interrompe fluxo, limpa estado e encaminha ao login',async()=>{
        falha={rota:'/usuarios/42?perfil=aluno',modo:401};await nav.evaluate('editUser(42,"aluno");true');await nav.waitFor('location.pathname === "/login/login.html" && document.readyState === "complete"');assert.equal(pedidos.filter(p=>p.url.includes('/usuarios/42')).length,1);
    });
});
