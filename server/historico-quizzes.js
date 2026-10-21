import { ErroHttp } from './erros-api.js';
import { executarTransacao } from './banco/transacao.js';
import { requireAluno } from './disponibilidade-quizzes.js';
import { camposResultado, mapearResultado } from './resultados-quizzes.js';

export function registrarHistoricoAluno(app,{obterPool,requireAuth,requireIdentidadeAtual,responderErro}){
    app.get('/aluno/resultados',requireAuth,requireAluno,requireIdentidadeAtual,async(req,res)=>{
        try{
            if(Object.keys(req.query).length)throw new ErroHttp(400,'O histórico usa exclusivamente a identidade da sessão.');
            const [rows]=await obterPool().query('SELECT '+camposResultado+' FROM quiz_resultado WHERE aluno_id=? ORDER BY concluido_em DESC,id DESC',[req.identidadeAcesso.pessoa_id]);
            res.set('Cache-Control','no-store').json(rows.map(mapearResultado));
        }catch(erro){responderErro(res,erro);}
    });
}

const camposAcompanhados="r.id,r.quiz_id,r.quiz_titulo,r.pontuacao,r.total_perguntas,r.percentual,DATE_FORMAT(r.concluido_em,'%Y-%m-%dT%H:%i:%sZ') AS concluido_em,r.aluno_id,r.aluno_nome";
// Os dois vínculos atuais são obrigatórios, inclusive para quizzes arquivados.
const vinculoAcompanhado=' EXISTS (SELECT 1 FROM quiz q JOIN projeto_professor pp ON pp.projeto_id=q.projeto_id JOIN projeto_aluno pa ON pa.projeto_id=q.projeto_id AND pa.aluno_id=r.aluno_id WHERE q.id=r.quiz_id AND pp.professor_id=?)';
function requireProfessor(req,res,next){if(req.session.identidade.perfil!=='professor')return res.status(403).json({erro:'Acesso restrito a professores.'});next();}
function semFiltros(req,res,next){if(Object.keys(req.query).length)return res.status(400).json({erro:'O acompanhamento usa exclusivamente a identidade da sessão.'});next();}
const mapearAcompanhado=r=>({...mapearResultado(r),aluno:{id:r.aluno_id,nome:r.aluno_nome}});
export function registrarAcompanhamentoProfessor(app,{obterPool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro}){
    app.get('/professor/resultados',requireAuth,requireProfessor,semFiltros,requireIdentidadeAtual,async(req,res)=>{
        try{const [rows]=await obterPool().query('SELECT '+camposAcompanhados+' FROM quiz_resultado r WHERE '+vinculoAcompanhado+' ORDER BY r.concluido_em DESC,r.id DESC',[req.identidadeAcesso.pessoa_id]);res.set('Cache-Control','no-store').json(rows.map(mapearAcompanhado));}
        catch(erro){responderErro(res,erro);}
    });
    app.get('/professor/resultados/:id',requireAuth,requireProfessor,validarIdRota,semFiltros,requireIdentidadeAtual,async(req,res)=>{
        try{const dados=await executarTransacao(obterPool(),async banco=>{
            const [rows]=await banco.query('SELECT '+camposAcompanhados+' FROM quiz_resultado r WHERE r.id=? AND '+vinculoAcompanhado,[req.recursoId,req.identidadeAcesso.pessoa_id]);
            if(!rows.length)throw new ErroHttp(404,'Resultado indisponível.');
            const [respostas]=await banco.query('SELECT p.id AS pergunta_id,p.descricao AS pergunta,a.id AS alternativa_id,a.descricao AS alternativa FROM quiz_resposta x JOIN quiz_pergunta p ON p.id=x.pergunta_id AND p.quiz_id=? JOIN quiz_alternativa a ON a.id=x.alternativa_id AND a.pergunta_id=p.id WHERE x.resultado_id=? ORDER BY p.ordem,p.id',[rows[0].quiz_id,rows[0].id]);
            return {...mapearAcompanhado(rows[0]),respostas:respostas.map(r=>({pergunta:{id:r.pergunta_id,descricao:r.pergunta},alternativa:{id:r.alternativa_id,descricao:r.alternativa}}))};
        });res.set('Cache-Control','no-store').json(dados);}catch(erro){responderErro(res,erro);}
    });
}
