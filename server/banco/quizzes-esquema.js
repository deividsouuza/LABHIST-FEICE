import { ErroIntegridade } from './integridade-projetos.js';
import disponibilidade from './versoes/014-disponibilidade-quizzes.js';

export async function quizFkAplicada(banco,passo){
    const [rows]=await banco.query(`SELECT k.COLUMN_NAME AS coluna,k.REFERENCED_TABLE_NAME AS destino,k.REFERENCED_COLUMN_NAME AS chave,
        k.REFERENCED_TABLE_SCHEMA=DATABASE() AS local_ok,r.DELETE_RULE AS exclusao,r.UPDATE_RULE AS atualizacao
        FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r
        ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME
        WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.CONSTRAINT_NAME=? ORDER BY k.ORDINAL_POSITION`,[passo.tabela,passo.nome]);
    if(!rows.length)return false;
    if(rows.length!==passo.colunas.length||rows.some((r,i)=>r.coluna!==passo.colunas[i]||r.destino!==passo.referencia||r.chave!==passo.chaves[i]||!r.local_ok||!['RESTRICT','NO ACTION'].includes(r.exclusao)||!['RESTRICT','NO ACTION'].includes(r.atualizacao)))throw new ErroIntegridade('FK de disponibilidade de quiz incompatível.');
    return true;
}

export async function verificarDisponibilidade(banco){
    for(const p of disponibilidade.passos.filter(p=>p.quizFk))if(!await quizFkAplicada(banco,p))throw new ErroIntegridade('FK de disponibilidade de quiz ausente.');
    const [rows]=await banco.query(`SELECT c.CHECK_CLAUSE AS regra,t.ENFORCED AS enforced FROM information_schema.CHECK_CONSTRAINTS c
        JOIN information_schema.TABLE_CONSTRAINTS t ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME
        WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='quiz' AND t.CONSTRAINT_NAME='labhist_quiz_disponivel'`);
    const normalizar=s=>s.toLowerCase().replace(/_utf8mb4|[\s\x60()\\]/g,'');
    const esperado="estadoin'rascunho','publicado','arquivado'andintroducao_publicain0,1andestado<>'publicado'orprojeto_idisnotnullandsubprojeto_idisnullorprojeto_idisnotnull";
    if(rows.length!==1||rows[0].enforced!=='YES'||normalizar(rows[0].regra)!==esperado)throw new ErroIntegridade('Regra de disponibilidade de quiz ausente ou incompatível.');
}
