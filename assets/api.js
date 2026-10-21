function origemApi(){
    const configurada=window.LABHIST_API_ORIGIN;if(!configurada)return window.location.origin;
    const u=new URL(configurada);if(!['http:','https:'].includes(u.protocol)||u.origin!==configurada)throw new Error('Configuração da API inválida.');return u.origin;
}
class ErroApi extends Error {
    constructor(status, mensagem, sessaoExpirada = false) {
        super(mensagem);
        this.status = status;
        this.sessaoExpirada = sessaoExpirada;
    }
}

// Compartilhado por login e painel. Somente JSON válido e respostas 2xx prosseguem.
async function requisitarJson(url, opcoes = {}, aoExpirar = null) {
    let res;
    try { res = await fetch(url, { ...opcoes, credentials: 'include' }); }
    catch { throw new ErroApi(0, 'Não foi possível conectar. Verifique sua conexão e tente novamente.'); }
    if (res.status === 401 && aoExpirar) {
        aoExpirar();
        throw new ErroApi(401, 'Sua sessão expirou. Entre novamente.', true);
    }
    let dados;
    try { dados = await res.json(); } catch {}
    if (!res.ok) {
        const mensagens = {
            400: 'Confira os dados informados.', 401: 'Usuário, senha ou perfil incorretos.',
            403: 'Você não tem permissão para esta operação.', 404: 'Registro não encontrado.',
            409: 'Os dados estão em conflito. Atualize e tente novamente.',
            413: 'O arquivo ou os dados ultrapassam o limite permitido.',
            429: 'Limite de tentativas atingido. Aguarde e tente novamente.'
        };
        const mensagem = res.status>=500 ? 'O servidor não conseguiu concluir a operação. Tente novamente.'
            : typeof dados?.erro==='string' && dados.erro.trim() ? dados.erro : mensagens[res.status] || 'Não foi possível concluir a operação.';
        throw new ErroApi(res.status, mensagem);
    }
    if (!dados || typeof dados!=='object') throw new ErroApi(res.status, 'Resposta inválida do servidor. Tente novamente.');
    return Object.assign(res, { dados });
}
