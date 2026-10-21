import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import { fixtureProjetos } from './helpers/fixture-projetos.js';
import { mysqlDisponivel } from './helpers/mysql-temporario.js';
import { payloadProjeto } from './helpers/aplicacao.js';
import { executarMigracoes,verificarEsquema } from '../banco/migrador.js';

describe('P18: status em HTTP/MySQL descartaveis reais',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let f;const escrever=(method,url,body,papel='administrador')=>f.request(url,papel,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    before(async()=>{f=await fixtureProjetos();});beforeEach(async()=>{await f.preencher(2);});after(async()=>{if(f)await f.fechar();});
    for(const status of ['em andamento','finalizado','cancelado'])it(`cria, edita e lista status ${status} com demais campos preservados`,async()=>{
        const c=await escrever('POST','/projetos',{...payloadProjeto,status});assert.equal(c.status,200);let r=await f.request('/projetos/'+c.data.id);assert.equal(r.data.status,status);assert.equal(r.data.descricao,payloadProjeto.descricao);
        assert.equal((await escrever('PUT','/projetos/51',{...payloadProjeto,status})).status,200);r=await f.request('/projetos/51');assert.equal(r.data.status,status);assert.deepEqual(r.data.aluno_ids,[42]);assert.deepEqual(r.data.professor_ids,[41]);assert.equal((await f.request('/projetos')).data.find(p=>p.id===51).status,status);
    });
    for(const status of [null,undefined,'','aberto','Em andamento',3,{},[]])it(`novo projeto recusa status ${JSON.stringify(status)}`,async()=>{const r=await escrever('POST','/projetos',{...payloadProjeto,status});assert.equal(r.status,400);assert.equal((await f.banco.query('SELECT * FROM projeto'))[0].length,2);});
    it('PUT recusa arbitrario e nao apaga status definido',async()=>{
        assert.equal((await escrever('PUT','/projetos/51',{...payloadProjeto,status:'cancelado'})).status,200);
        for(const status of ['aberto',{},null])assert.equal((await escrever('PUT','/projetos/51',{...payloadProjeto,status})).status,400);
        const semStatus={...payloadProjeto};delete semStatus.status;assert.equal((await escrever('PUT','/projetos/51',semStatus)).status,200);assert.equal((await f.request('/projetos/51')).data.status,'cancelado');
    });
    it('legado NULL permanece incerto na leitura/edicao ate classificacao explicita',async()=>{
        assert.equal((await f.request('/projetos/51')).data.status,null);assert.equal((await escrever('PUT','/projetos/51',{...payloadProjeto,status:null})).status,200);assert.equal((await f.request('/projetos/51')).data.status,null);
        assert.equal((await escrever('PUT','/projetos/51',{...payloadProjeto,status:'finalizado'})).status,200);assert.equal((await f.request('/projetos/52')).data.status,null);
    });
    for(const papel of ['aluno','professor',''])it(`status nao pode ser escrito por ${papel||'anonimo'}`,async()=>{for(const method of ['POST','PUT'])assert.equal((await escrever(method,method==='POST'?'/projetos':'/projetos/51',{...payloadProjeto,status:'finalizado',perfil:'administrador'},papel)).status,papel?403:401);assert.equal((await f.request('/projetos/51')).data.status,null);});
    it('migra007→008 preservando integralmente o historico e status NULL',async()=>{
        await f.banco.query('ALTER TABLE projeto DROP CHECK labhist_status_projeto');await f.banco.query('ALTER TABLE projeto DROP COLUMN status');await f.banco.query('DELETE FROM schema_migrations WHERE versao>=8');const [antes]=await f.banco.query('SELECT * FROM projeto ORDER BY id');assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-8+1},(_,i)=>i+8)});const [depois]=await f.banco.query('SELECT * FROM projeto ORDER BY id');assert.deepEqual(depois,antes.map(p=>({...p,status:null})));assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});
    });
    it('CHECK recusa estado arbitrario por SQL e partida detecta regra ausente',async()=>{
        await assert.rejects(f.banco.query("UPDATE projeto SET status='arbitrario' WHERE id=51"));await f.banco.query('ALTER TABLE projeto DROP CHECK labhist_status_projeto');try{await assert.rejects(verificarEsquema(f.banco),/Regra de status/);}finally{await f.banco.query("ALTER TABLE projeto ADD CONSTRAINT labhist_status_projeto CHECK (status IN ('finalizado','em andamento','cancelado'))");}
    });
});
