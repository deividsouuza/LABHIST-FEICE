import assert from 'node:assert/strict';
import {test} from 'node:test';
import {corrigirQuiz} from '../correcao-quizzes.js';
const perguntas=[1,2,3].map(id=>({id,alternativas:[{id:id*10,correta:true},{id:id*10+1,correta:false}]}));
const respostas=(acertos=3)=>perguntas.map((p,i)=>({pergunta_id:p.id,alternativa_id:p.id*10+(i<acertos?0:1)}));
test('D08: total, zero e parcial seguem pontuação/percentual aprovados',()=>{for(const n of [0,1,2,3]){const r=corrigirQuiz(perguntas,respostas(n));assert.equal(r.pontuacao,n);assert.equal(r.total_perguntas,3);assert.equal(r.percentual,n/3*100);assert.equal('correta' in r,false);}});
test('D08: normaliza ordem sem modificar perguntas/respostas de entrada',()=>{const b=respostas().reverse(),antes=structuredClone({perguntas,b});assert.deepEqual(corrigirQuiz(perguntas,b).respostas,respostas());assert.deepEqual({perguntas,b},antes);});
for(const [nome,r] of [['faltante',respostas().slice(1)],['duplicada',[respostas()[0],respostas()[0],respostas()[2]]],['pergunta alheia',[{pergunta_id:999,alternativa_id:10},...respostas().slice(1)]],['alternativa de outra pergunta',[{pergunta_id:1,alternativa_id:20},...respostas().slice(1)]],['nota forjada',[{...respostas()[0],nota:100},...respostas().slice(1)]],['ID inválido',[{pergunta_id:1,alternativa_id:0},...respostas().slice(1)]]])test('D08: recusa '+nome,()=>assert.throws(()=>corrigirQuiz(perguntas,r),e=>e.status===400));
test('D08: gabarito inconsistente não produz nota ou resultado parcial',()=>{for(const mudar of [p=>{p[0].alternativas[1].correta=true;},p=>{p[0].alternativas[0].correta=false;},p=>{p[0].alternativas[0].correta=1;},p=>{p[1].id=1;}]){const p=structuredClone(perguntas);mudar(p);assert.throws(()=>corrigirQuiz(p,respostas()),e=>e.status===500);}});
