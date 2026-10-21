import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import { carregarAplicacaoIsolada,aluno,professor } from './helpers/aplicacao.js';
import { abrirNavegador,chromePath } from './helpers/navegador.js';

describe('P18/P19/P23/P24/P25/P26: interface no Chrome com respostas controladas',{skip:!chromePath,concurrency:1},()=>{
    let nav,servidor,origem,papel='administrador',falha=null;const erros=[],pedidos=[];let projetos,subprojetos,documentos;
    const projeto=id=>({id,nome:'Projeto '+id,descricao:'Descrição <img src=x onerror=alert(1)>',objetivo:'Objetivo ç',status:null,professor_ids:[41],aluno_ids:[42],professores:[{id:41,nome:'Professor A'}],alunos:[{id:42,nome:'Aluno A'}],professores_texto:'Professor A',alunos_texto:'Aluno A'});
    before(async()=>{
        const app=await carregarAplicacaoIsolada();servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));
        nav.on('Fetch.requestPaused',async e=>{try{
            const url=new URL(e.request.url),method=e.request.method;if(url.hostname!=='localhost')return await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,body:''});
            if(method==='OPTIONS')return await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:origem},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,DELETE,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'Content-Type'}]});
            const body=e.request.postData?JSON.parse(e.request.postData):undefined;pedidos.push({url:url.pathname,method,body});let status=200,data;
            if(falha&&falha.url===url.pathname&&(!falha.method||falha.method===method)){status=falha.status;data={erro:'Falha controlada'};}
            else if(url.pathname==='/sessao')data={conta_id:papel==='administrador'?1:papel==='aluno'?42:41,pessoa_id:papel==='administrador'?null:papel==='aluno'?42:41,perfil:papel,nome:papel};
            else if(url.pathname==='/usuarios')data=url.searchParams.get('perfil')==='aluno'?[aluno]:[professor];
            else if(url.pathname==='/projetos'&&method==='GET')data=[...projetos.values()];
            else if(url.pathname==='/projetos'&&method==='POST'){projetos.set(60,{...projeto(60),nome:body.nome,...body});data={id:60,mensagem:'Cadastrado.'};}
            else if(/^\/projetos\/\d+\/subprojetos$/.test(url.pathname)){
                const pai=Number(url.pathname.split('/')[2]);
                if(!projetos.has(pai)){status=404;data={erro:'Ausente'};}
                else if(method==='POST'){if(papel!=='administrador'){status=403;data={erro:'Sem permissao'};}else{const id=Math.max(70,...subprojetos.keys())+1;subprojetos.set(id,{id,projeto_id:pai,...body});data={id,mensagem:'Cadastrado.'};}}
                else data=[...subprojetos.values()].filter(s=>s.projeto_id===pai);
            }
            else if(/^\/subprojetos\/\d+$/.test(url.pathname)){
                const id=Number(url.pathname.split('/')[2]);data=subprojetos.get(id);
                if(!data){status=404;data={erro:'Ausente'};}
                else if(method==='PUT'){
                    if(papel!=='administrador'){status=403;data={erro:'Sem permissao'};}
                    else if(body.projeto_id!==data.projeto_id){status=400;data={erro:'Pai divergente'};}
                    else{subprojetos.set(id,{...data,...body,id,projeto_id:data.projeto_id});data={mensagem:'Atualizado.'};}
                }
                else if(method==='DELETE'){
                    if(papel!=='administrador'){status=403;data={erro:'Sem permissao'};}
                    else{subprojetos.delete(id);data={mensagem:'Excluido.'};}
                }
            }
            else if(/^\/projetos\/\d+$/.test(url.pathname)){
                const id=Number(url.pathname.split('/')[2]);data=projetos.get(id);if(!data){status=404;data={erro:'Ausente'};}else if(method==='PUT'){projetos.set(id,{...data,...body});data={mensagem:'Atualizado.'};}
            }
            else if(url.pathname==='/documentos')data=papel==='aluno'?documentos.filter(d=>d.autor_conta_id===42&&d.autor_perfil==='aluno'):documentos;else{status=404;data={erro:'Rota inesperada'};}
            await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origem},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(JSON.stringify(data)).toString('base64')});
        }catch(e){erros.push(e.message);}});
        await nav.send('Fetch.enable',{patterns:[{urlPattern:'http://localhost:3000/*'},{urlPattern:'https://fonts.googleapis.com/*'}]});await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__alerts=[];window.alert=m=>__alerts.push(m);window.confirm=()=>true;'});
    });
    async function carregar(perfil='administrador'){
        papel=perfil;await nav.evaluate("if(document.body)document.body.dataset.sessao='pendente'");await nav.send('Page.navigate',{url:origem+'/mainPage/menuCadastro.html'});await nav.waitFor('document.body && document.body.dataset.sessao==="confirmada"');
    }
    beforeEach(async()=>{projetos=new Map([[51,projeto(51)],[52,projeto(52)]]);subprojetos=new Map();documentos=[];falha=null;pedidos.length=0;await carregar();});
    after(async()=>{if(nav)await nav.close();servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));assert.deepEqual(erros,[]);});
    for(const status of ['em andamento','finalizado','cancelado'])it(`P18: cria e edita status ${status} exibido na lista`,async()=>{
        await nav.evaluate(`showRegisterForm('projeto');document.getElementById('proj-nome').value='Novo';document.getElementById('proj-status').value=${JSON.stringify(status)};selectedProjetoProfessores=[{id:41}];selectedProjetoAlunos=[{id:42}];submitProjeto()`);await nav.waitFor('document.getElementById("projetoListBody").textContent.includes("Novo")').catch(async e=>{e.message+=' '+JSON.stringify({pedidos,erros,alerts:await nav.evaluate('__alerts')});throw e;});assert.equal(projetos.get(60).status,status);
        await nav.evaluate('editProjeto(51)');await nav.evaluate(`document.getElementById('proj-status').value=${JSON.stringify(status)};submitProjeto()`);assert.equal(projetos.get(51).status,status);
    });
    it('P18: novo exige escolha sem enviar requisicao',async()=>{await nav.evaluate("showRegisterForm('projeto');document.getElementById('proj-nome').value='Novo';selectedProjetoProfessores=[{id:41}];selectedProjetoAlunos=[{id:42}];submitProjeto()");assert.equal(pedidos.some(p=>p.method==='POST'),false);assert.ok(await nav.evaluate('__alerts.some(m=>m.includes("status"))'));});
    it('P18: edicao do legado preserva NULL e lista mostra Nao informado',async()=>{await nav.evaluate('editProjeto(51)');assert.equal(await nav.evaluate("document.getElementById('proj-status').value"),'');await nav.evaluate('submitProjeto()');assert.equal(projetos.get(51).status,null);await nav.waitFor('document.getElementById("projetoListBody").textContent.includes("Não informado")');});
    it('P18: falha ao salvar preserva status e textos preenchidos',async()=>{await nav.evaluate('editProjeto(51)');falha={url:'/projetos/51',method:'PUT',status:500};await nav.evaluate("document.getElementById('proj-status').value='cancelado';document.getElementById('proj-nome').value='Preservado';submitProjeto()");assert.equal(await nav.evaluate("document.getElementById('proj-status').value"),'cancelado');assert.equal(await nav.evaluate("document.getElementById('proj-nome').value"),'Preservado');assert.equal(await nav.evaluate('currentEditProjetoId'),51);});
    for(const papelTeste of ['aluno','professor'])it(`P19: ${papelTeste} le detalhe seguro, membros, status e vazio de documentos`,async()=>{
        projetos.get(51).status='finalizado';await carregar(papelTeste);await nav.evaluate('abrirDetalheProjeto(51)');assert.equal(await nav.evaluate('projetoAtualDetalheId'),51);const texto=await nav.evaluate("document.getElementById('detalheProjetoInfo').textContent");assert.ok(texto.includes('Objetivo ç'));assert.ok(texto.includes('Finalizado'));assert.ok(texto.includes('Professor A'));assert.ok(texto.includes('Aluno A'));assert.ok(texto.includes('vinculado'));assert.equal(await nav.evaluate("document.querySelector('#detalheProjetoInfo img')"),null);assert.ok(await nav.evaluate("document.getElementById('detalheDocumentosBody').textContent.includes('Nenhum documento')"));assert.equal(await nav.evaluate("document.getElementById('docUploadEnviar').disabled"),false);assert.ok(pedidos.some(p=>p.url==='/projetos/51'&&p.method==='GET'));assert.equal(pedidos.some(p=>p.url==='/usuarios'),false);
    });
    for(const status of [403,404,500])it(`P19: detalhe ${status} limpa dados anteriores e nao permite envio`,async()=>{
        await carregar('aluno');await nav.evaluate('abrirDetalheProjeto(51)');falha={url:'/projetos/52',status};pedidos.length=0;await nav.evaluate('abrirDetalheProjeto(52)');assert.equal(await nav.evaluate('projetoAtualDetalheId'),null);assert.equal(await nav.evaluate("document.getElementById('docUploadEnviar').disabled"),true);assert.equal(await nav.evaluate("document.getElementById('detalheProjetoNome').textContent"),'Projeto indisponível');assert.equal(await nav.evaluate("document.getElementById('detalheDocumentosBody').textContent"),'');assert.equal(pedidos.some(p=>p.url==='/documentos'),false);
    });
    it('P19: voltar e menu movel preservam fluxo de meus projetos',async()=>{
        await carregar('professor');await nav.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await nav.evaluate('toggleSidebar();abrirDetalheProjeto(51)');assert.equal(await nav.evaluate("document.getElementById('sidebar').classList.contains('open')"),false);await nav.evaluate('backToMeusProjetos()');await nav.waitFor('document.getElementById("meusProjetosListBody").textContent.includes("Projeto 51")');assert.equal(await nav.evaluate('projetoAtualDetalheId'),null);await nav.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    });
    it('P19: documentos autorizados e autores continuam identificados por perfil',async()=>{
        documentos=[{id:61,projeto_id:51,descricao:'Envio do aluno',arquivo_nome:'a.pdf',enviado_por:42,enviado_por_perfil:'aluno',autoria_confirmada:true,autor_conta_id:42,autor_nome:'Aluno A',autor_perfil:'aluno'},{id:62,projeto_id:51,descricao:'Envio do professor',arquivo_nome:'p.pdf',enviado_por:41,enviado_por_perfil:'professor',autoria_confirmada:true,autor_conta_id:41,autor_nome:'Professor A',autor_perfil:'professor'}];
        await carregar('professor');await nav.evaluate('abrirDetalheProjeto(51)');const texto=await nav.evaluate("document.getElementById('detalheDocumentosBody').textContent");assert.ok(texto.includes('Aluno: Aluno A'));assert.ok(texto.includes('Professor: Professor A'));
        await carregar('aluno');await nav.evaluate('abrirDetalheProjeto(51)');const links=await nav.evaluate("Array.from(document.querySelectorAll('#detalheDocumentosBody a')).map(a=>a.href)");assert.deepEqual(links,['http://localhost:3000/documentos/61/download']);
    });
    it('P19: sessao expirada encaminha ao login sem reabrir dados',async()=>{
        await carregar('aluno');falha={url:'/projetos/51',status:401};await nav.evaluate('abrirDetalheProjeto(51)').catch(e=>{if(!/context|navigat/i.test(e.message))throw e;});await nav.waitFor('location.pathname.includes("/login/") && document.readyState==="complete"');
    });
    for(const papelTeste of ['administrador','aluno','professor'])it(`P23: ${papelTeste} le lista/detalhe e retorna ao pai correto`,async()=>{
        subprojetos.set(71,{id:71,projeto_id:51,titulo:'Memórias <img src=x>',objetivo:'Objetivo do subprojeto',descricao:'Descrição\nLinha2',temas_abordados:'Tema ç'});subprojetos.set(72,{id:72,projeto_id:52,titulo:'Outro pai',objetivo:'',descricao:'',temas_abordados:''});
        await carregar(papelTeste);await nav.evaluate('abrirSubprojetosProjeto(51)');const texto=await nav.evaluate("document.getElementById('subprojetosListBody').textContent");assert.ok(texto.includes('Memórias'));assert.equal(texto.includes('Outro pai'),false);assert.equal(await nav.evaluate("document.querySelector('#subprojetosListBody img')"),null);
        await nav.evaluate('abrirDetalheSubprojeto(71)');assert.equal(await nav.evaluate("document.getElementById('subprojetoTitulo').textContent"),'Memórias <img src=x>');assert.ok(await nav.evaluate("document.getElementById('subprojetoCampos').textContent.includes('Tema ç')"));await nav.evaluate('voltarListaSubprojetos()');assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),51);await nav.evaluate('voltarDoSubprojetoAoProjeto()');assert.equal(await nav.evaluate(papelTeste==='administrador'?'currentEditProjetoId':'projetoAtualDetalheId'),51);
    });
    it('P23: projeto vazio tem estado explicito',async()=>{await nav.evaluate('abrirSubprojetosProjeto(51)');assert.ok(await nav.evaluate("document.getElementById('subprojetosListBody').textContent.includes('Nenhum subprojeto')"));});
    it('P23: detalhe de outro pai nao substitui contexto nem abre tela vazia',async()=>{
        subprojetos.set(72,{id:72,projeto_id:52,titulo:'Outro pai',objetivo:'',descricao:'',temas_abordados:''});await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(72)');assert.equal(await nav.evaluate("document.getElementById('detalheSubprojeto').style.display"),'none');assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),51);assert.ok(await nav.evaluate("document.getElementById('subprojetosAviso').textContent.includes('Não foi possível')"));
    });
    for(const status of [403,404,500])it(`P23: lista e detalhe com erro ${status} preservam contexto seguro`,async()=>{
        falha={url:'/projetos/51/subprojetos',status};await nav.evaluate('abrirSubprojetosProjeto(51)');assert.ok(await nav.evaluate("document.getElementById('subprojetosAviso').textContent.includes('Não foi possível')"));assert.equal(await nav.evaluate("document.getElementById('subprojetosListBody').textContent"),'');falha=null;await nav.evaluate('abrirSubprojetosProjeto(51)');falha={url:'/subprojetos/71',status};await nav.evaluate('abrirDetalheSubprojeto(71)');assert.equal(await nav.evaluate("document.getElementById('detalheSubprojeto').style.display"),'none');
    });
    it('P23: lista401 encerra sessao e retorna login',async()=>{falha={url:'/projetos/51/subprojetos',status:401};await nav.evaluate('abrirSubprojetosProjeto(51)').catch(e=>{if(!/context|navigat/i.test(e.message))throw e;});await nav.waitFor('location.pathname.includes("/login/") && document.readyState==="complete"');});
    it('P24: cria em dois pais, atualiza apenas lista correta e preserva Unicode',async()=>{
        for(const pai of [51,52]){
            await nav.evaluate(`abrirSubprojetosProjeto(${pai})`);await nav.evaluate(`novoSubprojeto();document.getElementById('sub-titulo').value='Tema ${pai} <img src=x>';document.getElementById('sub-objetivo').value='Investigar ç';document.getElementById('sub-descricao').value='Descrição';document.getElementById('sub-temas_abordados').value='História';submitSubprojeto()`);
            assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),pai);assert.ok(await nav.evaluate(`document.getElementById('subprojetosListBody').textContent.includes('Tema ${pai}')`));assert.equal(await nav.evaluate("document.getElementById('sub-titulo').value"),'');
        }
        assert.deepEqual([...subprojetos.values()].map(s=>[s.projeto_id,s.objetivo]),[[51,'Investigar ç'],[52,'Investigar ç']]);assert.equal(await nav.evaluate("document.getElementById('subprojetosListBody').textContent.includes('Tema 51')"),false);assert.equal(await nav.evaluate("document.querySelector('#subprojetosListBody img')"),null);
    });
    for(const titulo of ['', '   ', 'a'.repeat(256)])it(`P24: titulo invalido ${titulo.length} nao envia nem limpa campos`,async()=>{
        await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate(`novoSubprojeto();document.getElementById('sub-titulo').value=${JSON.stringify(titulo)};document.getElementById('sub-descricao').value='Preservado';submitSubprojeto()`);assert.equal(pedidos.some(p=>p.method==='POST'),false);assert.equal(await nav.evaluate("document.getElementById('sub-descricao').value"),'Preservado');assert.ok(await nav.evaluate("document.getElementById('subprojetoFormAviso').textContent.includes('título')"));
    });
    it('P24: limite TEXT em bytes UTF-8 e validado antes da API',async()=>{
        await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate("novoSubprojeto();document.getElementById('sub-titulo').value='Tema';document.getElementById('sub-descricao').value='ç'.repeat(32768);submitSubprojeto()");assert.equal(pedidos.some(p=>p.method==='POST'),false);assert.equal(await nav.evaluate("document.getElementById('sub-descricao').value.length"),32768);
    });
    for(const status of [403,404,500])it(`P24: POST ${status} preserva formulario e pai`,async()=>{
        await nav.evaluate('abrirSubprojetosProjeto(51)');falha={url:'/projetos/51/subprojetos',method:'POST',status};await nav.evaluate("novoSubprojeto();document.getElementById('sub-titulo').value='Preservado';document.getElementById('sub-objetivo').value='Objetivo';submitSubprojeto()");assert.equal(await nav.evaluate("document.getElementById('sub-titulo').value"),'Preservado');assert.equal(await nav.evaluate("document.getElementById('sub-objetivo').value"),'Objetivo');assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),51);assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'block');assert.equal(subprojetos.size,0);
    });
    for(const papelTeste of ['aluno','professor'])it(`P24: ${papelTeste} nao tem acao de escrita e chamada forjada nao envia`,async()=>{
        await carregar(papelTeste);await nav.evaluate('abrirSubprojetosProjeto(51)');assert.equal(await nav.evaluate("document.getElementById('btnNovoSubprojeto').hidden"),true);await nav.evaluate("novoSubprojeto();document.getElementById('sub-titulo').value='Forjado';submitSubprojeto()");assert.equal(pedidos.some(p=>p.method==='POST'),false);assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'none');
    });
    it('P24: duplo clique nao duplica e voltar mantem pai selecionado',async()=>{
        await nav.evaluate('abrirSubprojetosProjeto(52)');await nav.evaluate("novoSubprojeto();document.getElementById('sub-titulo').value='Unico';Promise.all([submitSubprojeto(),submitSubprojeto()])");assert.equal(pedidos.filter(p=>p.method==='POST').length,1);assert.equal(subprojetos.size,1);await nav.evaluate('novoSubprojeto();voltarListaSubprojetos()');assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),52);
    });
    it('P24: pai indisponivel nao oferece cadastro',async()=>{falha={url:'/projetos/51',status:404};await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('novoSubprojeto()');assert.equal(await nav.evaluate("document.getElementById('btnNovoSubprojeto').hidden"),true);assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'none');});
    function prepararSubprojetos(){
        subprojetos.set(71,{id:71,projeto_id:51,titulo:'Primeiro',objetivo:'Objetivo antigo',descricao:'Descrição antiga',temas_abordados:'Tema antigo'});
        subprojetos.set(72,{id:72,projeto_id:51,titulo:'Irmao',objetivo:'Outro',descricao:'Outra',temas_abordados:'Outro tema'});
    }
    it('P25: edita todos os campos, recarrega detalhe/lista e preserva pai/irmao',async()=>{
        prepararSubprojetos();const irmao={...subprojetos.get(72)};await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');assert.equal(await nav.evaluate("getComputedStyle(document.getElementById('btnEditarSubprojeto')).display==='none'"),false);
        await nav.evaluate("editarSubprojeto(71)");assert.equal(await nav.evaluate('subprojetoEditandoId'),71);await nav.evaluate("document.getElementById('sub-titulo').value='Editado';document.getElementById('sub-objetivo').value='Objetivo ç';document.getElementById('sub-descricao').value='Descrição nova';document.getElementById('sub-temas_abordados').value='Novos temas';submitSubprojeto()");
        assert.deepEqual(subprojetos.get(71),{aluno_ids:[],id:71,projeto_id:51,titulo:'Editado',objetivo:'Objetivo ç',descricao:'Descrição nova',temas_abordados:'Novos temas'});assert.deepEqual(subprojetos.get(72),irmao);assert.equal(await nav.evaluate("document.getElementById('subprojetoTitulo').textContent"),'Editado');await nav.evaluate('voltarListaSubprojetos()');assert.ok(await nav.evaluate("document.getElementById('subprojetosListBody').textContent.includes('Editado')"));await nav.evaluate('editarSubprojeto(71);');await nav.evaluate('submitSubprojeto()');assert.equal(subprojetos.get(71).titulo,'Editado');
    });
    for(const status of [403,404,500])it(`P25: GET ${status} nao abre formulario vazio nem apaga rascunho`,async()=>{
        prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate("document.getElementById('sub-titulo').value='Rascunho'");falha={url:'/subprojetos/71',method:'GET',status};await nav.evaluate('editarSubprojeto(71)');assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'none');assert.equal(await nav.evaluate("document.getElementById('sub-titulo').value"),'Rascunho');assert.equal(await nav.evaluate('subprojetoEditandoId'),null);
    });
    for(const status of [403,404,500])it(`P25: PUT ${status} preserva alteracoes nao salvas`,async()=>{
        prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('editarSubprojeto(71)');falha={url:'/subprojetos/71',method:'PUT',status};await nav.evaluate("document.getElementById('sub-titulo').value='Rascunho';submitSubprojeto()");assert.equal(subprojetos.get(71).titulo,'Primeiro');assert.equal(await nav.evaluate("document.getElementById('sub-titulo').value"),'Rascunho');assert.equal(await nav.evaluate('subprojetoEditandoId'),71);
    });
    it('P25: validacao impede PUT e retorno conserva contexto',async()=>{prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('editarSubprojeto(71)');await nav.evaluate("document.getElementById('sub-titulo').value=' ';submitSubprojeto()");assert.equal(pedidos.some(p=>p.method==='PUT'),false);await nav.evaluate('voltarListaSubprojetos()');assert.equal(await nav.evaluate('contextoSubprojeto.projetoId'),51);assert.equal(await nav.evaluate('subprojetoEditandoId'),null);});
    for(const papelTeste of ['aluno','professor'])it(`P25: ${papelTeste} nao pode abrir edicao ou enviar PUT`,async()=>{
        prepararSubprojetos();await carregar(papelTeste);await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');assert.equal(await nav.evaluate("getComputedStyle(document.getElementById('btnEditarSubprojeto')).display"),'none');await nav.evaluate('editarSubprojeto(71)');assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'none');assert.equal(pedidos.some(p=>p.method==='PUT'),false);
    });
    it('P25: detalhe de pai alheio nao pode alimentar formulario',async()=>{prepararSubprojetos();subprojetos.get(71).projeto_id=52;await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('editarSubprojeto(71)');assert.equal(await nav.evaluate('subprojetoEditandoId'),null);assert.equal(await nav.evaluate("document.getElementById('formSubprojeto').style.display"),'none');});
    it('P26: exclui somente alvo apos confirmacao e preserva pai/irmao/documentos',async()=>{
        prepararSubprojetos();const pai={...projetos.get(51)},irmao={...subprojetos.get(72)};documentos=[{id:61,projeto_id:51}];await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');await nav.evaluate('excluirSubprojeto()');assert.equal(subprojetos.has(71),false);assert.deepEqual(subprojetos.get(72),irmao);assert.deepEqual(projetos.get(51),pai);assert.equal(documentos.length,1);assert.equal(await nav.evaluate('subprojetoDetalheAtualId'),null);assert.equal(await nav.evaluate('subprojetoEditandoId'),null);assert.ok(await nav.evaluate("document.getElementById('subprojetosListBody').textContent.includes('Irmao')"));assert.equal(await nav.evaluate("document.getElementById('subprojetosListBody').textContent.includes('Primeiro')"),false);
    });
    it('P26: cancelar nao envia DELETE nem altera contexto',async()=>{
        prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');await nav.evaluate('window.confirm=()=>false;excluirSubprojeto()');assert.equal(pedidos.some(p=>p.method==='DELETE'),false);assert.equal(subprojetos.size,2);assert.equal(await nav.evaluate('subprojetoDetalheAtualId'),71);
    });
    for(const status of [403,404,409,500])it(`P26: DELETE ${status} mantem item e apresenta mensagem segura`,async()=>{
        prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');falha={url:'/subprojetos/71',method:'DELETE',status};await nav.evaluate('excluirSubprojeto()');assert.equal(subprojetos.size,2);assert.equal(await nav.evaluate('subprojetoDetalheAtualId'),71);assert.equal(await nav.evaluate("document.getElementById('subprojetoTitulo').textContent"),'Primeiro');assert.ok(await nav.evaluate(`document.getElementById('subprojetoDetalheAviso').textContent.includes(${JSON.stringify(status===409?'dependentes protegidos':'mantido')})`));assert.equal(await nav.evaluate("document.getElementById('btnExcluirSubprojeto').disabled"),false);
    });
    for(const papelTeste of ['aluno','professor'])it(`P26: ${papelTeste} nao tem botao nem envia exclusao forjada`,async()=>{
        prepararSubprojetos();await carregar(papelTeste);await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');assert.equal(await nav.evaluate("getComputedStyle(document.getElementById('btnExcluirSubprojeto')).display"),'none');await nav.evaluate('excluirSubprojeto()');assert.equal(pedidos.some(p=>p.method==='DELETE'),false);assert.equal(subprojetos.size,2);
    });
    it('P26: duplo clique envia uma exclusao',async()=>{prepararSubprojetos();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('abrirDetalheSubprojeto(71)');await nav.evaluate('Promise.all([excluirSubprojeto(),excluirSubprojeto()])');assert.equal(pedidos.filter(p=>p.method==='DELETE').length,1);assert.equal(subprojetos.size,1);});

    it('P09: mostra snapshot administrativo e pendência sem inferir nome ou executar HTML',async()=>{documentos=[{id:61,projeto_id:51,descricao:'Documento admin',arquivo_nome:'a.pdf',autoria_confirmada:true,autor_conta_id:1,autor_nome:'Nome <img src=x>',autor_perfil:'administrador'},{id:64,projeto_id:51,descricao:'Documento legado',arquivo_nome:'b.pdf',autoria_confirmada:false,autor_conta_id:null,autor_nome:null,autor_perfil:null,enviado_por:42,enviado_por_perfil:'aluno'}];await carregar('professor');await nav.evaluate('abrirDetalheProjeto(51)');const t=await nav.evaluate("document.getElementById('detalheDocumentosBody').textContent");assert.ok(t.includes('Administrador: Nome <img src=x>'));assert.ok(t.includes('Autoria pendente de identificação'));assert.equal(await nav.evaluate("document.querySelector('#detalheDocumentosBody img')"),null);});

    it('P37: texto explicativo é exibido como texto sem substituir descrição',async()=>{documentos=[{id:61,projeto_id:51,descricao:'Descrição independente',arquivo_nome:'a.pdf',autor_conta_id:42,autor_perfil:'aluno',autor_nome:'Aluno A',autoria_confirmada:true,texto_explicativo:'Explicação <img src=x onerror=alert(1)> ç'}];await carregar('aluno');await nav.evaluate('abrirDetalheProjeto(51)');const texto=await nav.evaluate("document.getElementById('detalheDocumentosBody').textContent");assert.ok(texto.includes('Descrição independente'));assert.ok(texto.includes('Explicação <img src=x onerror=alert(1)> ç'));assert.equal(await nav.evaluate("document.querySelector('#detalheDocumentosBody img')"),null);assert.ok(await nav.evaluate("document.getElementById('docUploadTexto').tagName==='TEXTAREA'"));});
});
