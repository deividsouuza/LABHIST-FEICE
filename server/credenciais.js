import crypto from 'node:crypto';

const opcoes = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const formato = /^\$scrypt\$v1\$65536\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
export const hashValido = valor => typeof valor === 'string' && formato.test(valor);
export const senhaValida = valor => typeof valor === 'string' && valor.length > 0 &&
    Buffer.byteLength(valor, 'utf8') <= 1024 && !/^\$(?:scrypt|2[aby]|argon2)/.test(valor);

function derivar(senha, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(senha, salt, 64, opcoes, (erro, chave) => erro ? reject(erro) : resolve(chave));
    });
}

export async function gerarHash(senha) {
    if (typeof senha !== 'string' || !senha.length || Buffer.byteLength(senha, 'utf8') > 1024) {
        throw new Error('Senha inválida para conversão.');
    }
    const salt = crypto.randomBytes(16);
    const chave = await derivar(senha, salt);
    return `$scrypt$v1$65536$8$1$${salt.toString('hex')}$${chave.toString('hex')}`;
}

// Não há fallback de comparação em texto puro, nem parâmetros controlados pelo cliente.
export async function verificarSenha(senha, hash) {
    if (!senhaValida(senha) || !hashValido(hash)) return false;
    const [, salt, chave] = hash.match(formato);
    const derivada = await derivar(senha, Buffer.from(salt, 'hex'));
    return crypto.timingSafeEqual(derivada, Buffer.from(chave, 'hex'));
}

export function criarLimitadorLogin(agora = Date.now) {
    const janela = 15 * 60 * 1000;
    const ips = new Map();
    const contas = new Map();
    // Limites por processo: 30/IP e 10/usuário a cada 15 minutos, contando sucessos.
    // Não confiar em X-Forwarded-For sem configuração explícita de proxy (P03).
    return function limitar(req, res, next) {
        const tempo = agora();
        const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim().toLowerCase() : '';
        const chaveConta = crypto.createHash('sha256').update(usuario).digest('hex');
        const itens = [[ips, req.ip, 30], [contas, chaveConta, 10]];
        for (const [mapa] of itens) {
            for (const [chave, item] of mapa) if (item.ate <= tempo) mapa.delete(chave);
        }
        if (itens.some(([mapa, chave, maximo]) => (mapa.get(chave)?.total || 0) >= maximo || (!mapa.has(chave) && mapa.size >= 10000))) {
            res.set('Retry-After', '900');
            return res.status(429).json({ erro: 'Limite de tentativas atingido. Tente novamente mais tarde.' });
        }
        for (const [mapa, chave] of itens) {
            const item = mapa.get(chave) || { total: 0, ate: tempo + janela };
            item.total++;
            mapa.set(chave, item);
        }
        next();
    };
}
