import { ErroHttp } from './erros-api.js';
import { idProjetoValido } from './projetos-validacao.js';

// Contrato D08 aprovado: escolha única, todas obrigatórias, 1 ponto por acerto.
// O gabarito provém exclusivamente do banco; não há endpoint público de correção.
export function corrigirQuiz(perguntas,respostas){
    if(!Array.isArray(perguntas)||!perguntas.length)throw new ErroHttp(500,'Quiz sem configuração válida para correção.');
    if(!Array.isArray(respostas)||respostas.length!==perguntas.length)throw new ErroHttp(400,'Responda todas as perguntas exatamente uma vez.');
    const mapa=new Map();
    for(const p of perguntas){
        if(idProjetoValido(p.id)===null||mapa.has(p.id)||!Array.isArray(p.alternativas)||p.alternativas.length<2||p.alternativas.filter(a=>a.correta===true).length!==1||p.alternativas.some(a=>idProjetoValido(a.id)===null||typeof a.correta!=='boolean')||new Set(p.alternativas.map(a=>a.id)).size!==p.alternativas.length)throw new ErroHttp(500,'Quiz sem configuração válida para correção.');
        mapa.set(p.id,p);
    }
    const vistas=new Set(),normalizadas=[];let pontuacao=0;
    for(const r of respostas){
        if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==2||Object.keys(r).some(k=>!['pergunta_id','alternativa_id'].includes(k)))throw new ErroHttp(400,'Estrutura de resposta inválida.');
        const perguntaId=idProjetoValido(r.pergunta_id),alternativaId=idProjetoValido(r.alternativa_id),p=mapa.get(perguntaId);
        if(!p||vistas.has(perguntaId))throw new ErroHttp(400,'Responda todas as perguntas exatamente uma vez.');
        const alternativa=p.alternativas.find(a=>a.id===alternativaId);
        if(!alternativa)throw new ErroHttp(400,'Alternativa não pertence à pergunta.');
        vistas.add(perguntaId);normalizadas.push({pergunta_id:perguntaId,alternativa_id:alternativaId});if(alternativa.correta)pontuacao++;
    }
    return {pontuacao,total_perguntas:perguntas.length,percentual:pontuacao/perguntas.length*100,respostas:normalizadas.sort((a,b)=>a.pergunta_id-b.pergunta_id)};
}
