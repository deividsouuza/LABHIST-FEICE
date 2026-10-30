import {ErroHttp,validarIdRota,responderErro} from './erros-api.js';
import {idProjetoValido} from './projetos-validacao.js';
import {autorizarProjeto} from './acesso-academico.js';
import {confirmarSessao} from './identidades.js';
import {executarTransacao} from './banco/transacao.js';
import {validarQuizPayload,inserirPergunta,carregarQuiz} from './quizzes.js';
import {gerarPinQuiz,lerPinQuiz} from './quiz-pin.js';

function requireProfessor(req,res,next){if(req.session.identidade?.perfil!=='professor')return res.status(403).json({erro:'Acesso restrito a professores.'});next();}
function validarCadastro(req,res,next){
    const body=req.body;
    if(!body||typeof body!=='object'||Array.isArray(body))return res.status(400).json({erro:'Envie um objeto JSON para o quiz.'});
    const {projeto_id,subprojeto_id,...conteudo}=body,projeto=idProjetoValido(projeto_id),sub=subprojeto_id==null?null:idProjetoValido(subprojeto_id);
    if(projeto===null||(subprojeto_id!=null&&sub===null))return res.status(400).json({erro:'Selecione um projeto válido e, opcionalmente, um subprojeto.'});
    const validacao={method:'POST',body:conteudo};
    validarQuizPayload(validacao,res,()=>{req.quizPayload=validacao.quizPayload;req.quizVinculo={projeto,sub};next();});
}
async function exigirQuizProprio(banco,id,i){
    const [rows]=await banco.query('SELECT id,projeto_id,subprojeto_id,estado FROM quiz WHERE id=? AND autor_conta_id=? AND autor_professor_id=? FOR SHARE',[id,i.conta_id,i.pessoa_id]);
    if(!rows.length)throw new ErroHttp(404,'Quiz não encontrado.');
    if(rows[0].projeto_id===null)throw new ErroHttp(403,'Quiz sem vínculo de projeto autorizado.');
    await autorizarProjeto(banco,rows[0].projeto_id,i,true);return rows[0];
}
export function registrarQuizzesProfessor(app,{obterPool,requireAuth,requireIdentidadeAtual}){
    const acesso=[requireAuth,requireProfessor,requireIdentidadeAtual];
    app.post('/professor/quizzes',...acesso,validarCadastro,async(req,res)=>{
        try{
            const dados=await executarTransacao(obterPool(),async banco=>{
                const i=await confirmarSessao(banco,req.session.identidade,true),v=req.quizVinculo,p=req.quizPayload;
                await autorizarProjeto(banco,v.projeto,i,true);
                if(v.sub!==null){const [rows]=await banco.query('SELECT id,projeto_id FROM subprojeto WHERE id=? FOR SHARE',[v.sub]);if(!rows.length||rows[0].projeto_id!==v.projeto)throw new ErroHttp(400,'Subprojeto não pertence ao projeto selecionado.');}
                const [r]=await banco.query("INSERT INTO quiz (titulo,descricao,projeto_id,subprojeto_id,estado,introducao_publica,autor_conta_id,autor_professor_id) VALUES (?,?,?,?,'rascunho',0,?,?)",[p.titulo,p.descricao,v.projeto,v.sub,i.conta_id,i.pessoa_id]);
                for(const [ordem,pergunta] of p.perguntas.entries())await inserirPergunta(banco,r.insertId,pergunta,ordem);
                return {id:r.insertId,pin:await gerarPinQuiz(banco,r.insertId)};
            });res.status(201).json({...dados,mensagem:'Quiz cadastrado. Compartilhe o PIN para receber respostas de alunos e visitantes.'});
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/professor/quizzes',...acesso,async(req,res)=>{
        try{
            const i=req.identidadeAcesso;
            const [rows]=await obterPool().query(`SELECT q.id,q.titulo,q.descricao,q.projeto_id,q.subprojeto_id,q.estado FROM quiz q WHERE q.autor_conta_id=? AND q.autor_professor_id=? AND EXISTS (SELECT 1 FROM projeto_professor pp WHERE pp.projeto_id=q.projeto_id AND pp.professor_id=?) ORDER BY q.id DESC`,[i.conta_id,i.pessoa_id,i.pessoa_id]);
            res.set('Cache-Control','no-store').json(rows);
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/professor/quizzes/:id',...acesso,validarIdRota,async(req,res)=>{
        try{
            const dados=await executarTransacao(obterPool(),async banco=>{
                const i=await confirmarSessao(banco,req.session.identidade,true),q=await exigirQuizProprio(banco,req.recursoId,i);
                return {...await carregarQuiz(banco,q.id),projeto_id:q.projeto_id,subprojeto_id:q.subprojeto_id,estado:q.estado,pin:await lerPinQuiz(banco,q.id)};
            });res.set('Cache-Control','no-store').json(dados);
        }catch(erro){responderErro(res,erro);}
    });
}
