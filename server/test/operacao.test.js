import proxyAddr from 'proxy-addr';
import assert from 'node:assert/strict';
import {test,describe,before,after} from 'node:test';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {configurarOperacao,StoreMysql} from '../operacao.js';
import {carregarAplicacaoIsolada,criarBancoSimulado,senhaFixture} from './helpers/aplicacao.js';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {mysqlDisponivel} from './helpers/mysql-temporario.js';
const base={NODE_ENV:'production',APP_ORIGIN:'https://labhist.test',TRUST_PROXY:'127.0.0.1/32'};
test('P03: produção exige HTTPS, proxy explícito e store persistente',()=>{
    const c=configurarOperacao(base);assert.equal(c.ttlMs,28800000);assert.equal(c.cookie.secure,true);assert.equal(c.store,'mysql');
    for(const e of [{...base,APP_ORIGIN:''},{...base,APP_ORIGIN:'http://labhist.test'},{...base,TRUST_PROXY:'true'},{...base,TRUST_PROXY:''},{...base,SESSION_STORE:'memory'},{...base,CORS_ORIGINS:'null'},{...base,API_PUBLIC_ORIGIN:'https://user:secret@test.invalid'}])assert.throws(()=>configurarOperacao(e));
    assert.equal(configurarOperacao({SESSION_STORE:'memory'}).cookie.secure,false);
});
describe('P03: HTTP/CORS com doubles SQL',()=>{
    let a,s,origem;before(async()=>{a=await carregarAplicacaoIsolada({operacaoEnv:{API_PUBLIC_ORIGIN:'',CORS_ORIGINS:'https://permitida.test'}});a.configurarBancoDeTeste(criarBancoSimulado());s=a.app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));origem='http://127.0.0.1:'+s.address().port;});after(async()=>{s.closeAllConnections();await new Promise(r=>s.close(r));});
    test('mesma origem e allowlist recebem CORS sem refletir terceiros',async()=>{for(const o of [origem,'https://permitida.test']){const r=await fetch(origem+'/sessao',{headers:{Origin:o}});assert.equal(r.headers.get('access-control-allow-origin'),o);assert.equal(r.headers.get('access-control-allow-credentials'),'true');}const r=await fetch(origem+'/login',{method:'POST',headers:{Origin:'https://externa.test','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);});
    test('preflight externo negado e permitido explícito',async()=>{for(const [o,status] of [['https://externa.test',403],['https://permitida.test',204]])assert.equal((await fetch(origem+'/projetos',{method:'OPTIONS',headers:{Origin:o,'Access-Control-Request-Method':'POST'}})).status,status);});
    test('configuração pública não contém segredo e padrão usa origem atual',async()=>{const r=await fetch(origem+'/configuracao-publica.js'),b=await r.text();assert.match(b,/LABHIST_API_ORIGIN=""/);assert.equal(b.includes('segredo'),false);assert.equal(r.headers.get('cache-control'),'no-store');});
});
describe('P03: sessão HTTPS real local com certificado exclusivo de teste',()=>{
    let s,porta;before(async()=>{const a=await carregarAplicacaoIsolada({operacaoEnv:{...base,SESSION_STORE:'mysql',API_PUBLIC_ORIGIN:''}});a.configurarBancoDeTeste(criarBancoSimulado());
        // O store é controlado aqui; persistência MySQL é validada na suíte separada abaixo.
        const dados=new Map();a.storeSessoes.get=(sid,cb)=>cb(null,dados.get(sid));a.storeSessoes.set=(sid,v,cb)=>{dados.set(sid,v);cb();};a.storeSessoes.destroy=(sid,cb)=>{dados.delete(sid);cb();};a.storeSessoes.touch=(sid,v,cb)=>cb();
        s=https.createServer({key:readFileSync(new URL('./fixtures/https-local-key.pem',import.meta.url)),cert:readFileSync(new URL('./fixtures/https-local-cert.pem',import.meta.url))},a.app);s.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));porta=s.address().port;});after(async()=>{s.closeAllConnections();await new Promise(r=>s.close(r));});
    test('login HTTPS emite cookie Secure/HttpOnly/SameSite e expiração',async()=>{const r=await new Promise((resolve,reject)=>{const q=https.request({hostname:'127.0.0.1',port:porta,path:'/login',method:'POST',rejectUnauthorized:false,headers:{'Content-Type':'application/json',Origin:base.APP_ORIGIN}},res=>{res.resume();res.on('end',()=>resolve(res));});q.on('error',reject);q.end(JSON.stringify({usuario:'fixture-admin',senha:senhaFixture}));});assert.equal(r.statusCode,200);const c=r.headers['set-cookie'][0];assert.match(c,/Secure/);assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Lax/);assert.match(c,/Expires=/);});
});
describe('P03: sessão persistente HTTP/MySQL descartável real',{skip:!mysqlDisponivel},()=>{
    let f;before(async()=>{f=await fixtureProjetos({operacaoEnv:{SESSION_STORE:'mysql',API_PUBLIC_ORIGIN:''}});});after(async()=>{if(f)await f.fechar();});
    test('sessão funciona em outra instância e SID é hash no banco',async()=>{const a=await carregarAplicacaoIsolada({operacaoEnv:{SESSION_STORE:'mysql',API_PUBLIC_ORIGIN:''}});a.configurarBancoDeTeste(f.pool);const s=a.app.listen(0,'127.0.0.1');await new Promise(r=>s.once('listening',r));try{const r=await fetch('http://127.0.0.1:'+s.address().port+'/sessao',{headers:{Cookie:f.cookies.administrador}});assert.equal(r.status,200);const [rows]=await f.banco.query('SELECT sid,dados FROM sessoes');assert.ok(rows.length>=3);assert.ok(rows.every(r=>/^[a-f0-9]{64}$/.test(r.sid)));assert.equal(rows.some(r=>r.dados.includes('senha-apenas-da-fixture')),false);}finally{s.closeAllConnections();await new Promise(r=>s.close(r));}});
    test('cookie válido com sessão vencida no banco é recusado',async()=>{await f.banco.query('UPDATE sessoes SET expira_em=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE conta_id=42');assert.equal((await f.request('/sessao','aluno')).status,401);});
    test('logout elimina sessão persistida e impede reutilização',async()=>{assert.equal((await f.request('/logout','professor',{method:'POST'})).status,200);assert.equal((await f.request('/sessao','professor')).status,401);});
});

test('P03: proxy-addr corrigido não confia IPv4 externo por subrede IPv6 ampla',()=>{assert.equal(proxyAddr.compile(['::/1'])('203.0.113.20',0),false);});
