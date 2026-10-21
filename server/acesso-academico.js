import { ErroHttp } from './erros-api.js';

export async function autorizarProjeto(banco, projetoId, identidade, travar=false) {
    if (identidade.perfil==='administrador') {
        if (travar) {
            const [rows]=await banco.query('SELECT id FROM projeto WHERE id = ? FOR SHARE',[projetoId]);
            if (!rows.length) throw new ErroHttp(404,'Projeto nao encontrado.');
        }
        return;
    }
    const perfil=identidade.perfil;
    if (!['aluno','professor'].includes(perfil)) throw new ErroHttp(403,'Acesso nao permitido.');
    const [rows]=await banco.query(`SELECT projeto_id FROM projeto_${perfil} WHERE projeto_id=? AND ${perfil}_id=?${travar?' FOR SHARE':''}`,[projetoId,identidade.pessoa_id]);
    if (!rows.length) throw new ErroHttp(403,'Voce nao participa deste projeto.');
}

export function autorizarDocumento(documento, identidade) {
    if (identidade.perfil==='administrador' || identidade.perfil==='professor') return;
    if (identidade.perfil!=='aluno' || documento.autoria_confirmada!==1 || documento.autor_perfil!=='aluno' || documento.autor_conta_id!==identidade.conta_id) {
        throw new ErroHttp(403,'Voce nao tem acesso a este documento.');
    }
}
