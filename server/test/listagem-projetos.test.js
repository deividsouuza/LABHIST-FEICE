import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import { mysqlDisponivel } from './helpers/mysql-temporario.js';
import { fixtureProjetos } from './helpers/fixture-projetos.js';

describe('P42: listagem agrupada em HTTP/MySQL descartaveis reais',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let f;
    before(async()=>{f=await fixtureProjetos();});
    beforeEach(()=>{f.falhar(null);f.chamadas.length=0;});
    after(async()=>{if(f)await f.fechar();});
    for(const n of [0,1,12,40])it(`quantidade de consultas constante para ${n} projetos`,async()=>{
        const medida=await f.medir(n);assert.equal(medida.consultas,n?3:1);console.log('P42 depois:',JSON.stringify(medida));
    });
    it('descricao e objetivo nao recebem resumo, leitura nao grava e detalhe e compativel',async()=>{
        await f.preencher(3);const [antes]=await f.banco.query('SELECT * FROM projeto ORDER BY id');const r=await f.request('/projetos');
        for(const p of r.data){assert.equal(p.descricao,'Descrição original | ç');assert.equal(p.objetivo,'Objetivo');assert.equal(p.professores_texto,'Professor A');assert.equal(p.alunos_texto,'Aluno A, Aluno B');const detalhe=await f.request('/projetos/'+p.id);assert.deepEqual(detalhe.data,p);}
        assert.deepEqual((await f.banco.query('SELECT * FROM projeto ORDER BY id'))[0],antes);
    });
    it('legados sem membros usam fallback administrativo agrupado e preservam vazio',async()=>{
        await f.preencher(3);await f.banco.query('DELETE FROM projeto_professor');await f.banco.query('DELETE FROM projeto_aluno');await f.banco.query('UPDATE projeto SET professor_id=NULL,descricao=NULL WHERE id=53');f.chamadas.length=0;
        const r=await f.request('/projetos');assert.equal(r.status,200);assert.equal(f.chamadas.length,4);const porId=new Map(r.data.map(p=>[p.id,p]));assert.deepEqual(porId.get(51).professor_ids,[41]);assert.deepEqual(porId.get(52).aluno_ids,[]);assert.deepEqual(porId.get(53).professor_ids,[]);assert.equal(porId.get(53).descricao,'');
        assert.deepEqual((await f.request('/projetos', 'professor')).data,[]);
    });
    for(const papel of ['aluno','professor'])it(`${papel}: filtra antes do agrupamento e nao expoe colegas/contatos indevidos`,async()=>{
        await f.preencher(3);await f.banco.query('DELETE FROM projeto_aluno WHERE projeto_id=52 AND aluno_id=42');await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=52');
        const r=await f.request('/projetos?perfil=administrador&pessoa_id=44',papel);assert.equal(r.status,200);assert.deepEqual(r.data.map(p=>p.id).sort(),[51,53]);assert.equal(JSON.stringify(r.data).includes('privado'),false);
        for(const p of r.data){assert.ok(p.professores.every(a=>Object.keys(a).sort().join(',')==='id,nome'));assert.ok(p.alunos.every(a=>Object.keys(a).sort().join(',')==='id,nome'));if(papel==='aluno')assert.deepEqual(p.aluno_ids,[42]);}
        const grupos=f.chamadas.filter(c=>c.sql.includes('projeto_id IN (?)'));assert.equal(grupos.length,2);for(const c of grupos)assert.deepEqual([...c.args[0]].sort(),[51,53]);
    });
    it('anonimo recusado antes de SQL',async()=>{f.chamadas.length=0;assert.equal((await f.request('/projetos','')).status,401);assert.equal(f.chamadas.length,0);});
    it('falha em consulta de membros nao devolve lista parcial nem SQL',async()=>{
        await f.preencher(2);f.falhar(/FROM projeto_aluno pa/);const r=await f.request('/projetos');assert.equal(r.status,500);assert.equal(Array.isArray(r.data),false);assert.equal(JSON.stringify(r.data).includes('segredo'),false);
    });
});
