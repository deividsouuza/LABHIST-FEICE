import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fsReal from 'node:fs';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import multer from 'multer';
import * as credenciais from '../../credenciais.js';
import * as errosApi from '../../erros-api.js';
import * as projetosValidacao from '../../projetos-validacao.js';
import * as identidades from '../../identidades.js';
import * as acessoAcademico from '../../acesso-academico.js';
import * as arquivosDocumentos from '../../arquivos-documentos.js';
import * as uploadDocumentos from '../../upload-documentos.js';
import * as limpezaArquivos from '../../limpeza-arquivos.js';
import * as subprojetos from '../../subprojetos.js';
import * as quizzes from '../../quizzes.js';
import * as operacao from '../../operacao.js';
import * as recuperacao from '../../recuperacao.js';
import * as mensagens from '../../mensagens.js';
import { pipeline } from 'node:stream/promises';
import { executarTransacao, transacaoIncerta } from '../../banco/transacao.js';
import { diagnosticoBanco } from '../../banco/migrador.js';
import { carregarConfiguracao } from '../../configuracao.js';
const hashFixture = await credenciais.gerarHash('senha-apenas-da-fixture');

// Suporte compartilhado dos testes HTTP de autorização e validação de pessoas.
// O módulo original roda em contexto isolado: nunca abre MySQL, grava uploads
// ou escuta a porta de desenvolvimento. Express e cookies de sessão são reais.
const backendUrl = new URL('../../index.js', import.meta.url);
export const senhaFixture = 'senha-apenas-da-fixture';
export const contas = [
    { id: 1, usuario: 'fixture-admin', perfil: 'administrador' },
    { id: 41, usuario: 'fixture-professor', perfil: 'professor' },
    { id: 42, usuario: 'fixture-aluno', perfil: 'aluno' },
    { id: 43, usuario: 'fixture-visitante', perfil: 'visitante' },
    { id: 44, usuario: 'fixture-desconhecido', perfil: 'outro-perfil' },
    { id: 45, usuario: 'fixture-sem-perfil' }
].map(conta => ({ ...conta, senha: hashFixture }));
export const professor = { id: 41, nome: 'Professor de teste', matricula: '410', email: 'professor@labhist.test', telefone: '(79) 99999-1111' };
export const aluno = { id: 42, nome: 'Aluno de teste', matricula: '420', email: 'aluno@labhist.test', telefone: '(79) 99999-2222', curso: 'Edificações', turma: '1° Ano' };
export const projeto = { id: 51, titulo: 'Projeto de teste', descricao: 'Descrição de teste', objetivo: 'Objetivo de teste', professor_id: 41 };
export const documento = { id: 61, projeto_id: 51, descricao: 'Documento de teste', arquivo_caminho: 'uploads/documentos/fixture.pdf', arquivo_nome: 'fixture.pdf', enviado_por: 42, enviado_por_perfil: 'aluno', autoria_confirmada: 1,autor_conta_id:42,autor_nome:'Aluno de teste',autor_perfil:'aluno' };
export const payloadProjeto = { status: 'em andamento', nome: projeto.titulo, descricao: projeto.descricao, objetivo: projeto.objetivo, professor_ids: [41], aluno_ids: [42] };

export function criarBancoSimulado(registros = {}) {
    const alunoDoBanco = registros.aluno ?? aluno;
    const professorDoBanco = registros.professor ?? professor;
    const chamadas = [];
    return {
        chamadas,
        async query(sql, parametros = []) {
            chamadas.push({ tipo: 'query', sql, parametros });
            if (sql === 'SELECT * FROM usuarios WHERE usuario = ?') {
                return [contas.filter(conta => conta.usuario === parametros[0])];
            }
            if (sql.replace(/ FOR SHARE$/,'') === 'SELECT id, usuario, perfil FROM usuarios WHERE id=?') return [contas.filter(c => c.id===parametros[0]).map(({id,usuario,perfil})=>({id,usuario,perfil}))];
            if (/SELECT p.id, p.nome FROM conta_pessoa/.test(sql)) return [[parametros[1] === 'aluno' ? alunoDoBanco : professorDoBanco]];
            if (sql === 'SELECT id, perfil FROM usuarios WHERE id=? FOR UPDATE') return [[{id:parametros[0],perfil:registros.perfilConta || chamadas.findLast(c => c.sql?.startsWith('INSERT INTO usuarios'))?.parametros[2] || 'aluno'}]];
            if (/^SELECT id FROM conta_pessoa/.test(sql)) return [[]];
            if (/^SELECT projeto_id FROM projeto_(aluno|professor) WHERE/.test(sql)) return [[{projeto_id:51}]];
            if (/^SELECT id FROM (aluno|professor) WHERE id=\?/.test(sql)) return [[{id:parametros[0]}]];
            if (sql === 'SELECT id FROM usuarios WHERE usuario = ?') return [[]];
            if (/FROM projeto_professor pp/.test(sql)) return [[sql.includes('pp.projeto_id,')?{projeto_id:projeto.id,...professorDoBanco}:professorDoBanco]];
            if (/FROM projeto_aluno pa/.test(sql)) return [[sql.includes('pa.projeto_id,')?{projeto_id:projeto.id,...alunoDoBanco}:alunoDoBanco]];
            if (/^SELECT .* FROM professor(?: WHERE| ORDER)/.test(sql)) return [[professorDoBanco]];
            if (/^SELECT .* FROM aluno(?: WHERE| ORDER)/.test(sql)) return [[alunoDoBanco]];
            if (/^SELECT .* FROM projeto(?: WHERE| ORDER)/.test(sql)) return [[projeto]];
            if (/^SELECT \* FROM documentos WHERE/.test(sql)) return [[documento]];
            if (sql.startsWith('SELECT id, arquivo_caminho FROM documentos')) return [[documento]];
            if (sql.startsWith('SELECT id, caminho, estado FROM limpeza_arquivos')) return [[{id:parametros[0],caminho:documento.arquivo_caminho,estado:'pendente'}]];
            if (/^(INSERT INTO|UPDATE|DELETE FROM) /.test(sql)) return [{ insertId: 101, affectedRows: 1 }];
            throw new Error('Consulta não prevista no banco simulado de autorização.');
        },
        async getConnection() {
            const banco = this; chamadas.push({ tipo: 'acquire' });
            return { query: (...args) => banco.query(...args),
                beginTransaction: () => banco.beginTransaction(), commit: () => banco.commit(), rollback: () => banco.rollback(),
                release() { chamadas.push({ tipo: 'release' }); }, destroy() { chamadas.push({ tipo: 'destroy' }); } };
        },
        async beginTransaction() { chamadas.push({ tipo: 'begin' }); },
        async commit() { chamadas.push({ tipo: 'commit' }); },
        async rollback() { chamadas.push({ tipo: 'rollback' }); }
    };
}

export async function carregarAplicacaoIsolada(opcoes = {}) {
    const remocoes = [];
    const logs = [];
    const leituras = [], arquivosAbertos = [];
    const context = vm.createContext({ Buffer,console: { log() {}, error(...args) { logs.push(args); } }, process: { exitCode: 0 } });
    const dependencias = {
        './credenciais.js': {...credenciais,criarLimitadorLogin:()=>credenciais.criarLimitadorLogin(opcoes.recuperacaoAgora||Date.now)},
        './operacao.js':operacao,
        './recuperacao.js':{...recuperacao,registrarRecuperacao:(app,args)=>recuperacao.registrarRecuperacao(app,{...args,agora:opcoes.recuperacaoAgora||Date.now,registrador:{error:(...args)=>logs.push(args)}})},
        './email-recuperacao.js':{criarTransporte:()=>opcoes.transporteRecuperacao||{disponivel:false}},
        './erros-api.js': { ...errosApi, responderErro: (res, erro, mensagem) => errosApi.responderErro(res, erro, mensagem, { error: (...args) => logs.push(args) }) },
        './projetos-validacao.js': projetosValidacao,
        './identidades.js': identidades,
        './acesso-academico.js': acessoAcademico,
        './mensagens.js':{registrarMensagens:(app,args)=>mensagens.registrarMensagens(app,{...args,agora:opcoes.recuperacaoAgora||Date.now})},
        './subprojetos.js':subprojetos,
        './quizzes.js':quizzes,
        './upload-documentos.js': {...uploadDocumentos,limitesUpload:()=>uploadDocumentos.limitesUpload(opcoes.uploadEnv||{})},
        './limpeza-arquivos.js': {...limpezaArquivos, async processarLimpezas(banco,pasta,ids) {
            if(opcoes.diretorioUploads)return limpezaArquivos.processarLimpezas(banco,pasta,ids,opcoes.removerArquivo);
            // Doubles antigos não podem remover arquivos reais do projeto.
            for(const id of ids){const [rows]=await banco.query('SELECT id, caminho, estado FROM limpeza_arquivos WHERE id=? FOR UPDATE',[id]);for(const row of rows){remocoes.push(arquivosDocumentos.resolverCaminhoDocumento(pasta,row.caminho));await banco.query("UPDATE limpeza_arquivos SET estado='concluido' WHERE id=?",[id]);}}
            return {concluidas:ids.length,pendentes:0,bloqueadas:0};
        }},
        './arquivos-documentos.js': { ...arquivosDocumentos, async abrirArquivoDocumento(...args) {
            leituras.push(args.slice(0,2));
            const arquivo=await arquivosDocumentos.abrirArquivoDocumento(...args);
            arquivosAbertos.push(arquivo.handle);
            return arquivo;
        } },
        'node:stream/promises': {pipeline},
        './banco/transacao.js': { executarTransacao, transacaoIncerta },
        './banco/conexao.js': { async conectarPool() { throw new Error('Bootstrap MySQL desativado no teste.'); } },
        './banco/migrador.js': { diagnosticoBanco },
        './configuracao.js': { carregarConfiguracao: () => carregarConfiguracao({ DB_HOST: 'fixture.invalid', DB_USER: 'fixture', DB_PASSWORD: 'apenas-fixture', DB_NAME: 'fixture', SESSION_SECRET: 'segredo-exclusivo-para-testes-isolados-123456', SESSION_STORE:'memory', API_PUBLIC_ORIGIN:'http://localhost:3000', RECOVERY_PUBLIC_ORIGIN:'https://fixture.invalid',...opcoes.operacaoEnv }) },
        express: { default: express },
        cors: { default: cors },
        'express-session': { default: session },
        'mysql2/promise': { default: { async createConnection() { throw new Error('Bootstrap MySQL desativado no teste.'); } } },
        path: { default: opcoes.diretorioUploads ? { ...path, join(...partes) {
            if (partes[0]===path.dirname(fileURLToPath(backendUrl)) && typeof partes[1]==='string' && /^uploads(?:[\\/]|$)/.test(partes[1])) {
                return path.join(opcoes.diretorioUploads,partes[1].replace(/^uploads[\\/]?/,''),...partes.slice(2));
            }
            return path.join(...partes);
        } } : path },
        fs: { default: opcoes.diretorioUploads ? { ...fsReal, unlink(caminho, callback) {remocoes.push(caminho);fsReal.unlink(caminho,callback);} }
            : { mkdirSync() {}, promises: { async rename() {} }, unlink(caminho, callback) { remocoes.push(caminho); callback(null); } } },
        crypto: { default: crypto },
        multer: { default: multer },
        url: { fileURLToPath }
    };
    let codigoOriginal = await readFile(backendUrl, 'utf8');
    // Mutação exclusiva da cópia VM para provar que uma regressão é detectada.
    if(opcoes.transformarCodigo)codigoOriginal=opcoes.transformarCodigo(codigoOriginal);
    const marcador = 'app.use((req, res) => res.status(404)';
    assert.ok(codigoOriginal.includes(marcador), 'Fallback JSON não localizado para isolamento de rotas.');
    const codigo = codigoOriginal.replace(marcador, 'const rotasDeTeste = express.Router(); app.use(rotasDeTeste);\n' + marcador);
    // Exports existem somente na cópia em memória. Nenhuma alteração de
    // bootstrap/arquitetura é necessária no backend de produção para testar os contratos HTTP.
    const modulo = new vm.SourceTextModule(codigo + '\nexport { app, rotasDeTeste }; export function configurarBancoDeTeste(banco) { pool = banco; } export {storeSessoes,recuperacao};', {
        context,
        identifier: backendUrl.href,
        initializeImportMeta(meta) { meta.url = backendUrl.href; }
    });
    // Módulos extraídos rodam no mesmo contexto e com os mesmos doubles de I/O.
    // Não importar estes módulos pelo loader real: isso escaparia do isolamento.
    const fontes = new Set(['./autenticacao.js','./pessoas.js','./pessoas-dados.js','./projetos.js','./documentos.js','./disponibilidade-quizzes.js','./catalogo-quizzes.js','./resultados-quizzes.js','./correcao-quizzes.js','./historico-quizzes.js']);
    const cache = new Map();
    // Pré-criar o grafo: o linker nativo liga cada módulo uma vez, inclusive
    // imports compartilhados solicitados em paralelo. Sem .link recursivo manual.
    for(const specifier of fontes){
        const url=new URL(specifier,backendUrl);
        let fonte=await readFile(url,'utf8');
        if(opcoes.transformarModulo)fonte=opcoes.transformarModulo(specifier,fonte);
        cache.set(specifier,new vm.SourceTextModule(fonte,{context,identifier:url.href,initializeImportMeta(meta){meta.url=url.href;}}));
    }
    function vincular(specifier) {
        if(cache.has(specifier))return cache.get(specifier);
        assert.ok(Object.hasOwn(dependencias, specifier), `Import não isolado: ${specifier}`);
        const exports = dependencias[specifier];
        const sintetico=new vm.SyntheticModule(Object.keys(exports), function () {
            for (const [nome, valor] of Object.entries(exports)) this.setExport(nome, valor);
        }, { context });
        cache.set(specifier,sintetico);
        return sintetico;
    }
    await modulo.link(vincular);
    await modulo.evaluate();
    return { ...modulo.namespace, remocoes, logs, leituras, arquivosAbertos };
}
