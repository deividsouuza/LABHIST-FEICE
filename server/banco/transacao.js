const falhaDeConexao = erro => erro?.fatal || [
    'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'PROTOCOL_ENQUEUE_AFTER_QUIT', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'
].includes(erro?.code);
const resultadosIncertos = new WeakSet();
export const transacaoIncerta = erro => !!erro && typeof erro==='object' && resultadosIncertos.has(erro);

// Uma aquisição por operação. A função recebe somente a conexão desta transação.
// Não há retry/reconexão: um COMMIT sem confirmação pode ter resultado incerto.
export async function executarTransacao(pool, operacao) {
    const banco = await pool.getConnection();
    let iniciada = false, confirmando = false, descartar = false;
    try {
        await banco.beginTransaction();
        iniciada = true;
        const resultado = await operacao(banco);
        confirmando = true;
        await banco.commit();
        confirmando = false;
        return resultado;
    } catch (erro) {
        if ((confirmando || falhaDeConexao(erro)) && erro && typeof erro==='object') resultadosIncertos.add(erro);
        descartar = !iniciada || confirmando || falhaDeConexao(erro);
        if (iniciada && !falhaDeConexao(erro)) {
            try { await banco.rollback(); }
            catch { descartar = true; }
        }
        throw erro;
    } finally {
        // Conexão saudável volta ao pool; conexão incerta é removida do pool.
        if (descartar) banco.destroy();
        else banco.release();
    }
}
