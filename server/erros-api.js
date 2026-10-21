import multer from 'multer';
import { ErroProjeto, idProjetoValido } from './projetos-validacao.js';

export class ErroHttp extends Error {
    constructor(status, mensagem) { super(mensagem); this.status = status; }
}

export function validarIdRota(req, res, next) {
    const id = idProjetoValido(req.params.id);
    if (id === null) return res.status(400).json({ erro: 'ID do recurso inválido.' });
    req.recursoId = id;
    next();
}

export async function exigirRegistro(banco, tabela, id, mensagem = 'Registro nao encontrado.') {
    // Apenas identificadores internos fixos podem compor SQL.
    if (!['aluno', 'professor', 'projeto'].includes(tabela)) throw new Error('Tabela interna inválida.');
    const [rows] = await banco.query(`SELECT id FROM ${tabela} WHERE id = ? FOR UPDATE`, [id]);
    if (!rows.length) throw new ErroHttp(404, mensagem);
}

export function conferirExclusao(resultado, mensagem) {
    if (resultado.affectedRows === 0) throw new ErroHttp(404, mensagem);
    if (resultado.affectedRows !== 1) throw new Error('Resultado inesperado de exclusão.');
}

const conflitos = new Set(['ER_DUP_ENTRY', 'ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);
const dadosInvalidos = new Set(['ER_DATA_TOO_LONG', 'ER_BAD_NULL_ERROR', 'ER_TRUNCATED_WRONG_VALUE', 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 'ER_WARN_DATA_OUT_OF_RANGE']);
const tiposParser = new Map([
    ['entity.parse.failed', [400, 'JSON inválido.']],
    ['entity.too.large', [413, 'Corpo da requisição excede o limite permitido.']],
    ['request.aborted', [400, 'Requisição interrompida.']],
    ['request.size.invalid', [400, 'Tamanho da requisição inválido.']],
    ['encoding.unsupported', [415, 'Codificação não suportada.']],
    ['charset.unsupported', [415, 'Codificação não suportada.']]
]);

export function responderErro(res, erro, mensagemInterna = 'Erro interno ao processar a requisicao.', registrador = console) {
    if (erro instanceof ErroHttp || erro instanceof ErroProjeto) return res.status(erro.status).json({ erro: erro.message });
    if (erro instanceof URIError && erro.status === 400) return res.status(400).json({ erro: 'Codificação do caminho inválida.' });
    if (erro instanceof multer.MulterError) {
        return res.status(['LIMIT_FILE_SIZE','LIMIT_FIELD_VALUE','LIMIT_FIELD_COUNT','LIMIT_PART_COUNT','LIMIT_FILE_COUNT'].includes(erro.code) ? 413 : 400).json({ erro: 'Envio de arquivo inválido ou acima do limite permitido.' });
    }
    const parser = tiposParser.get(erro?.type);
    if (parser) return res.status(parser[0]).json({ erro: parser[1] });
    if (conflitos.has(erro?.code)) return res.status(409).json({ erro: 'Conflito com os dados existentes. Verifique o estado do recurso antes de tentar novamente.' });
    if (dadosInvalidos.has(erro?.code)) return res.status(400).json({ erro: 'Dados incompatíveis com os campos do recurso.' });
    // Não registrar objeto do driver, mensagem, SQL, stack, corpo ou segredo.
    registrador.error('Falha interna na API.', { operacao: mensagemInterna, codigo: 'INTERNO' });
    return res.status(500).json({ erro: mensagemInterna });
}
