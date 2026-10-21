import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import { carregarAplicacaoIsolada, criarBancoSimulado, contas, senhaFixture } from './helpers/aplicacao.js';
import { abrirNavegador, chromePath } from './helpers/navegador.js';

async function fixture() {
    const app=await carregarAplicacaoIsolada();const banco=criarBancoSimulado();let pessoaRemovida=false,contaRemovida=false;
    const query=banco.query.bind(banco);banco.query=async(sql,p)=>{
        if(pessoaRemovida && sql.includes('FROM conta_pessoa'))return [[]];
        if(contaRemovida && sql==='SELECT id, usuario, perfil FROM usuarios WHERE id=?')return [[]];
        return query(sql,p);
    };
    app.configurarBancoDeTeste(banco);const servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));const origem=`http://127.0.0.1:${servidor.address().port}`;
    return {app,banco,origem,removerPessoa(v=true){pessoaRemovida=v},removerConta(v=true){contaRemovida=v},async fechar(){servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}};
}

describe('P13: consulta de sessao e perfil escolhido, HTTP real / DB simulado', {concurrency:1},()=>{
    let f;const cookies={};
    const request=(method,url,body,cookie)=>fetch(f.origem+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
    before(async()=>{f=await fixture();});after(async()=>{if(f)await f.fechar();});
    beforeEach(()=>{f.removerPessoa(false);f.removerConta(false);});
    for(const conta of contas.slice(0,3)) {
        it(`${conta.perfil} obtem sua identidade minima e no-store`,async()=>{
            const login=await request('POST','/login',{usuario:conta.usuario,senha:senhaFixture,perfil:conta.perfil});assert.equal(login.status,200);
            cookies[conta.perfil]=login.headers.getSetCookie()[0].split(';')[0];
            const res=await request('GET','/sessao?perfil=administrador&pessoa_id=999',null,cookies[conta.perfil]);assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'no-store');
            const data=await res.json();assert.equal(data.perfil,conta.perfil);assert.equal(data.conta_id,conta.id);assert.equal(data.pessoa_id,conta.perfil==='administrador'?null:conta.id);assert.deepEqual(Object.keys(data).sort(),['conta_id','nome','perfil','pessoa_id']);
        });
        it(`selecao visual incompativel nao autentica ${conta.perfil}`,async()=>{
            const res=await request('POST','/login',{usuario:conta.usuario,senha:senhaFixture,perfil:conta.perfil==='aluno'?'professor':'aluno'});assert.equal(res.status,401);assert.equal(res.headers.getSetCookie().length,0);
        });
    }
    it('ausencia de sessao retorna 401',async()=>assert.equal((await request('GET','/sessao')).status,401));
    it('pessoa removida invalida a sessao e limpa cookie',async()=>{
        f.removerPessoa();const res=await request('GET','/sessao',null,cookies.aluno);assert.equal(res.status,401);assert.ok(res.headers.get('set-cookie').includes('Expires='));
        assert.equal((await request('GET','/sessao',null,cookies.aluno)).status,401);
    });
    it('conta administrativa removida tambem invalida sessao',async()=>{f.removerConta();assert.equal((await request('GET','/sessao',null,cookies.administrador)).status,401);});
    it('logout encerra a consulta de sessao',async()=>{assert.equal((await request('POST','/logout',{},cookies.professor)).status,200);assert.equal((await request('GET','/sessao',null,cookies.professor)).status,401);});
});

describe('P13: Chrome, paginas/HTTP/cookies reais, DB simulado', {skip:!chromePath,concurrency:1},()=>{
    let f,nav;const erros=[];
    async function pagina(url){await nav.send('Page.navigate',{url:f.origem+url});await nav.waitFor('document.readyState === "complete"');}
    async function entrar(conta){
        await pagina('/login/login.html');await nav.waitFor('typeof fazerLogin === "function"');
        await nav.evaluate(`document.getElementById('usuario-log').value=${JSON.stringify(conta.usuario)};document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('perfil-log').value=${JSON.stringify(conta.perfil==='administrador'?'':conta.perfil)};document.getElementById('btn-entrar').click();true`);
        await nav.waitFor('location.pathname.includes("menuCadastro") && document.body.dataset.sessao === "confirmada"');
    }
    before(async()=>{
        f=await fixture();nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',d=>erros.push(d.exceptionDetails.text));
        await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__alerts=[];window.alert=m=>__alerts.push(m);const originalFetch=window.fetch;window.fetch=(url,options)=>originalFetch(String(url).replace('http://localhost:3000',location.origin),options);`});
        await nav.send('Network.enable');
        await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
    });
    beforeEach(()=>{f.removerPessoa(false);f.removerConta(false);});
    after(async()=>{if(nav)await nav.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});
    for(const conta of contas.slice(0,3)) {
        it(`${conta.perfil} entra, recarrega e ignora storage forjado`,async()=>{
            await entrar(conta);assert.equal(await nav.evaluate('perfilAtual()'),conta.perfil);
            await nav.evaluate("localStorage.setItem('perfil','administrador');localStorage.setItem('alunoAtualId','999');localStorage.setItem('professorAtualId','999')");
            await pagina('/mainPage/menuCadastro.html');await nav.waitFor('document.body.dataset.sessao === "confirmada"');
            assert.equal(await nav.evaluate('perfilAtual()'),conta.perfil);assert.equal(await nav.evaluate('getPessoaAtualId()'),conta.perfil==='administrador'?'':conta.id);
            assert.equal(await nav.evaluate('document.getElementById("navParent").style.display'),conta.perfil==='administrador'?'':'none');
            assert.equal(await nav.evaluate('document.getElementById("pessoaAtualSelect")'),null);
        });
        it(`${conta.perfil} sai e nao retorna com cookie antigo`,async()=>{
            await entrar(conta);await nav.evaluate('logout();true');await nav.waitFor('location.pathname === "/login/login.html"');
            await pagina('/mainPage/menuCadastro.html');await nav.waitFor('location.pathname === "/login/login.html"');
        });
    }
    it('perfil visual errado preserva login e mostra erro',async()=>{
        await pagina('/login/login.html');await nav.waitFor('typeof fazerLogin === "function"');await nav.evaluate(`document.getElementById('usuario-log').value='fixture-aluno';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('perfil-log').value='administrador';fazerLogin()`);
        assert.equal(await nav.evaluate('location.pathname'),'/login/login.html');assert.ok(await nav.evaluate('__alerts.length>0'));
    });
    it('login mostra somente aluno/professor e administrador entra sem selecionar perfil',async()=>{
        await pagina('/login/login.html');await nav.waitFor('typeof fazerLogin === "function"');
        assert.deepEqual(await nav.evaluate('Array.from(document.getElementById("perfil-log").options,o=>o.value)'),['','professor','aluno']);
        await entrar(contas[0]);assert.equal(await nav.evaluate('perfilAtual()'),'administrador');
    });
    it('acesso administrativo sem seleção recusa senha errada e conta de aluno',async()=>{
        await pagina('/login/login.html');await nav.waitFor('typeof fazerLogin === "function"');
        await nav.evaluate('fetch("/logout",{method:"POST"})');
        for(const [usuario,senha] of [[contas[0].usuario,'incorreta'],[contas[2].usuario,senhaFixture]]){
            await nav.evaluate(`document.getElementById('perfil-log').value='';document.getElementById('usuario-log').value=${JSON.stringify(usuario)};document.getElementById('senha-log').value=${JSON.stringify(senha)};window.__alerts=[];fazerLogin()`);
            assert.equal(await nav.evaluate('location.pathname'),'/login/login.html');assert.ok(await nav.evaluate('__alerts.length>0'));
            assert.equal(await nav.evaluate('fetch("/sessao").then(r=>r.status)'),401);
        }
    });
    it('pessoa removida impede acesso no reload',async()=>{await entrar(contas[2]);f.removerPessoa();await pagina('/mainPage/menuCadastro.html');await nav.waitFor('location.pathname === "/login/login.html"');});
    it('menu movel abre e fecha com sessao administrativa confirmada',async()=>{
        await entrar(contas[0]);await nav.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
        await nav.evaluate('toggleSidebar()');assert.ok(await nav.evaluate('document.getElementById("sidebar").classList.contains("open")'));await nav.evaluate('closeSidebar()');assert.equal(await nav.evaluate('document.getElementById("sidebar").classList.contains("open")'),false);
    });
});
