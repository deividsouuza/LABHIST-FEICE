import { ErroHttp } from './erros-api.js';
import { requireAluno, quizDisponivel, introducaoQuiz } from './disponibilidade-quizzes.js';

export function registrarCatalogoQuizzes(app,{obterPool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro}){
    app.get('/aluno/quizzes',requireAuth,requireAluno,requireIdentidadeAtual,async(req,res)=>{
        try{
            if(Object.keys(req.query).length)throw new ErroHttp(400,'O catálogo usa a identidade da sessão, sem filtros de pessoa.');
            const [rows]=await obterPool().query("SELECT q.id,q.titulo,q.descricao FROM quiz q WHERE q.estado='publicado' AND q.projeto_id IS NOT NULL AND EXISTS (SELECT 1 FROM projeto_aluno v WHERE v.projeto_id=q.projeto_id AND v.aluno_id=?) ORDER BY q.id",[req.identidadeAcesso.pessoa_id]);
            res.set('Cache-Control','no-store').json(rows.map(introducaoQuiz));
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/aluno/quizzes/:id',requireAuth,requireAluno,validarIdRota,requireIdentidadeAtual,async(req,res)=>{
        try{const q=await quizDisponivel(obterPool(),req.recursoId,req.identidadeAcesso);res.set('Cache-Control','no-store').json(introducaoQuiz(q));}catch(erro){responderErro(res,erro);}
    });
    app.get('/publico/quizzes',async(req,res)=>{
        try{const [rows]=await obterPool().query("SELECT id,titulo,descricao FROM quiz WHERE estado='publicado' AND introducao_publica=1 AND projeto_id IS NOT NULL ORDER BY id");res.set('Cache-Control','no-store').json(rows.map(introducaoQuiz));}catch(erro){responderErro(res,erro);}
    });
    app.get('/publico/quizzes/:id',validarIdRota,async(req,res)=>{
        try{const [rows]=await obterPool().query("SELECT id,titulo,descricao FROM quiz WHERE id=? AND estado='publicado' AND introducao_publica=1 AND projeto_id IS NOT NULL",[req.recursoId]);if(!rows.length)throw new ErroHttp(404,'Quiz indisponível.');res.set('Cache-Control','no-store').json(introducaoQuiz(rows[0]));}catch(erro){responderErro(res,erro);}
    });
}
