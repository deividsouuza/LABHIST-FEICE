import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador,chromePath} from './helpers/navegador.js';
import {senhaFixture} from './helpers/aplicacao.js';

describe('Mensagens privadas: Chrome, HTTP e MySQL reais e descartáveis',{concurrency:1},()=>{
    let f,prof,aluno,tempo=0;const erros=[];
    const post=(url,body,papel='professor')=>f.request('/mensagens'+url,papel,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const criar=async()=>{const r=await post('/conversas',{destinatario_id:42});assert.equal(r.status,200);return r.data.id;};
    const enviar=(id,conteudo='Mensagem real da fixture',papel='professor')=>post('/conversas/'+id+'/mensagens',{conteudo,cliente_id:randomUUID()},papel);
    before(async()=>{
        f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});assert.ok(chromePath);prof=await abrirNavegador();aluno=await abrirNavegador();
        for(const nav of [prof,aluno]){
            nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
            await nav.send('Network.enable');await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
            await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__avisos=[];window.alert=m=>__avisos.push(m);window.__pedidos=[];const originalFetch=window.fetch;window.fetch=(u,o)=>{__pedidos.push({url:String(u),method:o?.method||'GET'});return originalFetch(u,o);};`});
        }
    });
    beforeEach(async()=>{
        tempo+=900001;
        for(const nav of [prof,aluno])await nav.send('Page.navigate',{url:'about:blank'});
        await f.banco.query('DROP TRIGGER IF EXISTS fixture_mensagem_falha');await f.banco.query('DELETE FROM mensagem');await f.banco.query('DELETE FROM mensagem_conversa');await f.preencher(1);
    });
    after(async()=>{if(prof)await prof.close();if(aluno)await aluno.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});
    async function entrar(nav,papel){
        await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('typeof fazerLogin==="function"');
        await nav.evaluate(`document.getElementById('usuario-log').value='fixture-${papel==='administrador'?'admin':papel}';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('perfil-log').value=${JSON.stringify(papel==='administrador'?'':papel)};fazerLogin()`);
        await nav.waitFor('location.pathname.includes("menuCadastro")&&document.body.dataset.sessao==="confirmada"');
    }
    async function abrir(nav,papel,id){await entrar(nav,papel);await nav.evaluate('showMensagens()');await nav.evaluate(`abrirConversaMensagens(${id},{conta_id:${papel==='professor'?42:41},pessoa_id:${papel==='professor'?42:41},nome:'${papel==='professor'?'Aluno A':'Professor A'}',perfil:'${papel==='professor'?'aluno':'professor'}'})`);}
    const digitar=(nav,texto)=>nav.evaluate(`document.getElementById('mensagensTexto').value=${JSON.stringify(texto)};enviarMensagem()`);
    it('professor pesquisa aluno, inicia conversa e envia texto literal sem executar HTML',async()=>{
        await entrar(prof,'professor');assert.notEqual(await prof.evaluate('getComputedStyle(document.getElementById("navMensagens")).display'),'none');await prof.evaluate('showMensagens();');await prof.evaluate('trocarListaMensagens("contatos")');
        await prof.evaluate('document.getElementById("mensagensBusca").value="Aluno A";document.getElementById("mensagensBusca").dispatchEvent(new Event("input"))');await prof.waitFor('document.querySelectorAll("#mensagensLista button").length===1');
        await prof.evaluate('document.querySelector("#mensagensLista button").click()');await prof.waitFor('chatMensagens&&document.getElementById("mensagensTexto").disabled===false');
        const texto='<img src=x onerror=alert(1)> Olá! 😀';await digitar(prof,texto);
        assert.equal(await prof.evaluate('document.querySelector(".mensagem-propria p").textContent'),texto);assert.equal(await prof.evaluate('document.querySelector("#mensagensHistorico img")'),null);assert.deepEqual(await prof.evaluate('__avisos'),[]);
        assert.equal((await f.banco.query('SELECT conteudo FROM mensagem'))[0][0].conteudo,texto);
    });
    it('badge, recebimento automático, resposta do aluno e confirmação de leitura funcionam entre dois navegadores',async()=>{
        const id=await criar();await enviar(id,'Olá aluno');await entrar(aluno,'aluno');await aluno.waitFor('document.getElementById("mensagensContador").textContent==="1"');
        await aluno.evaluate('showMensagens()');await aluno.evaluate(`abrirConversaMensagens(${id},{conta_id:41,pessoa_id:41,nome:'Professor A',perfil:'professor'})`);
        assert.equal(await aluno.evaluate('document.querySelector("#mensagensHistorico .mensagem-propria")'),null);
        await abrir(prof,'professor',id);assert.equal(await prof.evaluate('document.querySelector(".mensagem-situacao").textContent'),'Lida');
        await digitar(aluno,'Recebi e vou responder.');
        await new Promise(r=>setTimeout(r,5300));await prof.waitFor('document.getElementById("mensagensHistorico").textContent.includes("Recebi e vou responder.")');
        await new Promise(r=>setTimeout(r,5300));await aluno.waitFor('[...document.querySelectorAll(".mensagem-propria .mensagem-situacao")].some(e=>e.textContent==="Lida")');
        assert.equal((await f.request('/mensagens/resumo','aluno')).data.nao_lidas,0);assert.equal((await f.request('/mensagens/resumo','professor')).data.nao_lidas,0);
    });
    it('histórico completo é carregado em páginas e preservado após novo login',async()=>{
        const id=await criar(),rows=Array.from({length:65},(_,n)=>[id,41,42,randomUUID(),'Histórico '+n]);await f.banco.query('INSERT INTO mensagem (conversa_id,remetente_id,destinatario_id,cliente_id,conteudo,enviada_em) VALUES '+rows.map(()=>'(?,?,?,?,?,UTC_TIMESTAMP(3))').join(','),rows.flat());
        await abrir(aluno,'aluno',id);assert.equal(await aluno.evaluate('document.querySelectorAll(".mensagem-balao").length'),50);assert.equal(await aluno.evaluate('document.getElementById("mensagensAnteriores").hidden'),false);
        await aluno.evaluate('carregarAnterioresMensagens()');assert.equal(await aluno.evaluate('document.querySelectorAll(".mensagem-balao").length'),65);assert.equal(await aluno.evaluate('document.getElementById("mensagensAnteriores").hidden'),true);
        await aluno.evaluate('logout()');await aluno.waitFor('location.pathname.includes("login.html")');await abrir(aluno,'aluno',id);assert.ok(await aluno.evaluate('document.getElementById("mensagensHistorico").textContent.includes("Histórico 64")'));
    });
    it('resposta perdida após commit preserva texto e nova tentativa não duplica mensagem',async()=>{
        const id=await criar();await abrir(prof,'professor',id);
        await prof.evaluate(`window.__fetchAntes=fetch;window.__perder=true;fetch=async(u,o)=>{const r=await __fetchAntes(u,o);if(__perder&&String(u).endsWith('/conversas/${id}/mensagens')&&o?.method==='POST'){__perder=false;throw new TypeError('Perda simulada depois da resposta');}return r;};`);
        await digitar(prof,'Preservar tentativa');assert.equal(await prof.evaluate('document.getElementById("mensagensTexto").value'),'Preservar tentativa');assert.equal((await f.banco.query('SELECT COUNT(*) n FROM mensagem'))[0][0].n,1);
        await prof.evaluate('enviarMensagem()');assert.equal((await f.banco.query('SELECT COUNT(*) n FROM mensagem'))[0][0].n,1);assert.equal(await prof.evaluate('document.getElementById("mensagensTexto").value'),'');
    });
    it('valida vazio/excesso no navegador e mantém texto após erro do servidor',async()=>{
        const id=await criar();await abrir(prof,'professor',id);await digitar(prof,'   ');await digitar(prof,'x'.repeat(4001));assert.equal((await f.banco.query('SELECT COUNT(*) n FROM mensagem'))[0][0].n,0);
        await f.banco.query("CREATE TRIGGER fixture_mensagem_falha BEFORE INSERT ON mensagem FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");await digitar(prof,'Manter rascunho');assert.equal(await prof.evaluate('document.getElementById("mensagensTexto").value'),'Manter rascunho');assert.equal(await prof.evaluate('document.getElementById("mensagensEnviar").disabled'),false);
    });
    it('revogação limpa a conversa aberta e bloqueia o formulário na próxima atualização automática',async()=>{
        const id=await criar();await enviar(id,'Conteúdo privado');await abrir(aluno,'aluno',id);assert.ok(await aluno.evaluate('document.getElementById("mensagensHistorico").textContent.includes("Conteúdo privado")'));
        await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');await new Promise(r=>setTimeout(r,5300));await aluno.waitFor('chatMensagens===null');assert.equal(await aluno.evaluate('document.getElementById("mensagensHistorico").children.length'),0);assert.equal(await aluno.evaluate('document.getElementById("mensagensTexto").disabled'),true);
    });
    it('aba oculta pausa consultas e não marca leitura; ao voltar recebe as novas mensagens',async()=>{
        const id=await criar();await abrir(aluno,'aluno',id);
        await aluno.evaluate('window.__oculta=true;Object.defineProperty(document,"hidden",{configurable:true,get:()=>__oculta});document.dispatchEvent(new Event("visibilitychange"));window.__quantidade=__pedidos.filter(p=>p.url.includes("/mensagens/")).length');
        await enviar(id,'Enquanto estava ausente');await new Promise(r=>setTimeout(r,5300));
        assert.equal(await aluno.evaluate('__pedidos.filter(p=>p.url.includes("/mensagens/")).length===__quantidade'),true);assert.equal((await f.request('/mensagens/resumo','aluno')).data.nao_lidas,1);
        await aluno.evaluate('__oculta=false;document.dispatchEvent(new Event("visibilitychange"))');await aluno.waitFor('document.getElementById("mensagensHistorico").textContent.includes("Enquanto estava ausente")');
    });
    it('sair da tela cancela atualizações; resposta atrasada não restaura dados após encerrar sessão',async()=>{
        const id=await criar();await enviar(id,'Não restaurar');await entrar(aluno,'aluno');await aluno.evaluate('showMensagens()');
        await aluno.evaluate(`window.__apiOriginal=apiFetch;apiFetch=async(...args)=>{const r=await __apiOriginal(...args);if(args[0].endsWith('/conversas/${id}/mensagens'))await new Promise(resolve=>window.__liberar=resolve);return r;};void abrirConversaMensagens(${id},{conta_id:41,pessoa_id:41,nome:'Professor A',perfil:'professor'});`);
        await aluno.waitFor('typeof __liberar==="function"');await aluno.evaluate('limparEstadoSessao();__liberar();apiFetch=__apiOriginal');assert.equal(await aluno.evaluate('document.getElementById("mensagensHistorico").children.length'),0);assert.equal(await aluno.evaluate('mensagensRascunhos.size'),0);assert.equal(await aluno.evaluate('mensagensAberta'),false);
    });
    it('layout em desktop/tablet/celular mantém chat e formulário sem rolagem horizontal',async()=>{
        const id=await criar();await enviar(id,'Uma mensagem longa '+('história'.repeat(300)));await abrir(aluno,'aluno',id);
        for(const [width,height] of [[1280,900],[768,1024],[390,844],[360,800],[800,360]]){
            await aluno.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});assert.equal(await aluno.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.ok(await aluno.evaluate('document.getElementById("mensagensTexto").getBoundingClientRect().width>100'));
        }
        await aluno.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await aluno.waitFor('document.getElementById("sidebar").getBoundingClientRect().right<=1');const captura=await aluno.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(tmpdir(),'labhist-mensagens-mobile.png'),Buffer.from(captura.data,'base64'));
        await aluno.evaluate('voltarConversasMensagens()');assert.equal(await aluno.evaluate('getComputedStyle(document.querySelector(".mensagens-chat")).display'),'none');assert.notEqual(await aluno.evaluate('getComputedStyle(document.querySelector(".mensagens-lateral")).display'),'none');
        await aluno.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    });
    it('administrador não tem menu de mensagens nem consegue abrir o chat',async()=>{
        await entrar(prof,'administrador');assert.equal(await prof.evaluate('getComputedStyle(document.getElementById("navMensagens")).display'),'none');await prof.evaluate('showMensagens()');assert.equal(await prof.evaluate('document.getElementById("painelMensagens").style.display'),'none');
    });
    it('restauração de página retoma a conversa após confirmar a sessão',async()=>{
        const id=await criar();await abrir(aluno,'aluno',id);await aluno.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))');assert.equal(await aluno.evaluate('mensagensAberta'),false);
        await enviar(id,'Após voltar à página');await aluno.evaluate('window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))');await aluno.waitFor('mensagensAberta&&document.getElementById("mensagensHistorico").textContent.includes("Após voltar à página")');
    });
});
