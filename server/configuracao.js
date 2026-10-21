import { configurarRecuperacao } from './email-recuperacao.js';
import { configurarOperacao } from './operacao.js';
// Falha antes de conectar ou escutar. Mensagens nunca incluem valores do ambiente.
export function carregarConfiguracao(env = process.env, exigirSessao = true) {
    const obrigatorias = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    if (exigirSessao) obrigatorias.push('SESSION_SECRET');
    for (const nome of obrigatorias) {
        if (typeof env[nome] !== 'string' || !env[nome].trim()) {
            throw new Error(`Configuração ausente: ${nome}.`);
        }
    }
    if (exigirSessao && Buffer.byteLength(env.SESSION_SECRET) < 32) {
        throw new Error('SESSION_SECRET deve ter pelo menos 32 bytes aleatórios.');
    }
    const port = Number(env.DB_PORT || 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT inválida.');
    const operacao=exigirSessao?configurarOperacao(env):undefined;
    return {
        operacao,recuperacao:exigirSessao?configurarRecuperacao(env,operacao):undefined,
        banco: { host: env.DB_HOST, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, port },
        sessionSecret: exigirSessao ? env.SESSION_SECRET : undefined
    };
}
