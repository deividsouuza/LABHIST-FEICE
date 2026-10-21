import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import { fixtureProjetos } from './helpers/fixture-projetos.js';
import { mysqlDisponivel } from './helpers/mysql-temporario.js';
import { executarMigracoes,verificarEsquema } from '../banco/migrador.js';

const pergunta=descricao=>({descricao,alternativas:[{descricao:'Correta ç',correta:true},{descricao:'Incorreta',correta:false}]});
const novo=()=>({titulo:'Memórias do bairro',descricao:'Descrição\nLinha2',perguntas:[pergunta('Quando?'),pergunta('Onde?')]});
describe('P27/P29: quizzes privados em HTTP/MySQL descartaveis reais',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let f;const escrever=(method,body,url='/quizzes',papel='administrador')=>f.request(url,papel,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    before(async()=>{f=await fixtureProjetos();});
    beforeEach(async()=>{await f.banco.query('DROP TABLE IF EXISTS fixture_resposta_quiz');await f.banco.query('DROP TRIGGER IF EXISTS fixture_quiz_falha');for(const t of ['quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query(`DELETE FROM ${t}`);await f.preencher(1);});
    after(async()=>{if(f)await f.fechar();});
    async function ler(id){const r=await f.request('/quizzes/'+id);assert.equal(r.status,200);return r.data;}
    it('P27: estrutura com perguntas/alternativas persiste em ordem e nomes Unicode',async()=>{
        const payload=novo(),r=await escrever('POST',payload);assert.equal(r.status,201);const q=await ler(r.data.id);assert.equal(q.titulo,payload.titulo);assert.equal(q.descricao,payload.descricao);assert.deepEqual(q.perguntas.map(p=>p.descricao),['Quando?','Onde?']);for(const p of q.perguntas){assert.ok(p.id>0);assert.deepEqual(p.alternativas.map(a=>a.correta),[true,false]);assert.equal(p.alternativas[0].descricao,'Correta ç');}
        const lista=await f.request('/quizzes');assert.equal(lista.data.length,1);assert.equal('perguntas' in lista.data[0],false);assert.equal((await f.request('/projetos')).data.length,1);
    });
    const invalidos=[
        ['titulo vazio',b=>{b.titulo=' ';}],['titulo longo',b=>{b.titulo='a'.repeat(256);}],['titulo tipo',b=>{b.titulo=3;}],['descricao tipo',b=>{b.descricao={};}],
        ['sem perguntas',b=>{b.perguntas=[];}],['pergunta vazia',b=>{b.perguntas[0].descricao=' ';}],['alternativa vazia',b=>{b.perguntas[0].alternativas[0].descricao='';}],
        ['uma alternativa',b=>{b.perguntas[0].alternativas.pop();}],['zero corretas',b=>{b.perguntas[0].alternativas[0].correta=false;}],['duas corretas',b=>{b.perguntas[0].alternativas[1].correta=true;}],
        ['boolean string',b=>{b.perguntas[0].alternativas[0].correta='true';}],['ID forjado na criacao',b=>{b.perguntas[0].id=71;}],['vinculo nao aprovado',b=>{b.projeto_id=51;}],['publicacao nao aprovada',b=>{b.status='aberto';}],['pontuacao nao aprovada',b=>{b.perguntas[0].pontos=10;}],
        ['muitas perguntas',b=>{b.perguntas=Array.from({length:51},()=>pergunta('Q'));}],['muitas alternativas',b=>{b.perguntas[0].alternativas=Array.from({length:21},(_,i)=>({descricao:'A',correta:i===0}));}],['TEXT excedido',b=>{b.perguntas[0].descricao='ç'.repeat(32768);}]
    ];
    for(const [nome,mudar] of invalidos)it(`P27: ${nome} recusa sem persistencia parcial`,async()=>{const b=novo();mudar(b);assert.equal((await escrever('POST',b)).status,400);for(const t of ['quiz','quiz_pergunta','quiz_alternativa'])assert.equal((await f.banco.query(`SELECT * FROM ${t}`))[0].length,0);});
    for(const papel of ['aluno','professor',''])it(`P27: ${papel||'anonimo'} nao consulta gabarito nem cria`,async()=>{
        const c=await escrever('POST',novo());f.chamadas.length=0;
        for(const url of ['/quizzes','/quizzes/'+c.data.id])assert.equal((await f.request(url,papel)).status,papel?403:401);
        assert.equal((await escrever('POST',novo(),'/quizzes',papel)).status,papel?403:401);assert.equal(f.chamadas.length,0);
    });
    it('P27: ID invalido e ausente retornam400/404',async()=>{assert.equal((await f.request('/quizzes/abc')).status,400);assert.equal((await f.request('/quizzes/999')).status,404);});
    it('P27: falha SQL em alternativa reverte quiz/perguntas e nao vaza SQL',async()=>{
        await f.banco.query("CREATE TRIGGER fixture_quiz_falha BEFORE INSERT ON quiz_alternativa FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const r=await escrever('POST',novo());assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);for(const t of ['quiz','quiz_pergunta','quiz_alternativa'])assert.equal((await f.banco.query(`SELECT * FROM ${t}`))[0].length,0);
    });
    it('P27: FKs e CHECK impedem orfao/correta invalida por SQL',async()=>{
        await assert.rejects(f.banco.query("INSERT INTO quiz_pergunta (quiz_id,descricao,ordem) VALUES (999,'Orfa',0)"));const c=await escrever('POST',novo()),q=await ler(c.data.id);await assert.rejects(f.banco.query('UPDATE quiz_alternativa SET correta=2 WHERE id=?',[q.perguntas[0].alternativas[0].id]));
    });
    it('P27: migra008→009 sem alterar projetos e repete sem DDL',async()=>{
        for(const t of ['quiz_resposta','quiz_resultado','quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query(`DROP TABLE ${t}`);await f.banco.query('DELETE FROM schema_migrations WHERE versao>=9');const [antes]=await f.banco.query('SELECT * FROM projeto');assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-9+1},(_,i)=>i+9)});assert.deepEqual((await f.banco.query('SELECT * FROM projeto'))[0],antes);assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});
    });
    it('P27: partida rejeita FK removida apesar do historico completo',async()=>{
        await f.banco.query('ALTER TABLE quiz_pergunta DROP FOREIGN KEY labhist_fk_pergunta_quiz');try{await assert.rejects(verificarEsquema(f.banco),/FK de quiz/);}finally{await f.banco.query('ALTER TABLE quiz_pergunta ADD CONSTRAINT labhist_fk_pergunta_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE RESTRICT');}
    });
    const editar=q=>escrever('PUT',q,'/quizzes/'+q.id);
    async function criar(){const c=await escrever('POST',novo());assert.equal(c.status,201);return ler(c.data.id);}
    it('P29: edita textos/corretas e reordena mantendo identidades e outros quizzes',async()=>{
        const q=await criar(),outro=await criar(),antes=structuredClone(q);q.titulo='Editado';q.descricao='Outra descrição';q.perguntas.reverse();q.perguntas[0].descricao='Nova pergunta';q.perguntas[0].alternativas.reverse();q.perguntas[0].alternativas[0].correta=true;q.perguntas[0].alternativas[1].correta=false;q.perguntas[0].alternativas[0].descricao='Nova alternativa';assert.equal((await editar(q)).status,200);assert.deepEqual(await ler(q.id),q);assert.deepEqual(await ler(outro.id),outro);assert.deepEqual(q.perguntas.map(p=>p.id).sort(),antes.perguntas.map(p=>p.id).sort());assert.equal((await editar(q)).status,200);
    });
    it('P29: adiciona/remove estrutura sem mudar IDs retidos ou criar orfaos',async()=>{
        const q=await criar(),removida=q.perguntas[1].id,retida=q.perguntas[0].id,altRemovida=q.perguntas[0].alternativas[1].id;
        q.perguntas.pop();q.perguntas[0].alternativas.pop();q.perguntas[0].alternativas.push({descricao:'Nova incorreta',correta:false});q.perguntas.push(pergunta('Pergunta nova'));
        assert.equal((await editar(q)).status,200);const depois=await ler(q.id);assert.equal(depois.perguntas[0].id,retida);assert.notEqual(depois.perguntas[1].id,removida);assert.equal(depois.perguntas[0].alternativas[0].id,q.perguntas[0].alternativas[0].id);assert.notEqual(depois.perguntas[0].alternativas[1].id,altRemovida);assert.equal((await f.banco.query('SELECT * FROM quiz_pergunta WHERE id=?',[removida]))[0].length,0);assert.equal((await f.banco.query('SELECT * FROM quiz_alternativa WHERE pergunta_id=?',[removida]))[0].length,0);
    });
    it('P29: validacao recusa IDs repetidos e estrutura invalida sem alterar original',async()=>{
        const original=await criar();
        for(const mudar of [q=>{q.perguntas[1].id=q.perguntas[0].id;},q=>{q.perguntas[1].alternativas[0].id=q.perguntas[0].alternativas[0].id;},q=>{q.perguntas[0].alternativas[1].correta=true;},q=>{q.id=999;}]){
            const q=structuredClone(original);mudar(q);assert.equal((await escrever('PUT',q,'/quizzes/'+original.id)).status,400);assert.deepEqual(await ler(original.id),original);
        }
    });
    it('P29: IDs alheios nao transferem perguntas/alternativas',async()=>{
        const original=await criar(),outro=await criar();
        for(const mudar of [q=>{q.perguntas[0].id=outro.perguntas[0].id;},q=>{q.perguntas[0].alternativas[0].id=outro.perguntas[0].alternativas[0].id;},q=>{q.perguntas[0].alternativas[0].id=q.perguntas[1].alternativas[0].id;},q=>{delete q.perguntas[0].id;}]){
            const q=structuredClone(original);mudar(q);assert.equal((await editar(q)).status,400);assert.deepEqual(await ler(original.id),original);assert.deepEqual(await ler(outro.id),outro);
        }
    });
    for(const papel of ['aluno','professor',''])it(`P29: ${papel||'anonimo'} nao escreve mesmo forjando perfil`,async()=>{
        const q=await criar();assert.equal((await escrever('PUT',{...q,perfil:'administrador'},'/quizzes/'+q.id,papel)).status,papel?403:401);assert.deepEqual(await ler(q.id),q);
    });
    it('P29: ausencia/ID invalido recusados',async()=>{assert.equal((await escrever('PUT',novo(),'/quizzes/999')).status,404);assert.equal((await escrever('PUT',novo(),'/quizzes/abc')).status,400);});
    for(const [tabela,obterId] of [['quiz',q=>q.id],['quiz_pergunta',q=>q.perguntas[0].id],['quiz_alternativa',q=>q.perguntas[0].alternativas[0].id]])it(`P29: historico ligado a ${tabela} bloqueia toda edicao, inclusive titulo`,async()=>{
        const antes=await criar();await f.banco.query(`CREATE TABLE fixture_resposta_quiz (id INT PRIMARY KEY,referencia INT NOT NULL,FOREIGN KEY (referencia) REFERENCES ${tabela}(id) ON DELETE RESTRICT) ENGINE=InnoDB`);await f.banco.query('INSERT INTO fixture_resposta_quiz VALUES (1,?)',[obterId(antes)]);
        const q=structuredClone(antes);q.titulo='Nao alterar';assert.equal((await editar(q)).status,409);assert.deepEqual(await ler(q.id),antes);assert.deepEqual((await f.banco.query('SELECT * FROM fixture_resposta_quiz'))[0],[{id:1,referencia:obterId(antes)}]);
    });
    it('P29: FK CASCADE de resposta nao permite edicao que removeria a pergunta',async()=>{
        const antes=await criar();await f.banco.query('CREATE TABLE fixture_resposta_quiz (id INT PRIMARY KEY,referencia INT NOT NULL,FOREIGN KEY (referencia) REFERENCES quiz_alternativa(id) ON DELETE CASCADE) ENGINE=InnoDB');await f.banco.query('INSERT INTO fixture_resposta_quiz VALUES (1,?)',[antes.perguntas[1].alternativas[0].id]);const q=structuredClone(antes);q.perguntas.pop();assert.equal((await editar(q)).status,409);assert.deepEqual(await ler(q.id),antes);assert.equal((await f.banco.query('SELECT * FROM fixture_resposta_quiz'))[0].length,1);
    });
    it('P29: historico de outro quiz nao bloqueia registro sem respostas',async()=>{
        const q=await criar(),outro=await criar();await f.banco.query('CREATE TABLE fixture_resposta_quiz (id INT PRIMARY KEY,referencia INT NOT NULL,FOREIGN KEY (referencia) REFERENCES quiz_alternativa(id)) ENGINE=InnoDB');await f.banco.query('INSERT INTO fixture_resposta_quiz VALUES (1,?)',[outro.perguntas[0].alternativas[0].id]);q.titulo='Pode alterar';assert.equal((await editar(q)).status,200);assert.deepEqual(await ler(q.id),q);assert.deepEqual(await ler(outro.id),outro);assert.equal((await f.banco.query('SELECT * FROM fixture_resposta_quiz'))[0].length,1);
    });
    it('P29: falha em atualizacao de alternativa reverte titulo/textos e ordem',async()=>{
        const antes=await criar();await f.banco.query("CREATE TRIGGER fixture_quiz_falha BEFORE UPDATE ON quiz_alternativa FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const q=structuredClone(antes);q.titulo='Reverter';q.perguntas.reverse();q.perguntas[0].descricao='Reverter também';const r=await editar(q);assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.deepEqual(await ler(q.id),antes);
    });

    it('P31: exclui apenas o quiz escolhido e todo núcleo interno',async()=>{
        const q=await criar(),outro=await criar();assert.equal((await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'})).status,200);assert.equal((await f.request('/quizzes/'+q.id)).status,404);assert.deepEqual(await ler(outro.id),outro);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz_pergunta WHERE quiz_id=?',[q.id]))[0][0].n,0);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM quiz_alternativa WHERE pergunta_id IN (?)',[q.perguntas.map(p=>p.id)]))[0][0].n,0);
    });
    for(const papel of ['aluno','professor',''])it('P31: '+(papel||'anônimo')+' não exclui',async()=>{const q=await criar();assert.equal((await f.request('/quizzes/'+q.id,papel,{method:'DELETE'})).status,papel?403:401);assert.deepEqual(await ler(q.id),q);});
    it('P31: ID inválido/ausente e exclusão repetida retornam erro',async()=>{assert.equal((await f.request('/quizzes/abc','administrador',{method:'DELETE'})).status,400);assert.equal((await f.request('/quizzes/999','administrador',{method:'DELETE'})).status,404);const q=await criar();assert.equal((await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'})).status,200);assert.equal((await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'})).status,404);});
    for(const tabela of ['quiz','quiz_pergunta','quiz_alternativa'])for(const regra of ['RESTRICT','CASCADE'])it('P31: histórico em '+tabela+' com FK '+regra+' preserva todo conjunto',async()=>{
        const q=await criar(),id=tabela==='quiz'?q.id:tabela==='quiz_pergunta'?q.perguntas[0].id:q.perguntas[0].alternativas[0].id;
        await f.banco.query('CREATE TABLE fixture_resposta_quiz (id INT PRIMARY KEY,referencia INT NOT NULL,FOREIGN KEY (referencia) REFERENCES '+tabela+'(id) ON DELETE '+regra+') ENGINE=InnoDB');await f.banco.query('INSERT INTO fixture_resposta_quiz VALUES (1,?)',[id]);
        const r=await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'});assert.equal(r.status,409);assert.deepEqual(await ler(q.id),q);assert.deepEqual((await f.banco.query('SELECT * FROM fixture_resposta_quiz'))[0],[{id:1,referencia:id}]);
    });
    it('P31: histórico de outro quiz não bloqueia exclusão elegível',async()=>{
        const q=await criar(),outro=await criar();await f.banco.query('CREATE TABLE fixture_resposta_quiz (id INT PRIMARY KEY,referencia INT NOT NULL,FOREIGN KEY (referencia) REFERENCES quiz(id)) ENGINE=InnoDB');await f.banco.query('INSERT INTO fixture_resposta_quiz VALUES (1,?)',[outro.id]);assert.equal((await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'})).status,200);assert.deepEqual(await ler(outro.id),outro);assert.equal((await f.banco.query('SELECT * FROM fixture_resposta_quiz'))[0].length,1);
    });
    it('P31: falha após remover alternativas reverte tudo sem vazar SQL',async()=>{
        const q=await criar();await f.banco.query("CREATE TRIGGER fixture_quiz_falha BEFORE DELETE ON quiz_pergunta FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const r=await f.request('/quizzes/'+q.id,'administrador',{method:'DELETE'});assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.deepEqual(await ler(q.id),q);
    });
});
