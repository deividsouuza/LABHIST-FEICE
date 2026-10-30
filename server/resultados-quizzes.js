import { ErroHttp } from './erros-api.js';
import { executarTransacao } from './banco/transacao.js';
import { confirmarSessao } from './identidades.js';
import { carregarQuiz } from './quizzes.js';
import { requireAluno, quizDisponivel, introducaoQuiz } from './disponibilidade-quizzes.js';
import { corrigirQuiz } from './correcao-quizzes.js';

export const camposResultado="id,quiz_id,quiz_titulo,pontuacao,total_perguntas,percentual,DATE_FORMAT(concluido_em,'%Y-%m-%dT%H:%i:%sZ') AS concluido_em";
export function mapearResultado(r){return {id:r.id,quiz_id:r.quiz_id,quiz_titulo:r.quiz_titulo,pontuacao:r.pontuacao,total_perguntas:r.total_perguntas,percentual:r.percentual,concluido_em:r.concluido_em};}
export async function lerResultado(banco,quizId,alunoId,travar=false){const [rows]=await banco.query('SELECT '+camposResultado+' FROM quiz_resultado WHERE quiz_id=? AND aluno_id=?'+(travar?' FOR UPDATE':''),[quizId,alunoId]);return rows.length?mapearResultado(rows[0]):null;}
export function atividadeSemGabarito(q,resultado){return {...introducaoQuiz(q),perguntas:q.perguntas.map(p=>({id:p.id,descricao:p.descricao,alternativas:p.alternativas.map(a=>({id:a.id,descricao:a.descricao}))})),resultado};}
export async function salvarResultadoAluno(banco,q,identidade,respostas){
    const correcao=corrigirQuiz(q.perguntas,respostas),existente=await lerResultado(banco,q.id,identidade.pessoa_id,true);
    if(existente){
        const [anteriores]=await banco.query('SELECT pergunta_id,alternativa_id FROM quiz_resposta WHERE resultado_id=? ORDER BY pergunta_id',[existente.id]);
        if(anteriores.length!==correcao.respostas.length||anteriores.some((a,i)=>a.pergunta_id!==correcao.respostas[i].pergunta_id||a.alternativa_id!==correcao.respostas[i].alternativa_id))throw new ErroHttp(409,'Você já concluiu este quiz; respostas diferentes não são permitidas. Consulte seu resultado.');
        return {resultado:existente,reenvio:true};
    }
    const [r]=await banco.query('INSERT INTO quiz_resultado (quiz_id,aluno_id,conta_id,quiz_titulo,aluno_nome,pontuacao,total_perguntas,percentual,concluido_em) VALUES (?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3))',[q.id,identidade.pessoa_id,identidade.conta_id,q.titulo,identidade.nome,correcao.pontuacao,correcao.total_perguntas,correcao.percentual]);
    await banco.query('INSERT INTO quiz_resposta (resultado_id,pergunta_id,alternativa_id) VALUES ?',[correcao.respostas.map(a=>[r.insertId,a.pergunta_id,a.alternativa_id])]);
    return {resultado:await lerResultado(banco,q.id,identidade.pessoa_id,true),reenvio:false};
}
function validarSubmissao(req,res,next){
    const b=req.body;
    if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==1||!Object.hasOwn(b,'respostas')||!Array.isArray(b.respostas)||!b.respostas.length||b.respostas.length>50)return res.status(400).json({erro:'Envie somente respostas, com uma alternativa por pergunta.'});
    next();
}

export function registrarResultadosQuizzes(app,{obterPool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro}){
    app.get('/aluno/quizzes/:id/atividade',requireAuth,requireAluno,validarIdRota,requireIdentidadeAtual,async(req,res)=>{
        try{
            const dados=await executarTransacao(obterPool(),async banco=>{
                const disponivel=await quizDisponivel(banco,req.recursoId,req.identidadeAcesso),q=await carregarQuiz(banco,disponivel.id);
                return atividadeSemGabarito(q,await lerResultado(banco,q.id,req.identidadeAcesso.pessoa_id));
            });res.set('Cache-Control','no-store').json(dados);
        }catch(erro){responderErro(res,erro);}
    });
    app.post('/aluno/quizzes/:id/respostas',requireAuth,requireAluno,validarIdRota,validarSubmissao,requireIdentidadeAtual,async(req,res)=>{
        try{
            const dados=await executarTransacao(obterPool(),async banco=>{
                // A mesma trava de quiz usada pela edição serializa submissões,
                // publicação e alterações de estrutura. Vínculo/identidade revalidados.
                const identidade=await confirmarSessao(banco,req.session.identidade,true);
                const disponivel=await quizDisponivel(banco,req.recursoId,identidade,true),q=await carregarQuiz(banco,disponivel.id,true);
                return salvarResultadoAluno(banco,q,identidade,req.body.respostas);
            });
            res.set('Cache-Control','no-store').status(dados.reenvio?200:201).json({mensagem:dados.reenvio?'Resultado já registrado.':'Respostas e resultado registrados.',...dados});
        }catch(erro){responderErro(res,erro);}
    });
}
