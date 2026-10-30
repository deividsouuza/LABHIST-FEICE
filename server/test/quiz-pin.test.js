import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {gerarPinQuiz} from '../quiz-pin.js';
import {executarTransacao} from '../banco/transacao.js';
import {executarMigracoes,verificarEsquema} from '../banco/migrador.js';
import {contas,senhaFixture} from './helpers/aplicacao.js';

describe('PIN: acesso explícito e respostas de alunos/visitantes em MySQL/HTTP reais',{concurrency:1},()=>{
    let f,tempo=0;
    const conteudo=()=>({titulo:'Quiz por convite <img src=x>',descricao:'História',projeto_id:51,subprojeto_id:null,perguntas:[{descricao:'Pergunta 1',alternativas:[{descricao:'A',correta:true},{descricao:'B',correta:false}]},{descricao:'Pergunta 2',alternativas:[{descricao:'C',correta:false},{descricao:'D',correta:true}]}]});
    const post=(url,body,papel='')=>f.request(url,papel,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const criar=async()=>{const r=await post('/professor/quizzes',conteudo(),'professor');assert.equal(r.status,201,JSON.stringify(r.data));return r.data;};
    const entrar=(pin,papel='')=>post('/quizzes/pin/entrar',{pin,modo:papel==='aluno'?'aluno':'visitante'},papel);
    const abrir=async(c,papel='')=>{const r=await entrar(c.pin.codigo,papel);assert.equal(r.status,200,JSON.stringify(r.data));return r.data;};
    const respostas=(q,acertos=true)=>q.perguntas.map((p,n)=>({pergunta_id:p.id,alternativa_id:p.alternativas[acertos?n:1-n].id}));
    const enviar=(a,r,papel='')=>post('/quizzes/pin/respostas',{acesso:a.acesso,respostas:r??respostas(a.atividade)},papel);
    const ler=(a,papel='')=>post('/quizzes/pin/atividade',{acesso:a.acesso},papel);
    const contar=async t=>(await f.banco.query('SELECT COUNT(*) n FROM '+t))[0][0].n;
    before(async()=>{f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});await f.banco.query("INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (91,'fixture-pin-outro',?,'professor')",[contas[1].senha]);await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (91,'professor',43)");const r=await fetch(f.origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-pin-outro',senha:senhaFixture})});f.cookies.outro=r.headers.getSetCookie()[0].split(';')[0];});
    beforeEach(async()=>{tempo+=900001;await f.banco.query('DROP TRIGGER IF EXISTS fixture_pin_falha');for(const t of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin','quiz_resposta','quiz_resultado','quiz_alternativa','quiz_pergunta','quiz'])await f.banco.query('DELETE FROM '+t);await f.preencher(2);});
    after(async()=>{if(f)await f.fechar();});
    it('migra18→19 sem gerar convites para legados, preservando quiz e histórico anterior',async()=>{
        const c=await criar();for(const t of ['quiz_resposta_visitante','quiz_resultado_visitante','quiz_pin'])await f.banco.query('DROP TABLE '+t);await f.banco.query('DELETE FROM schema_migrations WHERE versao=19');
        const [antes]=await f.banco.query('SELECT * FROM schema_migrations ORDER BY versao');assert.deepEqual(await executarMigracoes(f.banco),{versao:19,aplicadas:[19]});assert.deepEqual((await f.banco.query('SELECT * FROM schema_migrations WHERE versao<=18 ORDER BY versao'))[0],antes);assert.equal(await contar('quiz_pin'),0);assert.equal((await f.request('/professor/quizzes/'+c.id,'professor')).data.titulo,conteudo().titulo);assert.deepEqual(await executarMigracoes(f.banco),{versao:19,aplicadas:[]});
    });
    it('professor recebe PIN automático de8 dígitos e apenas ele/administrador podem consultá-lo',async()=>{
        const c=await criar();assert.match(c.pin.codigo,/^\d{8}$/);assert.equal(c.pin.ativo,true);assert.deepEqual((await f.request('/quizzes/'+c.id+'/pin','professor')).data.pin,c.pin);assert.deepEqual((await f.request('/professor/quizzes/'+c.id,'professor')).data.pin,c.pin);
        for(const [p,status] of [['aluno',403],['outro',404],['',401]])assert.equal((await f.request('/quizzes/'+c.id+'/pin',p)).status,status);
    });
    it('visitante responde rascunho somente pelo PIN, sem login/conta/gabarito',async()=>{
        const c=await criar(),a=await abrir(c);assert.equal(a.atividade.resultado,null);assert.equal(JSON.stringify(a.atividade).includes('correta'),false);assert.equal((await f.request('/publico/quizzes/'+c.id,'')).status,404);
        const r=await enviar(a);assert.equal(r.status,201);assert.equal(r.data.resultado.pontuacao,2);assert.equal(r.data.resultado.percentual,100);assert.equal(await contar('quiz_resultado_visitante'),1);assert.equal(await contar('quiz_resultado'),0);assert.equal(await contar('usuarios'),4);
        assert.equal((await ler(a)).data.resultado.id,r.data.resultado.id);assert.equal(JSON.stringify(r.data).includes('alternativa_id'),false);
    });
    it('notas são corrigidas no servidor, inclusive zero; visitantes distintos têm resultados isolados',async()=>{
        const c=await criar(),a=await abrir(c),b=await abrir(c);assert.notEqual(a.acesso,b.acesso);assert.equal((await enviar(a,respostas(a.atividade,false))).data.resultado.pontuacao,0);assert.equal((await ler(b)).data.resultado,null);assert.equal((await enviar(b)).data.resultado.pontuacao,2);assert.equal(await contar('quiz_resultado_visitante'),2);
    });
    it('aluno com PIN pode responder sem vínculo ao projeto e resultado pertence à sua conta',async()=>{
        const c=await criar();await f.banco.query('DELETE FROM projeto_aluno WHERE aluno_id=42');assert.equal((await f.request('/aluno/quizzes/'+c.id+'/atividade','aluno')).status,404);
        const a=await abrir(c,'aluno'),r=await enviar(a,undefined,'aluno');assert.equal(r.status,201);const [[q]]=await f.banco.query('SELECT aluno_id,conta_id FROM quiz_resultado');assert.deepEqual(q,{aluno_id:42,conta_id:42});assert.ok((await f.request('/aluno/resultados','aluno')).data.some(x=>x.id===r.data.resultado.id));assert.equal((await f.banco.query('SELECT COUNT(*) n FROM projeto_aluno WHERE aluno_id=42'))[0][0].n,0);
    });
    it('uma tentativa do aluno vale também no catálogo; PIN novo não permite sobrescrever',async()=>{
        const c=await criar(),a=await abrir(c,'aluno'),r=await enviar(a,undefined,'aluno');assert.equal(r.status,201);assert.equal((await enviar(a,respostas(a.atividade,false),'aluno')).status,409);
        const b=await abrir(c,'aluno');assert.equal(b.atividade.resultado.id,r.data.resultado.id);assert.equal((await enviar(b,undefined,'aluno')).status,200);assert.equal(await contar('quiz_resultado'),1);
    });
    it('reenvio idêntico, inclusive concorrente, não duplica participação de visitante',async()=>{
        const a=await abrir(await criar());const rs=await Promise.all([enviar(a),enviar(a)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,201]);assert.equal(rs[0].data.resultado.id,rs[1].data.resultado.id);assert.equal(await contar('quiz_resultado_visitante'),1);assert.equal((await enviar(a,respostas(a.atividade,false))).status,409);
    });
    it('recusa respostas faltantes/duplicadas, alternativas alheias, nota ou perfil forjado',async()=>{
        const a=await abrir(await criar()),r=respostas(a.atividade);for(const body of [{acesso:a.acesso,respostas:r,pontuacao:999},{acesso:a.acesso,respostas:r,perfil:'aluno'},{acesso:a.acesso,respostas:r.slice(1)},{acesso:a.acesso,respostas:[r[0],r[0]]},{acesso:a.acesso,respostas:[{...r[0],alternativa_id:r[1].alternativa_id},r[1]]}])assert.equal((await post('/quizzes/pin/respostas',body)).status,400);assert.equal(await contar('quiz_resultado_visitante'),0);
    });
    it('tokens adulterados, assinaturas não canônicas e acesso por outro modo/conta são recusados',async()=>{
        const c=await criar(),v=await abrir(c),a=await abrir(c,'aluno');const [payload,s]=v.acesso.split('.'),d=JSON.parse(Buffer.from(payload,'base64url').toString());d.q+=1;
        for(const acesso of [Buffer.from(JSON.stringify(d)).toString('base64url')+'.'+s,v.acesso+'.x','abc','x'.repeat(2000)])assert.equal((await post('/quizzes/pin/atividade',{acesso})).status,403);
        const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',ultimo=abc.indexOf(s.at(-1)),naoCanonica=s.slice(0,-1)+abc[(ultimo^1)];assert.equal((await post('/quizzes/pin/atividade',{acesso:payload+'.'+naoCanonica})).status,403);
        assert.equal((await ler(a)).status,401);assert.equal((await ler(v,'aluno')).status,403);assert.equal((await entrar(c.pin.codigo,'professor')).status,403);
        assert.equal((await post('/quizzes/pin/entrar',{pin:c.pin.codigo,modo:'aluno'})).status,401);
    });
    it('expiração de2h encerra o acesso sem apagar resultado',async()=>{
        const a=await abrir(await criar());await enviar(a);tempo+=7200001;assert.equal((await ler(a)).status,403);assert.equal(await contar('quiz_resultado_visitante'),1);
    });
    it('renovar/desativar PIN invalida código anterior e acessos abertos sem descartar respostas',async()=>{
        const c=await criar(),a=await abrir(c);await enviar(a);const n=await post('/quizzes/'+c.id+'/pin',{acao:'gerar'},'professor');assert.equal(n.status,200);assert.notEqual(n.data.pin.codigo,c.pin.codigo);assert.equal((await entrar(c.pin.codigo)).status,404);assert.equal((await ler(a)).status,403);
        const b=await abrir({pin:n.data.pin});assert.equal((await post('/quizzes/'+c.id+'/pin',{acao:'desativar'},'professor')).status,200);assert.equal((await ler(b)).status,403);assert.equal((await entrar(n.data.pin.codigo)).status,404);assert.equal(await contar('quiz_resultado_visitante'),1);
    });
    it('terceiros não gerenciam PIN; não é possível escolher o código no cadastro',async()=>{
        const c=await criar();for(const [p,status] of [['aluno',403],['outro',404],['',401]])assert.equal((await post('/quizzes/'+c.id+'/pin',{acao:'desativar'},p)).status,status);assert.equal((await post('/professor/quizzes',{...conteudo(),pin:'12345678'},'professor')).status,400);
    });
    it('arquivamento e revogação do vínculo/autoria encerram o acesso por PIN',async()=>{
        const c=await criar(),a=await abrir(c);await f.banco.query("UPDATE quiz SET estado='arquivado' WHERE id=?",[c.id]);assert.equal((await entrar(c.pin.codigo)).status,404);assert.equal((await ler(a)).status,403);assert.equal((await post('/quizzes/'+c.id+'/pin',{acao:'gerar'},'professor')).status,409);
        await f.banco.query("UPDATE quiz SET estado='rascunho' WHERE id=?",[c.id]);await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');assert.equal((await entrar(c.pin.codigo)).status,404);assert.equal((await enviar(a)).status,403);
    });
    it('edição sem histórico preserva PIN e invalida participação com estrutura antiga',async()=>{
        const c=await criar(),a=await abrir(c),q=(await f.request('/quizzes/'+c.id)).data;q.titulo='Atualizado';assert.equal((await f.request('/quizzes/'+c.id,'administrador',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)})).status,200);assert.equal((await ler(a)).status,403);assert.equal((await abrir(c)).atividade.titulo,'Atualizado');
    });
    it('histórico visitante bloqueia edição/exclusão/publicação; convite sem respostas permite exclusão',async()=>{
        const c=await criar(),a=await abrir(c);await enviar(a);const q=(await f.request('/quizzes/'+c.id)).data;assert.equal((await f.request('/quizzes/'+c.id,'administrador',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)})).status,409);assert.equal((await f.request('/quizzes/'+c.id,'administrador',{method:'DELETE'})).status,409);
        assert.equal((await f.request('/quizzes/'+c.id+'/disponibilidade','administrador',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({projeto_id:51,subprojeto_id:null,estado:'publicado',publico:false})})).status,409);
        const b=await criar();await abrir(b);assert.equal((await f.request('/quizzes/'+b.id,'administrador',{method:'DELETE'})).status,200);assert.equal((await f.banco.query('SELECT * FROM quiz_pin WHERE quiz_id=?',[b.id]))[0].length,0);
    });
    it('PIN preserva zeros à esquerda e colisão é resolvida sem duplicar código',async()=>{
        const a=await criar(),b=await criar();await executarTransacao(f.pool,db=>gerarPinQuiz(db,a.id,()=> '00000001'));let n=0;const novo=await executarTransacao(f.pool,db=>gerarPinQuiz(db,b.id,()=>++n===1?'00000001':'00000002'));assert.equal(novo.codigo,'00000002');assert.equal((await entrar('00000001')).status,200);assert.equal((await entrar('00000002')).status,200);
    });
    it('falha na gravação das respostas reverte nota e não expõe detalhes',async()=>{
        const a=await abrir(await criar());await f.banco.query("CREATE TRIGGER fixture_pin_falha BEFORE INSERT ON quiz_resposta_visitante FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture-secreta'");const r=await enviar(a);assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('fixture-secreta'),false);assert.equal(await contar('quiz_resultado_visitante'),0);
    });
    it('tentativas inválidas são limitadas por IP e a janela expira',async()=>{
        for(let n=0;n<30;n++)assert.equal((await entrar('inválido')).status,400);assert.equal((await entrar('00000000')).status,429);tempo+=60001;assert.equal((await entrar('00000000')).status,404);
    });
    it('verificação de esquema exige as FKs das respostas de visitante',async()=>{
        await f.banco.query('ALTER TABLE quiz_resposta_visitante DROP FOREIGN KEY labhist_fk_rv_alternativa');try{await assert.rejects(verificarEsquema(f.banco),/FK de PIN/);}finally{await f.banco.query('ALTER TABLE quiz_resposta_visitante ADD CONSTRAINT labhist_fk_rv_alternativa FOREIGN KEY (alternativa_id) REFERENCES quiz_alternativa(id) ON DELETE RESTRICT ON UPDATE RESTRICT');}
    });
});
