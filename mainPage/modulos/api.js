// api: responsabilidades e dependências em ../MODULOS.md.
const API = origemApi();

// Toda chamada à API passa por aqui: manda o cookie de sessão
// (credentials: 'include') e, se o servidor responder 401 (sessão
// inexistente/expirada), manda de volta pro login em vez de deixar a tela
// travada mostrando dados que não deveriam aparecer.
async function apiFetch(url, options = {}) {
    return requisitarJson(url, options, () => {
        limparEstadoSessao();
        window.location.replace('../login/login.html');
    });
}

function mostrarErro(erro, fallback = 'Não foi possível concluir. Tente novamente.') {
    if (!erro?.sessaoExpirada) alert(erro?.message || fallback);
}
function formatoInvalido() { throw new ErroApi(200, 'Resposta inválida do servidor. Tente novamente.'); }
function validarRegistro(dados, tipo) {
    if (!dados || typeof dados!=='object' || Array.isArray(dados) || !Number.isInteger(dados.id) || dados.id<=0) formatoInvalido();
    if (typeof dados.nome!=='string' && tipo!=='documento') formatoInvalido();
    const camposTexto = tipo==='documento' ? ['descricao','arquivo_nome'] : tipo==='projeto' ? ['descricao','objetivo'] : ['email','telefone','matricula','curso','turma'];
    for (const campo of camposTexto) if (dados[campo]!=null && typeof dados[campo]!=='string') formatoInvalido();
    if (tipo==='projeto') for (const campo of ['professor_ids','aluno_ids']) {
        if (!Array.isArray(dados[campo]) || dados[campo].some(id=>!Number.isInteger(id)||id<=0)) formatoInvalido();
    }
    if(tipo==='projeto'&&dados.status!=null&&!['finalizado','em andamento','cancelado'].includes(dados.status))formatoInvalido();
    if(tipo==='documento'&&dados.texto_explicativo!=null&&typeof dados.texto_explicativo!=='string')formatoInvalido();
    if (tipo==='documento' && (!Number.isInteger(dados.projeto_id) || typeof dados.descricao!=='string' || typeof dados.arquivo_nome!=='string')) formatoInvalido();
    return dados;
}
function validarLista(dados, tipo) {
    if (!Array.isArray(dados)) formatoInvalido();
    dados.forEach(item=>validarRegistro(item,tipo));
    return dados;
}
function confirmarOperacao(res) {
    if (typeof res.dados?.mensagem!=='string') formatoInvalido();
    return res.dados;
}

