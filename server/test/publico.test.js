import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {mysqlDisponivel} from './helpers/mysql-temporario.js';
describe('P33: contrato público HTTP/MySQL descartável',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let f;before(async()=>{f=await fixtureProjetos();});beforeEach(async()=>{f.falhar(null);await f.preencher(2);});after(async()=>{if(f)await f.fechar();});
    const chaves=['descricao','id','objetivo','status','titulo'];
    it('visitante sem cookie lista/detalha apenas campos públicos',async()=>{const r=await f.request('/publico/projetos','');assert.equal(r.status,200);assert.equal(r.data.length,2);for(const p of r.data)assert.deepEqual(Object.keys(p).sort(),chaves);assert.equal(JSON.stringify(r.data).includes('privado@test.invalid'),false);const d=await f.request('/publico/projetos/51','');assert.equal(d.status,200);assert.deepEqual(Object.keys(d.data).sort(),chaves);assert.equal(d.data.status,null);});
    it('status público acompanha alteração administrativa sem vazar membros',async()=>{await f.banco.query("UPDATE projeto SET status='finalizado' WHERE id=51");const r=await f.request('/publico/projetos/51','');assert.equal(r.data.status,'finalizado');assert.equal('professor_id' in r.data,false);assert.equal('alunos' in r.data,false);assert.equal('documentos' in r.data,false);});
    it('lista vazia e registro ausente retornam contratos corretos',async()=>{await f.preencher(0);assert.deepEqual((await f.request('/publico/projetos','')).data,[]);assert.equal((await f.request('/publico/projetos/51','')).status,404);});
    it('ID inválido/injeção é recusado antes do SQL',async()=>{f.chamadas.length=0;for(const id of ['abc','0','-1','1%20OR%201=1'])assert.equal((await f.request('/publico/projetos/'+id,'')).status,400);assert.equal(f.chamadas.length,0);});
    it('erro de SQL público é sanitizado',async()=>{f.falhar(/FROM projeto/);const r=await f.request('/publico/projetos','');assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);});
    it('visitante não consulta contratos privados nem escreve ou envia arquivos/respostas',async()=>{for(const [url,method] of [['/projetos','GET'],['/usuarios','GET'],['/quizzes','GET'],['/projetos','POST'],['/projetos/51','PUT'],['/projetos/51','DELETE'],['/projetos/51/documentos','POST'],['/documentos/1/download','GET'],['/quizzes/1','PUT'],['/quizzes/1','DELETE']])assert.equal((await f.request(url,'',{method})).status,401);assert.equal((await f.request('/quizzes/1/respostas','',{method:'POST'})).status,404);});
    it('perfil autenticado recebe o mesmo contrato público mínimo',async()=>{const anon=(await f.request('/publico/projetos','')).data;for(const perfil of ['aluno','professor','administrador'])assert.deepEqual((await f.request('/publico/projetos',perfil)).data,anon);});
});
