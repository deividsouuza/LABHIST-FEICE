import { registrarHistoricoAluno, registrarAcompanhamentoProfessor } from './historico-quizzes.js';
import { registrarResultadosQuizzes } from './resultados-quizzes.js';
import { registrarCatalogoQuizzes } from './catalogo-quizzes.js';
import { registrarDisponibilidadeQuizzes } from './disponibilidade-quizzes.js';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { carregarConfiguracao } from './configuracao.js';
import { conectarPool } from './banco/conexao.js';
import { diagnosticoBanco } from './banco/migrador.js';
import { validarIdRota, responderErro } from './erros-api.js';
import { protegerOrigem,corsOperacao,StoreMysql } from './operacao.js';
import { criarAutorizacao, registrarAutenticacao } from './autenticacao.js';
import { registrarPessoas } from './pessoas.js';
import { registrarProjetos } from './projetos.js';
import { criarDocumentos } from './documentos.js';
import { registrarSubprojetos } from './subprojetos.js';
import { registrarQuizzes } from './quizzes.js';
import { registrarRecuperacao } from './recuperacao.js';
import { criarTransporte } from './email-recuperacao.js';
import { registrarMensagens } from './mensagens.js';
import { registrarQuizzesProfessor } from './quizzes-professor.js';

const configuracao = carregarConfiguracao();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

let pool = null;
const {requireAuth, requireAdmin, requireIdentidadeAtual}=criarAutorizacao({obterPool:()=>pool,operacao:configuracao.operacao});
const operacao=configuracao.operacao;
if(operacao.trustProxy.length)app.set('trust proxy',operacao.trustProxy);
app.use(protegerOrigem(operacao));
app.use(cors(corsOperacao(operacao)));
app.use(express.json());
const storeSessoes=operacao.store==='mysql'?new StoreMysql(()=>pool,operacao.ttlMs):new session.MemoryStore();
app.use(session({secret:configuracao.sessionSecret,store:storeSessoes,resave:false,saveUninitialized:false,rolling:true,cookie:{...operacao.cookie,maxAge:operacao.ttlMs}}));
app.get('/configuracao-publica.js',(req,res)=>res.set('Cache-Control','no-store').type('application/javascript').send('window.LABHIST_API_ORIGIN='+JSON.stringify(operacao.apiPublica)+';'));

// Só as pastas de frontend ficam públicas. Antes, express.static apontava
// para a raiz do projeto inteiro (path.join(__dirname, '..')), o que também
// expunha server/ (incluindo a senha do banco em connectDB) e server/sql/*
// via URL. Cada pasta abaixo é servida sob o mesmo prefixo que já era usado
// nos links relativos do HTML (ex: /login/login.css, /assets/logo.png).
app.use('/login', express.static(path.join(__dirname, '..', 'login')));
app.use('/mainPage', express.static(path.join(__dirname, '..', 'mainPage')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/publico', express.static(path.join(__dirname, '..', 'publico')));

app.use('/uploads', (req,res)=>res.status(404).json({erro:'Recurso nao encontrado.'}));

const documentos=criarDocumentos({obterPool:()=>pool,diretorioServidor:__dirname,requireAuth,requireAdmin,requireIdentidadeAtual});
const {concluirLimpeza}=documentos;

async function connectDB() {
    pool = await conectarPool(configuracao.banco);
    console.log('Conectado ao MySQL com esquema compatível.');
}

await registrarAutenticacao(app, {obterPool:()=>pool, operacao});

registrarPessoas(app,{obterPool:()=>pool,requireAuth,requireAdmin,requireIdentidadeAtual});

registrarProjetos(app,{obterPool:()=>pool,requireAuth,requireAdmin,requireIdentidadeAtual,concluirLimpeza});

documentos.registrar(app);

registrarSubprojetos(app,{obterPool:()=>pool,requireAuth,requireAdmin,requireIdentidadeAtual,validarIdRota,responderErro});
registrarQuizzes(app,{obterPool:()=>pool,requireAuth,requireAdmin,validarIdRota,responderErro});
registrarQuizzesProfessor(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual});

registrarDisponibilidadeQuizzes(app,{obterPool:()=>pool,requireAuth,requireAdmin,validarIdRota,responderErro});

registrarCatalogoQuizzes(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro});

registrarResultadosQuizzes(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro});

registrarHistoricoAluno(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual,responderErro});

registrarAcompanhamentoProfessor(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual,validarIdRota,responderErro});

registrarMensagens(app,{obterPool:()=>pool,requireAuth,requireIdentidadeAtual});

const recuperacao=registrarRecuperacao(app,{obterPool:()=>pool,requireAuth,requireAdmin,validarIdRota,responderErro,transporte:criarTransporte(configuracao.recuperacao),origemPublica:configuracao.recuperacao.origem,store:storeSessoes,limparCookie:res=>res.clearCookie('connect.sid',operacao.cookie)});

// Respostas JSON também para rotas desconhecidas e falhas fora dos handlers.
app.use((req, res) => res.status(404).json({ erro: 'Recurso nao encontrado.' }));
app.use((err, req, res, next) => {
    if (res.headersSent) {
        console.error('Falha interna após início da resposta.');
        return next(new Error('Falha interna após início da resposta.'));
    }
    responderErro(res, err);
});

async function main() {
    try {
        await connectDB();
        app.listen(3000, () => {
            console.log('Servidor rodando em http://localhost:3000');
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', diagnosticoBanco(error));
        if (pool) { try { await pool.end(); } catch {} }
        process.exitCode = 1;
    }
}

main();
