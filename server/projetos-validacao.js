export class ErroProjeto extends Error {
    constructor(mensagem, status = 400) { super(mensagem); this.status = status; }
}
export const statusProjetos=['finalizado','em andamento','cancelado'];

export function idProjetoValido(valor) {
    if (typeof valor !== 'number' && (typeof valor !== 'string' || !/^\d+$/.test(valor.trim()))) return null;
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

function listaIds(valor, rotulo) {
    if (!Array.isArray(valor)) throw new ErroProjeto(`${rotulo} deve ser uma lista de IDs inteiros positivos.`);
    const ids = valor.map(idProjetoValido);
    if (ids.some(id => id === null)) throw new ErroProjeto(`${rotulo} contém ID inválido.`);
    if (new Set(ids).size !== ids.length) throw new ErroProjeto(`${rotulo} contém IDs duplicados.`);
    return ids;
}

export function validarProjetoPayload(req, res, next) {
    try {
        const body = req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ErroProjeto('Envie um objeto JSON para o projeto.');
        if (typeof body.nome !== 'string' || !body.nome.trim()) throw new ErroProjeto('Nome do projeto e obrigatorio.');
        const responsavel = body.professor_id === undefined ? undefined : idProjetoValido(body.professor_id);
        if (responsavel === null) throw new ErroProjeto('professor_id deve ser um inteiro positivo.');
        let professorIds = listaIds(body.professor_ids === undefined ? (responsavel === undefined ? [] : [responsavel]) : body.professor_ids, 'Professores');
        if(req.method==='POST'&&req.identidadeAcesso?.perfil==='professor') {
            const proprio=req.identidadeAcesso.pessoa_id;
            if((responsavel!==undefined&&responsavel!==proprio)||(body.professor_ids!==undefined&&(professorIds.length!==1||professorIds[0]!==proprio))) {
                throw new ErroProjeto('O professor responsável deve ser o próprio professor autenticado.',403);
            }
            professorIds=[proprio];
        }
        const alunoIds = listaIds(body.aluno_ids === undefined ? [] : body.aluno_ids, 'Alunos');
        if (!professorIds.length) throw new ErroProjeto('Adicione pelo menos um professor ao projeto.');
        if (!alunoIds.length) throw new ErroProjeto('Adicione pelo menos um aluno ao projeto.');
        if (responsavel !== undefined && responsavel !== professorIds[0]) throw new ErroProjeto('professor_id deve corresponder ao primeiro professor da lista.');
        const projetoId = req.method === 'PUT' ? idProjetoValido(req.params.id) : undefined;
        if (req.method === 'PUT' && projetoId === null) throw new ErroProjeto('ID do projeto inválido.');
        if(!statusProjetos.includes(body.status)&&!(req.method==='PUT'&&(body.status===undefined||body.status===null)))throw new ErroProjeto('Escolha um status valido para o projeto.');
        req.projetoPayload = { professorIds, alunoIds, projetoId, status:body.status };
        next();
    } catch (erro) {
        if (!(erro instanceof ErroProjeto)) return next(erro);
        res.status(erro.status).json({ erro: erro.message });
    }
}

// Bloqueios compartilhados preservam a existência até o fim da transação.
// A ordem é estável para todas as requisições; nunca usar o pool aqui.
export async function confirmarMembros(banco, { professorIds, alunoIds }) {
    for (const [tabela, ids, rotulo] of [['professor', professorIds, 'professores'], ['aluno', alunoIds, 'alunos']]) {
        const [rows] = await banco.query(`SELECT id FROM ${tabela} WHERE id IN (?) ORDER BY id FOR SHARE`, [[...ids].sort((a, b) => a - b)]);
        const existentes = new Set(rows.map(row => Number(row.id)));
        if (ids.some(id => !existentes.has(id))) throw new ErroProjeto(`Um ou mais ${rotulo} não existem.`);
    }
}
