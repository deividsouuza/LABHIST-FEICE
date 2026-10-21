import { ErroHttp } from './erros-api.js';
import { idProjetoValido } from './projetos-validacao.js';
import { executarTransacao } from './banco/transacao.js';

export function validarCredenciais(dados, senhaValida) {
    const usuario = typeof dados?.usuario === 'string' ? dados.usuario.trim() : '';
    if (!usuario || usuario.length > 100 || /[\u0000-\u001f\u007f]/.test(usuario) || !senhaValida(dados?.senha)) {
        throw new ErroHttp(400, 'Informe usuario (ate 100 caracteres) e senha validos.');
    }
    return { usuario, senha: dados.senha };
}

export async function obterPessoaDaConta(banco, contaId, perfil, travar=false) {
    if (!['aluno', 'professor'].includes(perfil)) return null;
    const [rows] = await banco.query(`SELECT p.id, p.nome FROM conta_pessoa c
        JOIN usuarios u ON u.id=c.usuario_id AND u.perfil=c.perfil
        JOIN ${perfil} p ON p.id=c.${perfil}_id
        WHERE c.usuario_id=? AND c.perfil=?${travar?' FOR SHARE':''}`, [contaId, perfil]);
    return rows[0] || null;
}

export async function confirmarSessao(banco, identidade, travar=false) {
    if (!identidade || !['administrador','aluno','professor'].includes(identidade.perfil)) throw new ErroHttp(401, 'Sessao expirada. Entre novamente.');
    const contaId = identidade.conta_id || identidade.id;
    const [contas] = await banco.query('SELECT id, usuario, perfil FROM usuarios WHERE id=?'+(travar?' FOR SHARE':''), [contaId]);
    const conta = contas[0];
    if (!conta || conta.perfil !== identidade.perfil) throw new ErroHttp(401, 'Sessao expirada. Entre novamente.');
    const pessoa = conta.perfil==='administrador' ? null : await obterPessoaDaConta(banco, conta.id, conta.perfil, travar);
    if (conta.perfil!=='administrador' && (!pessoa || pessoa.id!==identidade.pessoa_id)) throw new ErroHttp(401, 'Sessao expirada. Entre novamente.');
    return { conta_id:conta.id, perfil:conta.perfil, pessoa_id:pessoa?.id || null, nome:pessoa?.nome || conta.usuario };
}

// Todas as chamadas de escrita recebem a conexão da mesma transação.
export async function vincularConta(banco, contaId, perfil, pessoaId) {
    if (!['aluno', 'professor'].includes(perfil) || idProjetoValido(pessoaId) === null) {
        throw new ErroHttp(400, 'Informe perfil academico e pessoa_id validos.');
    }
    const [contas] = await banco.query('SELECT id, perfil FROM usuarios WHERE id=? FOR UPDATE', [contaId]);
    if (!contas.length) throw new ErroHttp(404, 'Conta nao encontrada.');
    if (contas[0].perfil !== perfil) throw new ErroHttp(400, 'Perfil da pessoa incompativel com a conta.');
    const [pessoas] = await banco.query(`SELECT id FROM ${perfil} WHERE id=? FOR UPDATE`, [Number(pessoaId)]);
    if (!pessoas.length) throw new ErroHttp(404, 'Pessoa nao encontrada.');
    const [existentes] = await banco.query(`SELECT id FROM conta_pessoa WHERE usuario_id=? OR ${perfil}_id=?`, [contaId, Number(pessoaId)]);
    if (existentes.length) throw new ErroHttp(409, 'Conta ou pessoa ja possui vinculo.');
    await banco.query(`INSERT INTO conta_pessoa (usuario_id, perfil, ${perfil}_id) VALUES (?, ?, ?)`, [contaId, perfil, Number(pessoaId)]);
}

export async function relatorioIdentidades(banco) {
    const [contas] = await banco.query(`SELECT u.id, u.usuario, u.perfil FROM usuarios u
        LEFT JOIN conta_pessoa c ON c.usuario_id=u.id
        WHERE u.perfil IN ('aluno','professor') AND c.id IS NULL ORDER BY u.id`);
    const pessoas = {};
    for (const perfil of ['aluno', 'professor']) {
        [pessoas[perfil]] = await banco.query(`SELECT p.id, p.nome FROM ${perfil} p
            LEFT JOIN conta_pessoa c ON c.${perfil}_id=p.id WHERE c.id IS NULL ORDER BY p.id`);
    }
    return { contas_sem_vinculo: contas, pessoas_sem_conta: pessoas };
}

// Mapa explícito revisado pelo administrador; dry-run é o padrão. Sem busca por nome.
export async function migrarVinculos(pool, mapa, aplicar = false) {
    if (!Array.isArray(mapa) || !mapa.length || mapa.some(item =>
        idProjetoValido(item?.conta_id) === null || idProjetoValido(item?.pessoa_id) === null || !['aluno', 'professor'].includes(item?.perfil))) {
        throw new ErroHttp(400, 'Mapa de vinculos invalido.');
    }
    // Mesmo dry-run executa as restrições reais, mas termina em rollback.
    const somenteValidar = new Error('validacao-sem-aplicacao');
    try {
        await executarTransacao(pool, async banco => {
            for (const item of [...mapa].sort((a,b) => Number(a.conta_id)-Number(b.conta_id))) {
                await vincularConta(banco, Number(item.conta_id), item.perfil, Number(item.pessoa_id));
            }
            if (!aplicar) throw somenteValidar;
        });
    } catch (erro) { if (erro !== somenteValidar) throw erro; }
    return { modo: aplicar ? 'aplicado' : 'validado-sem-gravacao', vinculos: mapa.length };
}

export function normalizarPerfil(perfil) {
    return typeof perfil === 'string' && perfil.trim()
        ? perfil.trim().toLowerCase()
        : '';
}
