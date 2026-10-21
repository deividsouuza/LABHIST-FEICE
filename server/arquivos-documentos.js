import path from 'node:path';
import { promises as fs } from 'node:fs';
import { ErroHttp } from './erros-api.js';

const indisponivel = () => new ErroHttp(404, 'Arquivo indisponivel.');
const mesmaPasta = (a,b) => path.relative(a,b)==='';

export function nomeDownload(nome) {
    const seguro=Array.from((typeof nome==='string'?nome:'documento').toWellFormed()).slice(0,200).join('')
        .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,'_').replace(/^\.+/,'').trim().replace(/[. ]+$/,'');
    return seguro || 'documento';
}

export function resolverCaminhoDocumento(pastaPermitida,caminhoRegistro) {
        if (typeof caminhoRegistro!=='string' || /[\u0000-\u001f\u007f]/.test(caminhoRegistro)) throw indisponivel();
        const pasta=path.resolve(pastaPermitida);
        let nome;
        if (path.isAbsolute(caminhoRegistro)) {
            const absoluto=path.resolve(caminhoRegistro);
            if (!mesmaPasta(pasta,path.dirname(absoluto))) throw indisponivel();
            nome=path.basename(absoluto);
        } else {
            const partes=/^uploads\/documentos\/([^/]+)$/.exec(caminhoRegistro.replace(/\\/g,'/'));
            if (!partes) throw indisponivel();
            nome=partes[1];
        }
        if (!nome || /[<>:"/\\|?*]/.test(nome) || /[. ]$/.test(nome) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(nome)) throw indisponivel();
        const candidato=path.join(pasta,nome);
        if (!mesmaPasta(pasta,path.dirname(candidato))) throw indisponivel();
        return candidato;
}

export async function abrirArquivoDocumento(pastaPermitida, caminhoRegistro, operacoes=fs) {
    let handle;
    try {
        const candidato=resolverCaminhoDocumento(pastaPermitida,caminhoRegistro),pasta=path.resolve(pastaPermitida);
        const raiz=await operacoes.lstat(pasta);
        if (!raiz.isDirectory() || raiz.isSymbolicLink()) throw indisponivel();
        const raizReal=await operacoes.realpath(pasta);
        const antes=await operacoes.lstat(candidato,{bigint:true});
        if (!antes.isFile() || antes.isSymbolicLink()) throw indisponivel();
        const real=await operacoes.realpath(candidato);
        if (!mesmaPasta(raizReal,path.dirname(real))) throw indisponivel();
        handle=await operacoes.open(candidato,'r');
        const aberto=await handle.stat({bigint:true});
        // Não consumir bytes antes de conferir que o descritor é o arquivo verificado.
        if (!aberto.isFile() || aberto.dev!==antes.dev || aberto.ino!==antes.ino ||
            !mesmaPasta(raizReal,path.dirname(await operacoes.realpath(candidato)))) throw indisponivel();
        return {handle,tamanho:aberto.size};
    } catch (erro) {
        if (handle) await handle.close().catch(()=>{});
        if (['ENOENT','ENOTDIR','ELOOP'].includes(erro?.code)) throw indisponivel();
        throw erro;
    }
}

export async function removerDocumentoConfinado(pasta,caminho,operacoes=fs) {
    let candidato;
    try { candidato=resolverCaminhoDocumento(pasta,caminho); }
    catch {return {estado:'bloqueado',codigo:'CAMINHO_INVALIDO'};}
    try {
        const raiz=await operacoes.lstat(pasta),item=await operacoes.lstat(candidato);
        if (!raiz.isDirectory()||raiz.isSymbolicLink()||!item.isFile()||item.isSymbolicLink()) return {estado:'bloqueado',codigo:'CAMINHO_INVALIDO'};
        const arquivo=await abrirArquivoDocumento(pasta,caminho,operacoes);
        await arquivo.handle.close();
        await operacoes.unlink(candidato);
        return {estado:'concluido',codigo:null};
    } catch(erro) {
        if(erro.code==='ENOENT'||erro.code==='ENOTDIR')return {estado:'concluido',codigo:'JA_AUSENTE'};
        if(erro.status===404)return {estado:'bloqueado',codigo:'CAMINHO_INVALIDO'};
        return {estado:'pendente',codigo:['EACCES','EPERM','EBUSY'].includes(erro.code)?'ACESSO_NEGADO':'FALHA_IO'};
    }
}
