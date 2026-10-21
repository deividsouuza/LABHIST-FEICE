import mysql from 'mysql2/promise';
import { verificarEsquema } from './migrador.js';

export async function conectarBanco(configuracao, criarConexao = mysql.createConnection) {
    const banco = await criarConexao(configuracao);
    try {
        await verificarEsquema(banco);
        return banco;
    } catch (erro) {
        try { await banco.end(); } catch {}
        throw erro;
    }
}

// A aplicação usa pool; ferramentas de migração continuam com conexão dedicada.
export async function conectarPool(configuracao, criarPool = mysql.createPool) {
    const pool = criarPool({ ...configuracao, waitForConnections: true, connectionLimit: 10, queueLimit: 100 });
    try {
        const banco = await pool.getConnection();
        try { await verificarEsquema(banco); }
        finally { banco.release(); }
        return pool;
    } catch (erro) {
        try { await pool.end(); } catch {}
        throw erro;
    }
}
