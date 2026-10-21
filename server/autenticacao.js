import crypto from 'crypto';
import { executarTransacao } from './banco/transacao.js';
import { ErroHttp, validarIdRota, responderErro } from './erros-api.js';
import { gerarHash, verificarSenha, senhaValida, hashValido, criarLimitadorLogin } from './credenciais.js';
import { normalizarPerfil, obterPessoaDaConta, vincularConta, relatorioIdentidades, confirmarSessao } from './identidades.js';
import { idProjetoValido } from './projetos-validacao.js';

const PERFIS_DE_CONTA = new Set(['administrador', 'professor', 'aluno']);

// A identidade só pode ser criada por login com senha verificada.
export function requireAuth(req, res, next) {
    if (req.session.identidade?.origem !== 'login') {
        return res.status(401).json({ erro: 'não autenticado' });
    }
    next();
}

// Protege as operações administrativas no servidor, independentemente do
// menu ou dos dados enviados pelo cliente. Deve rodar depois de requireAuth
// e antes de validações, consultas ou alterações dos recursos.
export function requireAdmin(req, res, next) {
    if (req.session.identidade.perfil !== 'administrador') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    next();
}

export function criarAutorizacao({obterPool, operacao}) {
    async function requireIdentidadeAtual(req, res, next) {
        const identidade=req.session.identidade;
        if (identidade.perfil==='administrador') {
            req.identidadeAcesso={conta_id:identidade.conta_id||identidade.id,perfil:'administrador',pessoa_id:null,nome:identidade.nome};
            return next();
        }
        if (!['aluno','professor'].includes(identidade.perfil)) return res.status(403).json({erro:'Acesso nao permitido.'});
        try {
            req.identidadeAcesso=await confirmarSessao(obterPool(),identidade);
            next();
        } catch (erro) {
            if (erro instanceof ErroHttp && erro.status===401) { req.session.destroy(()=>{}); res.clearCookie('connect.sid',operacao.cookie); }
            responderErro(res,erro);
        }
    }

    return {requireAuth, requireAdmin, requireIdentidadeAtual};
}

export async function registrarAutenticacao(app, {obterPool, operacao}) {
    app.post('/cadastro', requireAuth, requireAdmin, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim() : '';
        const senha = req.body?.senha;
        const perfil = req.body?.perfil === undefined
            ? 'administrador'
            : normalizarPerfil(req.body.perfil);

        if (!PERFIS_DE_CONTA.has(perfil)) {
            return res.status(400).json({ erro: 'Informe um perfil valido (administrador, professor ou aluno).' });
        }

        if (!usuario || usuario.length > 100 || !senhaValida(senha)) {
            return res.status(400).json({ erro: 'Preencha usuario e senha.' });
        }

        try {
            if (perfil !== 'administrador') {
                if (idProjetoValido(req.body.pessoa_id) === null) throw new ErroHttp(400, 'Informe pessoa_id para a conta academica.');
                const hash = await gerarHash(senha);
                const id = await executarTransacao(obterPool(), async banco => {
                    const [result] = await banco.query('INSERT INTO usuarios (usuario, senha, perfil) VALUES (?, ?, ?)', [usuario, hash, perfil]);
                    await vincularConta(banco, result.insertId, perfil, req.body.pessoa_id);
                    return result.insertId;
                });
                return res.json({ mensagem: 'Usuario cadastrado com sucesso.', id });
            }
            const [existente] = await obterPool().query(
                'SELECT id FROM usuarios WHERE usuario = ?',
                [usuario]
            );

            if (existente.length > 0) {
                return res.status(409).json({ erro: 'Ja existe um usuario cadastrado com esse nome de usuario.' });
            }

            const [result] = await obterPool().query(
                'INSERT INTO usuarios (usuario, senha, perfil) VALUES (?, ?, ?)',
                [usuario, await gerarHash(senha), perfil]
            );

            res.json({ mensagem: 'Usuario cadastrado com sucesso.', id: result.insertId });
        } catch (erro) {
            responderErro(res, erro, 'Erro no servidor ao cadastrar usuario.');
        }
    });

    const hashAusente = await gerarHash(crypto.randomBytes(32).toString('hex'));
    const limitarLogin = criarLimitadorLogin();
    app.post('/login', limitarLogin, async (req, res) => {
        if (!obterPool()) return res.status(503).json({ erro: 'Serviço de autenticação indisponível.' });
        const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim() : '';
        const senha = req.body?.senha;
        const negar = () => res.status(401).json({ erro: 'Usuario ou senha incorretos.' });
        if (!usuario || usuario.length > 100 || !senhaValida(senha)) return negar();
        try {
            const [rows] = await obterPool().query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
            const user = rows[0];
            const valido = await verificarSenha(senha, hashValido(user?.senha) ? user.senha : hashAusente);
            if (!user || !valido || !PERFIS_DE_CONTA.has(user.perfil)) return negar();
            if (req.body.perfil !== undefined && normalizarPerfil(req.body.perfil) !== user.perfil) return negar();
            const pessoa = user.perfil === 'administrador' ? null : await obterPessoaDaConta(obterPool(), user.id, user.perfil);
            if (user.perfil !== 'administrador' && !pessoa) return negar();
            await new Promise((resolve, reject) => req.session.regenerate(erro => erro ? reject(erro) : resolve()));
            req.session.identidade = { origem: 'login', versao_sessao:user.sessao_versao||0, id: user.id, conta_id: user.id, pessoa_id: pessoa?.id || null, perfil: user.perfil, nome: pessoa?.nome || user.usuario };
            await new Promise((resolve, reject) => req.session.save(erro => erro ? reject(erro) : resolve()));
            res.json({ mensagem: 'Login realizado com sucesso.', usuario: user.usuario, perfil: user.perfil });
        } catch {
            console.error('Falha interna na autenticação.');
            res.status(500).json({ erro: 'Erro no servidor ao fazer login.' });
        }
    });

    app.post('/logout', (req, res) => {
        req.session.destroy(erro => {
            if (erro) return responderErro(res, erro, 'Erro ao encerrar sessao.');
            res.clearCookie('connect.sid',operacao.cookie);
            res.json({ mensagem: 'Sessao encerrada.' });
        });
    });

    // Contratos legados desativados: não enumeram pessoas nem criam sessão por ID.
    app.get('/pessoas', (req, res) => res.status(410).json({ erro: 'Seleção de identidade desativada. Entre com usuário e senha.' }));
    app.post('/sessao/pessoa', (req, res) => res.status(410).json({ erro: 'Seleção de identidade desativada. Entre com usuário e senha.' }));

    app.get('/sessao', requireAuth, async (req, res) => {
        res.set('Cache-Control', 'no-store');
        try { res.json(await confirmarSessao(obterPool(), req.session.identidade)); }
        catch (erro) {
            if (erro instanceof ErroHttp && erro.status===401) {
                req.session.destroy(() => {});
                res.clearCookie('connect.sid',operacao.cookie);
            }
            responderErro(res, erro);
        }
    });

    app.get('/contas/pendencias', requireAuth, requireAdmin, async (req, res) => {
        try { res.json(await relatorioIdentidades(obterPool())); }
        catch (erro) { responderErro(res, erro); }
    });

    app.put('/contas/:id/vinculo', requireAuth, requireAdmin, validarIdRota, async (req, res) => {
        try {
            await executarTransacao(obterPool(), banco => vincularConta(banco, req.recursoId, req.body?.perfil, req.body?.pessoa_id));
            res.json({ mensagem: 'Vinculo registrado.' });
        } catch (erro) { responderErro(res, erro); }
    });

}
