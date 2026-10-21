import assert from 'node:assert/strict';
import {before,after,describe,it} from 'node:test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador} from './helpers/navegador.js';
import {senhaFixture} from './helpers/aplicacao.js';
import {pdf} from './helpers/fixtures-documentos.js';

const browsers=[['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']];
const matriz=[[1280,900,false],[1920,1080,false],[360,800,true],[390,844,true],[768,1024,true]];
const p95=xs=>[...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*.95)-1];
describe('P44: matriz local D12 aprovada, HTTP/MySQL/arquivos reais e toque emulado',{concurrency:1},()=>{
    let f,raiz,tempo=0;const medidas=[];
    before(async()=>{
        for(const [,exe] of browsers)assert.ok(existsSync(exe),'Navegador da matriz ausente');
        raiz=await mkdtemp(path.join(tmpdir(),'labhist-p44-'));f=await fixtureProjetos({diretorioUploads:raiz,operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});await f.preencher(100);
        await f.banco.query('INSERT INTO aluno (id,nome) VALUES ?',[Array.from({length:98},(_,i)=>[1000+i,'Aluno de homologação '+i])]);
        for(let i=0;i<20;i++)await f.banco.query("INSERT INTO quiz (titulo,descricao,projeto_id,estado) VALUES (?, ?,51,'rascunho')",['Quiz '+i,'Introdução']);
        await f.banco.query('UPDATE projeto SET titulo=?,descricao=? WHERE id=51',['X'.repeat(255),'<img src=x> '+'x'.repeat(4000)]);
    });
    after(async()=>{
        if(f)await f.fechar();
        if(raiz){assert.equal(path.dirname(path.resolve(raiz)),path.resolve(tmpdir()));assert.ok(path.basename(raiz).startsWith('labhist-p44-'));await rm(raiz,{recursive:true,force:true,maxRetries:4,retryDelay:200});}
        console.log('P44 EVIDÊNCIA '+JSON.stringify(medidas));
        if(medidas.length)await writeFile(path.join(tmpdir(),'labhist-p44-evidencias.json'),JSON.stringify(medidas,null,2));
    });
    it('P95 API com100 projetos/100 alunos/20 quizzes fica até1s,20 amostras por rota',async()=>{
        for(const [t,n] of [['projeto',100],['aluno',100],['quiz',20]])assert.equal((await f.banco.query('SELECT COUNT(*) n FROM '+t))[0][0].n,n);
        for(const url of ['/projetos','/usuarios?perfil=aluno','/quizzes']){
            const amostras=[];for(let i=0;i<20;i++){const inicio=performance.now(),r=await f.request(url);assert.equal(r.status,200);amostras.push(performance.now()-inicio);}
            medidas.push({tipo:'API',url,n:20,p95_ms:p95(amostras),max_ms:Math.max(...amostras)});assert.ok(p95(amostras)<=1000,JSON.stringify(medidas.at(-1)));
        }
    });
    for(const [browser,executavel] of browsers)describe(browser,{concurrency:1},()=>{
        let nav,modoRede=false;const erros=[];
        before(async()=>{
            nav=await abrirNavegador(executavel);medidas.push({browser,versao:await nav.send('Browser.getVersion')});
            nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));
            await nav.send('Fetch.enable',{patterns:[{urlPattern:'https://fonts.googleapis.com/*'},{urlPattern:f.origem+'/usuarios*'}]});
            nav.on('Fetch.requestPaused',async e=>{try{if(e.request.url.startsWith('https://fonts.googleapis.com'))await nav.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,body:''});else if(modoRede)await nav.send('Fetch.failRequest',{requestId:e.requestId,errorReason:'ConnectionRefused'});else await nav.send('Fetch.continueRequest',{requestId:e.requestId});}catch(e){erros.push(e.message);}});
            await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__avisos=[];window.alert=m=>__avisos.push(m);window.confirm=()=>true;'});
        });
        after(async()=>{if(nav)await nav.close();assert.deepEqual(erros,[]);});
        async function login(perfil){
            tempo+=900001;await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('document.readyState==="complete" && typeof fazerLogin==="function"');
            await nav.evaluate(`document.getElementById('perfil-log').value=${JSON.stringify(perfil)};document.getElementById('usuario-log').value='fixture-'+${JSON.stringify(perfil==='administrador'?'admin':perfil)};document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('btn-entrar').focus()`);
            await nav.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await nav.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
            await nav.waitFor('location.pathname==="/mainPage/menuCadastro.html" && document.body.dataset.sessao==="confirmada"');
        }
        async function acao(nome,codigo,limite=2000){const t=performance.now();await nav.evaluate('(async()=>{await '+codigo+';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()');const ms=performance.now()-t;medidas.push({browser,tipo:'tela',nome,ms});assert.ok(ms<=limite,nome+': '+ms+'ms');}
        async function cabe(){assert.ok(await nav.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Overflow horizontal');const cortados=await nav.evaluate(`Array.from(document.querySelectorAll('.form-panel button,.form-panel input,.form-panel textarea,.form-panel select')).filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5||r.width<1}).map(e=>e.id||e.textContent)`);assert.deepEqual(cortados,[]);}
        async function toque(seletor){const ponto=await nav.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(seletor)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await nav.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[ponto]});await nav.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
        for(const [width,height,mobile] of matriz)it(`${width}×${height}: login, pessoa/projeto, upload1MiB, teclado/toque/orientação`,async()=>{
            await nav.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await nav.send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
            await login('administrador');
            if(mobile){await toque('#hamburger');await nav.waitFor('document.getElementById("sidebarOverlay").classList.contains("active")');await nav.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await nav.waitFor('!document.getElementById("sidebarOverlay").classList.contains("active")');await toque('#hamburger');await nav.waitFor('document.getElementById("sidebarOverlay").classList.contains("active")');await nav.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width-10,y:height*.7}]});await nav.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await nav.waitFor('!document.getElementById("sidebarOverlay").classList.contains("active")');}
            await acao('listar100 alunos',"showForm('aluno')");assert.equal(await nav.evaluate('dadosCarregados.aluno.length'),100);await cabe();
            await acao('editar pessoa',"editUser(41,'professor')");await cabe();await nav.evaluate("document.getElementById('prof-nome').value='Professor A';document.getElementById('btnSubmitProf').focus()");await acao('salvar pessoa','submitProfessor()');
            await acao('listar100 projetos',"showForm('projeto')");assert.equal(await nav.evaluate('dadosCarregados.projeto.length'),100);await cabe();
            await acao('editar projeto','editProjeto(51)');await cabe();await nav.evaluate("document.getElementById('proj-descricao').focus()");
            assert.ok(await nav.evaluate("document.activeElement.id==='proj-descricao'"));
            if(mobile){await nav.send('Emulation.setDeviceMetricsOverride',{width,height:Math.max(300,Math.floor(height*.55)),deviceScaleFactor:1,mobile:true});await cabe();await nav.send('Input.insertText',{text:' Teclado emulado'});await nav.send('Emulation.setDeviceMetricsOverride',{width:height,height:width,deviceScaleFactor:1,mobile:true});await cabe();await nav.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});}
            await acao('salvar projeto','submitProjeto()');
            await login('aluno');await acao('abrir projeto/documentos','abrirDetalheProjeto(51)');await cabe();assert.equal(await nav.evaluate('document.querySelector("#detalheProjetoInfo img")'),null);
            const tamanho=1024*1024;await nav.evaluate(`{document.getElementById('docUploadDescricao').value='Homologação '+${JSON.stringify(browser+' '+width)};const bytes=new Uint8Array(${tamanho}).fill(32);bytes.set(new TextEncoder().encode(${JSON.stringify(pdf.toString())}));bytes.set([37,37,69,79,70],bytes.length-5);const dt=new DataTransfer();dt.items.add(new File([bytes],'homologacao.pdf',{type:'application/pdf'}));document.getElementById('docUploadArquivo').files=dt.files;document.getElementById('docUploadArquivo').dispatchEvent(new Event('change'));}`);
            assert.equal(await nav.evaluate('document.getElementById("docUploadArquivo").files[0].size'),tamanho);await acao('upload1MiB','enviarDocumento()',5000);assert.equal(await nav.evaluate('document.getElementById("docUploadDescricao").value'),'');assert.ok((await f.banco.query('SELECT COUNT(*) n FROM documentos'))[0][0].n>0);await cabe();
            await nav.send('Emulation.clearDeviceMetricsOverride');
        });
        it('rótulos, foco, ação de exclusão visível ao teclado e erro de rede recuperável',async()=>{
            // O caso anterior é móvel: restaurar também o tipo de entrada para
            // provar o foco de desktop sem depender da regra CSS de toque.
            await nav.send('Emulation.setTouchEmulationEnabled',{enabled:false});
            await nav.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
            await login('administrador');await nav.evaluate("showForm('professor')");modoRede=true;await nav.evaluate("showForm('professor')");assert.ok(await nav.evaluate('window.__avisos.length>0'));modoRede=false;await nav.evaluate("showForm('professor')");
            await nav.evaluate("document.querySelector('#profListBody .list-item-delete').focus()");await nav.waitFor("getComputedStyle(document.activeElement).opacity==='1'");assert.equal(await nav.evaluate("getComputedStyle(document.activeElement).opacity"),'1','Exclusão invisível com foco');
            const indefinidos=await nav.evaluate(`Array.from(document.querySelectorAll('*')).flatMap(e=>Array.from(e.attributes).filter(a=>/^on[a-z]+$/.test(a.name)).flatMap(a=>Array.from(a.value.matchAll(/(?<![\\w$.])([a-zA-Z_$][\\w$]*)\\s*\\(/g),m=>m[1]))).filter(n=>typeof window[n]!=='function')`);assert.deepEqual(indefinidos,[],'Handler inline indefinido');
            await nav.evaluate("document.getElementById('childAluno').focus()");await nav.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await nav.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await nav.waitFor('document.getElementById("listAluno").style.display==="block"');
            await nav.evaluate("editProjeto(51)");const semRotulo=await nav.evaluate(`Array.from(document.querySelectorAll('#formProjeto input,#formProjeto select,#formProjeto textarea')).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).map(e=>e.id)`);assert.deepEqual(semRotulo,[]);
            const foco=await nav.evaluate("(()=>{const e=document.getElementById('proj-descricao');e.focus();const s=getComputedStyle(e);return {outline:s.outlineStyle,shadow:s.boxShadow}})()");assert.ok(foco.outline!=='none'||foco.shadow!=='none');
        });
    });
});
