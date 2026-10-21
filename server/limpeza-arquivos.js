import path from 'node:path';
import { executarTransacao } from './banco/transacao.js';
import { removerDocumentoConfinado,resolverCaminhoDocumento } from './arquivos-documentos.js';

// Executar somente dentro da transação que remove os metadados.
export async function enfileirarDocumentos(banco,documentos,projetoId) {
    const ids=[];
    for(const doc of documentos){
        const [row]=await banco.query('INSERT INTO limpeza_arquivos (documento_id, projeto_id, caminho) VALUES (?, ?, ?)',[doc.id,projetoId,doc.arquivo_caminho]);ids.push(row.insertId);
    }
    return ids;
}

export async function listarLimpezas(banco) {
    const [rows]=await banco.query("SELECT id, documento_id, projeto_id, estado, tentativas, erro_codigo FROM limpeza_arquivos WHERE estado <> 'concluido' ORDER BY id LIMIT 100");
    return rows;
}

export async function processarLimpezas(pool,pasta,ids,remover=removerDocumentoConfinado) {
    const resumo={concluidas:0,pendentes:0,bloqueadas:0};
    for(const id of [...new Set(ids)].sort((a,b)=>a-b)){
        const estado=await executarTransacao(pool,async banco=>{
            const [rows]=await banco.query('SELECT id, caminho, estado FROM limpeza_arquivos WHERE id=? FOR UPDATE',[id]);
            if(!rows.length||rows[0].estado==='concluido')return 'concluido';
            const row=rows[0];let resultado;
            const normalizar=p=>{const v=path.resolve(resolverCaminhoDocumento(pasta,p));return process.platform==='win32'?v.toLowerCase():v;};
            let alvo;
            try{alvo=normalizar(row.caminho);}catch{resultado={estado:'bloqueado',codigo:'CAMINHO_INVALIDO'};}
            if(!resultado){
                const [referencias]=await banco.query('SELECT DISTINCT arquivo_caminho FROM documentos');
                const referenciado=referencias.some(r=>{try{return normalizar(r.arquivo_caminho)===alvo;}catch{return false;}});
                resultado=referenciado?{estado:'pendente',codigo:'ARQUIVO_REFERENCIADO'}:await remover(pasta,row.caminho);
            }
            await banco.query('UPDATE limpeza_arquivos SET estado=?, erro_codigo=?, tentativas=tentativas+1 WHERE id=?',[resultado.estado,resultado.codigo,id]);
            return resultado.estado;
        });
        resumo[estado==='concluido'?'concluidas':estado==='bloqueado'?'bloqueadas':'pendentes']++;
    }
    return resumo;
}
