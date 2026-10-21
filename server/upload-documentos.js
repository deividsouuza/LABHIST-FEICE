import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream';
import { inflateRawSync, inflateSync } from 'node:zlib';
import { ErroHttp } from './erros-api.js';

export const extensoesDocumentos = ['.pdf','.doc','.docx','.jpg','.jpeg','.png'];
export function limitesUpload(env=process.env) {
    const inteiro=(chave,padrao,min,max)=>{
        const v=env[chave]===undefined?padrao:Number(env[chave]);
        if (!Number.isSafeInteger(v)||v<min||v>max) throw new Error(`Configuracao invalida: ${chave}.`);
        return v;
    };
    const arquivo=inteiro('UPLOAD_MAX_BYTES',10*1024*1024,1024,100*1024*1024);
    const campos=inteiro('UPLOAD_MAX_FIELDS',8,2,32);
    const campo=inteiro('UPLOAD_FIELD_MAX_BYTES',8192,1024,65536);
    return {arquivo,campos,campo,multipart:inteiro('UPLOAD_MULTIPART_MAX_BYTES',arquivo+campos*campo+65536,arquivo+1024,128*1024*1024),
        expandido:inteiro('UPLOAD_EXPANDED_MAX_BYTES',64*1024*1024,1024,128*1024*1024)};
}

export function extensaoDocumento(nome) {
    const ext=path.extname(nome).toLowerCase();
    if (!extensoesDocumentos.includes(ext) || /\.(?:exe|com|bat|cmd|ps1|sh|js|html?|php|aspx?|scr|msi)\./i.test(nome) || /[\x00-\x1f\x7f]/.test(nome)) throw new ErroHttp(400,'Nome ou extensao de arquivo nao permitido.');
    return ext;
}

// Storage próprio fecha o descritor antes de limpar, inclusive em aborto/limite.
export function storageDocumento(diretorio) {
    return {
        _handleFile(req,file,cb) {
            const filename=crypto.randomUUID()+extensaoDocumento(file.originalname), alvo=path.join(diretorio,filename);
            const saida=fs.createWriteStream(alvo,{flags:'wx'});
            file.path=alvo;
            const abortar=()=>saida.destroy(new ErroHttp(400,'Envio interrompido.'));
            req.once('aborted',abortar);req.once('error',abortar);
            pipeline(file.stream,saida,async erro=>{
                req.removeListener('aborted',abortar);req.removeListener('error',abortar);
                if (erro) {
                    try { await fs.promises.unlink(alvo); } catch(e) { if(e.code!=='ENOENT') return cb(new Error('Falha na limpeza do upload temporario.')); }
                    return cb(erro);
                }
                cb(null,{destination:diretorio,filename,path:alvo,size:saida.bytesWritten});
            });
        },
        _removeFile(req,file,cb) { fs.unlink(file.path,e=>cb(e?.code==='ENOENT'?null:e)); }
    };
}

export function receberDocumento(middleware,limites) {
    return (req,res,next)=>{
        if (Number(req.headers['content-length'])>limites.multipart) return next(new ErroHttp(413,'Envio excede o limite permitido.'));
        let bytes=0,excedeu=false;
        const contar=bloco=>{bytes+=bloco.length;if(bytes>limites.multipart&&!excedeu){excedeu=true;req.emit('error',new ErroHttp(413,'Envio excede o limite permitido.'));}};
        req.on('data',contar);
        middleware(req,res,erro=>{req.removeListener('data',contar);next(erro);});
    };
}

const tabelaCrc=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i&1)?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
export function crc32(b) {let c=0xffffffff;for(const byte of b)c=tabelaCrc[(c^byte)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const garantir=v=>{if(!v)throw new Error('Formato incompativel.');};

function png(b,limite) {
    garantir(b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')));
    let pos=8,ihdr=false,fim=false;const dados=[];
    while(pos+12<=b.length){
        const n=b.readUInt32BE(pos),tipo=b.toString('ascii',pos+4,pos+8);garantir(pos+n+12<=b.length);
        garantir(crc32(b.subarray(pos+4,pos+8+n))===b.readUInt32BE(pos+8+n));
        if(!ihdr){garantir(tipo==='IHDR'&&n===13&&b.readUInt32BE(pos+8)>0&&b.readUInt32BE(pos+12)>0);ihdr=true;}
        else garantir(tipo!=='IHDR');
        if(tipo==='IDAT')dados.push(b.subarray(pos+8,pos+8+n));
        pos+=n+12;
        if(tipo==='IEND'){garantir(n===0&&pos===b.length);fim=true;break;}
    }
    garantir(ihdr&&fim&&dados.length);garantir(inflateSync(Buffer.concat(dados),{maxOutputLength:limite}).length>0);
}

function jpeg(b) {
    garantir(b.length>12&&b.readUInt16BE(0)===0xffd8&&b.readUInt16BE(b.length-2)===0xffd9);
    let p=2,quadro=false;
    while(p+3<b.length){
        garantir(b[p++]===255);while(b[p]===255)p++;const tipo=b[p++];
        if(tipo===0xd9)break;
        const n=b.readUInt16BE(p);garantir(n>=2&&p+n<=b.length);
        if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(tipo)){garantir(n>=8&&b.readUInt16BE(p+3)>0&&b.readUInt16BE(p+5)>0);quadro=true;}
        if(tipo===0xda){garantir(quadro&&n>=6&&p+n<b.length-2);return;}
        p+=n;
    }
    garantir(false);
}

function docx(b,limite) {
    let e=-1;for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(b.readUInt32LE(p)===0x06054b50&&p+22+b.readUInt16LE(p+20)===b.length){e=p;break;}
    garantir(e>=0&&b.readUInt16LE(e+4)===0&&b.readUInt16LE(e+6)===0);
    const qtd=b.readUInt16LE(e+10),tam=b.readUInt32LE(e+12),inicio=b.readUInt32LE(e+16);
    garantir(qtd>0&&qtd<=1024&&qtd===b.readUInt16LE(e+8)&&inicio+tam===e);
    let pos=inicio,total=0;const membros=new Map(),intervalos=[];
    for(let i=0;i<qtd;i++){
        garantir(pos+46<=e&&b.readUInt32LE(pos)===0x02014b50);
        const flags=b.readUInt16LE(pos+8),metodo=b.readUInt16LE(pos+10),crc=b.readUInt32LE(pos+16),compacto=b.readUInt32LE(pos+20),expandido=b.readUInt32LE(pos+24),n=b.readUInt16LE(pos+28),extra=b.readUInt16LE(pos+30),coment=b.readUInt16LE(pos+32),local=b.readUInt32LE(pos+42);
        garantir(!(flags&1)&&[0,8].includes(metodo)&&pos+46+n+extra+coment<=e&&total+expandido<=limite);
        const nome=b.toString('utf8',pos+46,pos+46+n);garantir(nome&&!nome.startsWith('/')&&!/[\\:\x00]/.test(nome)&&!nome.split('/').some(p=>p==='..'||p==='.')&&!membros.has(nome));
        garantir(local+30<=inicio&&b.readUInt32LE(local)===0x04034b50&&b.readUInt16LE(local+8)===metodo&&b.readUInt16LE(local+6)===flags);
        const ln=b.readUInt16LE(local+26),le=b.readUInt16LE(local+28),de=local+30+ln+le;
        garantir(de+compacto<=inicio&&b.toString('utf8',local+30,local+30+ln)===nome);
        garantir(!intervalos.some(([a,z])=>local<z&&de+compacto>a));intervalos.push([local,de+compacto]);
        const payload=b.subarray(de,de+compacto),valor=metodo===0?payload:inflateRawSync(payload,{maxOutputLength:Math.min(limite,expandido+1)});
        garantir(valor.length===expandido&&crc32(valor)===crc);total+=valor.length;membros.set(nome,valor);pos+=46+n+extra+coment;
    }
    garantir(pos===e);
    const xml=nome=>{const v=membros.get(nome);garantir(v);const t=new TextDecoder('utf-8',{fatal:true}).decode(v);garantir(!/<!DOCTYPE|<!ENTITY/i.test(t));return t;};
    const tipos=xml('[Content_Types].xml'),documento=xml('word/document.xml'),rels=xml('_rels/.rels');
    garantir(tipos.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')&&/PartName\s*=\s*["']\/word\/document.xml["']/.test(tipos));
    garantir(/Target\s*=\s*["']\/?word\/document.xml["']/.test(rels)&&rels.includes('/officeDocument'));
    garantir(/<(?:[\w.-]+:)?document(?:\s|>)/.test(documento)&&documento.includes('wordprocessingml'));
}

function doc(b) {
    garantir(b.length>=512&&b.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex'))&&b.readUInt16LE(28)===0xfffe);
    const shift=b.readUInt16LE(30),setor=2**shift;garantir([9,12].includes(shift)&&b.length%setor===0&&b.readUInt16LE(32)===6);
    const setores=b.length/setor-1,obter=i=>{garantir(i<setores);return b.subarray((i+1)*setor,(i+2)*setor);};
    const fatIds=[];for(let p=76;p<512;p+=4){const i=b.readUInt32LE(p);if(i!==0xffffffff)fatIds.push(i);}
    let dif=b.readUInt32LE(68);const vistos=new Set();
    for(let n=0;n<b.readUInt32LE(72);n++){garantir(!vistos.has(dif));vistos.add(dif);const s=obter(dif);for(let p=0;p<setor-4;p+=4)if(s.readUInt32LE(p)!==0xffffffff)fatIds.push(s.readUInt32LE(p));dif=s.readUInt32LE(setor-4);}
    garantir(fatIds.length===b.readUInt32LE(44)&&fatIds.length<=setores);const fat=Buffer.concat(fatIds.map(obter));
    const cadeia=(inicio,tabela,bloco,max)=>{const lista=[],usados=new Set();let i=inicio;while(i!==0xfffffffe){garantir(!usados.has(i)&&i*4+4<=tabela.length&&lista.length<max);usados.add(i);lista.push(bloco(i));i=tabela.readUInt32LE(i*4);}return Buffer.concat(lista);};
    const diretorio=cadeia(b.readUInt32LE(48),fat,obter,setores);let word,root;
    for(let p=0;p+128<=diretorio.length;p+=128){const n=diretorio.readUInt16LE(p+64);if(n<2||n>64)continue;const nome=diretorio.toString('utf16le',p,p+n-2),tipo=diretorio[p+66],tamanho=diretorio.readBigUInt64LE(p+120);garantir(tamanho<=BigInt(b.length));const entrada={inicio:diretorio.readUInt32LE(p+116),tamanho:Number(tamanho)};if(nome==='WordDocument'&&tipo===2)word=entrada;if(tipo===5)root=entrada;}
    garantir(word&&word.tamanho>=32&&root);
    let stream;
    if(word.tamanho>=b.readUInt32LE(56))stream=cadeia(word.inicio,fat,obter,setores);
    else {const miniFat=cadeia(b.readUInt32LE(60),fat,obter,setores),miniRoot=cadeia(root.inicio,fat,obter,setores).subarray(0,root.tamanho);stream=cadeia(word.inicio,miniFat,i=>{garantir(i*64+64<=miniRoot.length);return miniRoot.subarray(i*64,i*64+64);},Math.ceil(b.length/64));}
    garantir(stream.length>=word.tamanho&&stream.readUInt16LE(0)===0xa5ec);
}

export async function validarConteudoDocumento(file,limites) {
    const ext=extensaoDocumento(file.originalname);
    const st=await fs.promises.stat(file.path);if(st.size>limites.arquivo)throw new ErroHttp(413,'Arquivo excede o limite permitido.');
    const b=await fs.promises.readFile(file.path);
    try {
        if(ext==='.pdf')garantir(/^%PDF-[12]\.\d/.test(b.subarray(0,8).toString('ascii'))&&/%%EOF\s*$/.test(b.subarray(-1024).toString('latin1')));
        else if(ext==='.png')png(b,limites.expandido);
        else if(ext==='.jpg'||ext==='.jpeg')jpeg(b);
        else if(ext==='.docx')docx(b,limites.expandido);
        else doc(b);
    } catch {throw new ErroHttp(415,'Conteudo do arquivo incompativel com o formato informado.');}
}
