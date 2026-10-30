import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {mysqlDisponivel} from './helpers/mysql-temporario.js';
import {executarMigracoes,verificarEsquema} from '../banco/migrador.js';
import {versaoEsperada} from '../banco/migracoes.js';
import versao from '../banco/versoes/014-disponibilidade-quizzes.js';
import {quizDisponivel} from '../disponibilidade-quizzes.js';

export const quizFixture=()=>({titulo:'Quiz <img src=x> ç',descricao:'Introdução pública literal',perguntas:[{descricao:'Pergunta privada',alternativas:[{descricao:'Correta privada',correta:true},{descricao:'Errada',correta:false}]}]});

describe('Pré-P34: vínculo/publicação em HTTP/MySQL descartáveis reais',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let f,id;
    const escrever=(url,body,papel='administrador')=>f.request(url,papel,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const dados=(mudancas={})=>({projeto_id:51,subprojeto_id:null,estado:'publicado',publico:false,...mudancas});
    const configurar=(d=dados(),papel='administrador')=>escrever('/quizzes/'+id+'/disponibilidade',d,papel);
    const ler=()=>f.request('/quizzes/'+id+'/disponibilidade');
    before(async()=>{f=await fixtureProjetos();});
    beforeEach(async()=>{
        await f.banco.query('DROP TABLE IF EXISTS fixture_historico_quiz');await f.banco.query('DROP TRIGGER IF EXISTS fixture_disponibilidade_falha');
        for(const t of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin','quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query('DELETE FROM '+t);
        await f.preencher(2);await f.banco.query('DELETE FROM projeto_aluno WHERE projeto_id=52 AND aluno_id=42');
        const r=await f.request('/quizzes','administrador',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quizFixture())});assert.equal(r.status,201);id=r.data.id;
    });
    after(async()=>{if(f)await f.fechar();});
    it('novo/legado não recebe vínculo, publicação ou autorização pública automática',async()=>{assert.deepEqual((await ler()).data,{id,projeto_id:null,subprojeto_id:null,estado:'rascunho',publico:false});await assert.rejects(quizDisponivel(f.pool,id,{perfil:'aluno',conta_id:42,pessoa_id:42}),e=>e.status===404);});
    it('admin vincula, publica/arquiva e seleciona subprojeto do mesmo pai',async()=>{const [r]=await f.banco.query("INSERT INTO subprojeto (projeto_id,titulo) VALUES (51,'Sub')");assert.equal((await configurar(dados({subprojeto_id:r.insertId,publico:true}))).status,200);assert.deepEqual((await ler()).data,{id,...dados({subprojeto_id:r.insertId,publico:true})});assert.equal((await quizDisponivel(f.pool,id,{perfil:'aluno',conta_id:42,pessoa_id:42})).id,id);assert.equal((await configurar(dados({estado:'arquivado'}))).status,200);await assert.rejects(quizDisponivel(f.pool,id,{perfil:'aluno',conta_id:42,pessoa_id:42}),e=>e.status===404);});
    for(const papel of ['aluno','professor',''])it('guard '+(papel||'anônimo')+' precede validação/SQL',async()=>{f.chamadas.length=0;assert.equal((await configurar({estado:'inventado'},papel)).status,papel?403:401);assert.equal((await f.request('/quizzes/'+id+'/disponibilidade',papel)).status,papel?403:401);assert.equal(f.chamadas.length,0);});
    it('IDs inválidos, publicação sem projeto e campos forjados são recusados',async()=>{for(const d of [dados({projeto_id:0}),dados({projeto_id:null}),dados({subprojeto_id:'abc'}),dados({publico:'true'}),dados({estado:'aberto'}),{...dados(),aluno_id:42}])assert.equal((await configurar(d)).status,400);assert.equal((await configurar(dados({projeto_id:999}))).status,404);assert.equal((await f.request('/quizzes/abc/disponibilidade')).status,400);assert.equal((await f.request('/quizzes/999/disponibilidade')).status,404);assert.equal((await ler()).data.estado,'rascunho');});
    it('subprojeto alheio é recusado e FK composta impede corrupção/movimentação SQL',async()=>{const [r]=await f.banco.query("INSERT INTO subprojeto (projeto_id,titulo) VALUES (52,'Outro')");assert.equal((await configurar(dados({subprojeto_id:r.insertId}))).status,400);await assert.rejects(f.banco.query('UPDATE quiz SET projeto_id=51,subprojeto_id=? WHERE id=?',[r.insertId,id]));assert.equal((await configurar(dados({projeto_id:52,subprojeto_id:r.insertId}))).status,200);await assert.rejects(f.banco.query('UPDATE subprojeto SET projeto_id=51 WHERE id=?',[r.insertId]));await assert.rejects(quizDisponivel(f.pool,id,{perfil:'aluno',conta_id:42,pessoa_id:42}),e=>e.status===403);});
    it('histórico externo bloqueia também configuração sem apagar dados',async()=>{await f.banco.query('CREATE TABLE fixture_historico_quiz (id INT PRIMARY KEY,quiz_id INT NOT NULL,FOREIGN KEY (quiz_id) REFERENCES quiz(id)) ENGINE=InnoDB');await f.banco.query('INSERT INTO fixture_historico_quiz VALUES (1,?)',[id]);assert.equal((await configurar()).status,409);assert.equal((await ler()).data.estado,'rascunho');assert.equal((await f.banco.query('SELECT * FROM fixture_historico_quiz'))[0].length,1);});
    it('falha SQL reverte configuração e omite diagnóstico sensível',async()=>{await f.banco.query("CREATE TRIGGER fixture_disponibilidade_falha BEFORE UPDATE ON quiz FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const r=await configurar();assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.equal((await ler()).data.estado,'rascunho');});
    it('CHECK/FKs protegem dados e startup detecta FK removida',async()=>{await assert.rejects(f.banco.query("UPDATE quiz SET estado='outro' WHERE id=?",[id]));await assert.rejects(f.banco.query('UPDATE quiz SET introducao_publica=2 WHERE id=?',[id]));await f.banco.query('ALTER TABLE quiz DROP FOREIGN KEY labhist_fk_quiz_subprojeto');try{await assert.rejects(verificarEsquema(f.banco),/disponibilidade/);}finally{await f.banco.query(versao.passos.find(p=>p.nome==='labhist_fk_quiz_subprojeto').sql);}});
    it('migra013→014 sem atribuir vínculo/público; execução repetida é idempotente',async()=>{for(const nome of ['labhist_fk_quiz_subprojeto','labhist_fk_quiz_projeto'])await f.banco.query('ALTER TABLE quiz DROP FOREIGN KEY '+nome);await f.banco.query('ALTER TABLE quiz DROP CHECK labhist_quiz_disponivel');for(const c of ['subprojeto_id','projeto_id','estado','introducao_publica'])await f.banco.query('ALTER TABLE quiz DROP COLUMN '+c);await f.banco.query('DELETE FROM schema_migrations WHERE versao>=14');await executarMigracoes(f.banco);assert.deepEqual((await ler()).data,{id,projeto_id:null,subprojeto_id:null,estado:'rascunho',publico:false});assert.equal((await f.request('/quizzes/'+id)).data.titulo,quizFixture().titulo);assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});});
    it('FK composta bloqueia subprojeto com quiz e permite excluir irmão sem dependentes',async()=>{
        const [a]=await f.banco.query("INSERT INTO subprojeto (projeto_id,titulo) VALUES (51,'Com quiz')"),[b]=await f.banco.query("INSERT INTO subprojeto (projeto_id,titulo) VALUES (51,'Sem quiz')");
        assert.equal((await configurar(dados({subprojeto_id:a.insertId}))).status,200);
        assert.equal((await f.request('/subprojetos/'+a.insertId,'administrador',{method:'DELETE'})).status,409);
        assert.equal((await f.request('/subprojetos/'+b.insertId,'administrador',{method:'DELETE'})).status,200);
        assert.equal((await ler()).data.subprojeto_id,a.insertId);assert.equal((await f.banco.query('SELECT id FROM subprojeto WHERE id=?',[a.insertId]))[0].length,1);
    });

});
