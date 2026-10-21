import { ErroHttp } from './erros-api.js';
import { idProjetoValido } from './projetos-validacao.js';
import { executarTransacao } from './banco/transacao.js';
import { autorizarProjeto } from './acesso-academico.js';
import { carregarQuiz, exigirQuizSemHistorico } from './quizzes.js';

export function requireAluno(req,res,next){
    if(req.session.identidade.perfil!=='aluno')return res.status(403).json({erro:'Acesso restrito a alunos.'});
    next();
}

export function introducaoQuiz(q){return {id:q.id,titulo:q.titulo,descricao:q.descricao||''};}

export async function quizDisponivel(banco,id,identidade,travar=false){
    const [rows]=await banco.query('SELECT id,titulo,descricao,projeto_id FROM quiz WHERE id=? AND estado=\'publicado\' AND projeto_id IS NOT NULL'+(travar?' FOR UPDATE':''),[id]);
    if(!rows.length)throw new ErroHttp(404,'Quiz indisponível.');
    await autorizarProjeto(banco,rows[0].projeto_id,identidade,travar);
    return rows[0];
}

function validarDisponibilidade(req,res,next){
    try{
        const b=req.body;
        if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['projeto_id','subprojeto_id','estado','publico'].includes(k))||!['rascunho','publicado','arquivado'].includes(b.estado)||typeof b.publico!=='boolean')throw new ErroHttp(400,'Disponibilidade inválida.');
        const dados={estado:b.estado,publico:b.publico};
        for(const campo of ['projeto_id','subprojeto_id']){
            if(b[campo]===null)dados[campo]=null;
            else{dados[campo]=idProjetoValido(b[campo]);if(dados[campo]===null)throw new ErroHttp(400,'Informe projeto e subprojeto válidos, ou null.');}
        }
        if(dados.projeto_id===null&&(dados.estado==='publicado'||dados.subprojeto_id!==null))throw new ErroHttp(400,'Projeto é obrigatório para publicar ou vincular subprojeto.');
        req.disponibilidadeQuiz=dados;next();
    }catch(erro){res.status(400).json({erro:erro.message});}
}

export function registrarDisponibilidadeQuizzes(app,{obterPool,requireAuth,requireAdmin,validarIdRota,responderErro}){
    app.get('/quizzes/:id/disponibilidade',requireAuth,requireAdmin,validarIdRota,async(req,res)=>{
        try{
            const [rows]=await obterPool().query('SELECT id,projeto_id,subprojeto_id,estado,introducao_publica FROM quiz WHERE id=?',[req.recursoId]);
            if(!rows.length)throw new ErroHttp(404,'Quiz não encontrado.');
            const {introducao_publica,...q}=rows[0];res.set('Cache-Control','no-store').json({...q,publico:introducao_publica===1});
        }catch(erro){responderErro(res,erro);}
    });
    app.put('/quizzes/:id/disponibilidade',requireAuth,requireAdmin,validarIdRota,validarDisponibilidade,async(req,res)=>{
        try{
            await executarTransacao(obterPool(),async banco=>{
                const q=await carregarQuiz(banco,req.recursoId,true);await exigirQuizSemHistorico(banco,q);
                const d=req.disponibilidadeQuiz;
                if(d.projeto_id!==null){
                    const [pais]=await banco.query('SELECT id FROM projeto WHERE id=? FOR SHARE',[d.projeto_id]);if(!pais.length)throw new ErroHttp(404,'Projeto não encontrado.');
                }
                if(d.subprojeto_id!==null){
                    const [sub]=await banco.query('SELECT id,projeto_id FROM subprojeto WHERE id=? FOR SHARE',[d.subprojeto_id]);
                    if(!sub.length||sub[0].projeto_id!==d.projeto_id)throw new ErroHttp(400,'Subprojeto não pertence ao projeto.');
                }
                await banco.query('UPDATE quiz SET projeto_id=?,subprojeto_id=?,estado=?,introducao_publica=? WHERE id=?',[d.projeto_id,d.subprojeto_id,d.estado,d.publico?1:0,q.id]);
            });res.json({mensagem:'Disponibilidade atualizada.'});
        }catch(erro){responderErro(res,erro);}
    });
}
