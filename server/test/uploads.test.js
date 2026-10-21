import assert from 'node:assert/strict';
import { before, beforeEach, after, describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import http from 'node:http';
import { limitesUpload,validarConteudoDocumento,extensaoDocumento } from '../upload-documentos.js';
import { formatos,entradasDocx,zip,cfbDoc,pdf } from './helpers/fixtures-documentos.js';
import { carregarAplicacaoIsolada,criarBancoSimulado,senhaFixture } from './helpers/aplicacao.js';

async function limpar(raiz){assert.equal(path.dirname(path.resolve(raiz)),path.resolve(tmpdir()));assert.ok(path.basename(raiz).startsWith('labhist-p16-'));await fs.rm(raiz,{recursive:true,force:true});}
describe('P16: formatos e configuracao operacional',()=>{
    let raiz;before(async()=>{raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p16-content-'));});after(async()=>{if(raiz)await limpar(raiz);});
    async function validar(ext,bytes,config={}){const arquivo=path.join(raiz,'fixture.'+ext);await fs.writeFile(arquivo,bytes);return validarConteudoDocumento({path:arquivo,originalname:'fixture.'+ext},limitesUpload(config));}
    for(const [ext,bytes] of Object.entries(formatos)){
        it(`aceita estrutura compativel ${ext}`,async()=>{await validar(ext,bytes);});
        it(`recusa HTML renomeado para ${ext}`,async()=>{await assert.rejects(validar(ext,Buffer.from('<html>nao e documento</html>')),e=>e.status===415);});
    }
    it('DOC suporta mini-stream e rejeita OLE sem WordDocument',async()=>{await validar('doc',cfbDoc(true));const falso=cfbDoc();falso.write('ExcelDocument',1152,'utf16le');await assert.rejects(validar('doc',falso),e=>e.status===415);});
    it('DOCX rejeita ZIP generico, CRC adulterado e expansao excessiva',async()=>{
        await assert.rejects(validar('docx',zip({'word.txt':'nao Word'})),e=>e.status===415);
        const falso=Buffer.from(formatos.docx);falso[45]^=1;await assert.rejects(validar('docx',falso),e=>e.status===415);
        await assert.rejects(validar('docx',zip({...entradasDocx,'grande.txt':'x'.repeat(10000)},true),{UPLOAD_EXPANDED_MAX_BYTES:'1024'}),e=>e.status===415);
    });
    it('DOCX recusa traversal e PNG adulterado',async()=>{await assert.rejects(validar('docx',zip({...entradasDocx,'../fora':'x'})),e=>e.status===415);const falso=Buffer.from(formatos.png);falso[20]^=1;await assert.rejects(validar('png',falso),e=>e.status===415);});
    it('extensao dupla ativa recusada; nome com versao preservado',()=>{for(const n of ['arquivo.exe.pdf','arquivo.pdf.exe'])assert.throws(()=>extensaoDocumento(n),e=>e.status===400);assert.equal(extensaoDocumento('relatorio.v2.PDF'),'.pdf');});
    it('limites invalidos falham sem expor valores',()=>{for(const campo of ['UPLOAD_MAX_BYTES','UPLOAD_MAX_FIELDS','UPLOAD_MULTIPART_MAX_BYTES','UPLOAD_FIELD_MAX_BYTES','UPLOAD_EXPANDED_MAX_BYTES'])assert.throws(()=>limitesUpload({[campo]:'segredo-invalido'}),e=>e.message.includes(campo)&&!e.message.includes('segredo-invalido'));});
});

describe('P16: multipart/arquivos reais, HTTP real e SQL simulado',{concurrency:1},()=>{
    let raiz,app,banco,servidor,origem,cookie;
    const env={UPLOAD_MAX_BYTES:'8192',UPLOAD_MAX_FIELDS:'4',UPLOAD_FIELD_MAX_BYTES:'1024',UPLOAD_MULTIPART_MAX_BYTES:'10000'};
    function form(ext='pdf',bytes=pdf,descricao=' Relatorio ',nome='Relatório ç.'+ext){const f=new FormData();f.append('projeto_id','51');f.append('descricao',descricao);f.append('arquivo',new Blob([bytes],{type:'application/falso'}),nome);return f;}
    const request=f=>fetch(origem+'/projetos/51/documentos',{method:'POST',headers:{Cookie:cookie},body:f});
    async function arquivos(){return [...await fs.readdir(path.join(raiz,'documentos')),...await fs.readdir(path.join(raiz,'.temporarios'))];}
    async function vazio(){for(let i=0;i<100;i++){if(!(await arquivos()).length)return;await new Promise(r=>setTimeout(r,20));}assert.deepEqual(await arquivos(),[]);}
    before(async()=>{raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p16-http-'));app=await carregarAplicacaoIsolada({diretorioUploads:raiz,uploadEnv:env});banco=criarBancoSimulado();app.configurarBancoDeTeste(banco);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;const r=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-admin',senha:senhaFixture})});assert.equal(r.status,200);cookie=r.headers.getSetCookie()[0].split(';')[0];});
    beforeEach(async()=>{banco=criarBancoSimulado();app.configurarBancoDeTeste(banco);for(const pasta of ['documentos','.temporarios'])for(const f of await fs.readdir(path.join(raiz,pasta)))await fs.rm(path.join(raiz,pasta,f));});
    after(async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(raiz)await limpar(raiz);});
    for(const [ext,bytes] of Object.entries(formatos))it(`persiste ${ext}, UUID e nome original Unicode, sem confiar em MIME`,async()=>{
        const r=await request(form(ext,bytes));assert.equal(r.status,200,await r.clone().text());assert.equal((await fs.readdir(path.join(raiz,'.temporarios'))).length,0);assert.match((await arquivos())[0],new RegExp('^[a-f0-9-]{36}\\.'+ext+'$'));const insert=banco.chamadas.find(c=>c.sql?.startsWith('INSERT INTO documentos'));assert.equal(insert.parametros[1],'Relatorio');assert.equal(insert.parametros[3],'Relatório ç.'+ext);
    });
    for(const descricao of ['   ','a'.repeat(256)])it(`recusa descricao invalida (${descricao.length}) sem orfao`,async()=>{assert.equal((await request(form('pdf',pdf,descricao))).status,400);await vazio();});
    it('campo objeto ou repetido recusado e temporario limpo',async()=>{for(const campo of ['descricao[x]','descricao']){const f=form();f.append(campo,'objeto');const r=await request(f);assert.equal(r.status,400);await vazio();}});
    it('tipo falso retorna415 e limpa disco',async()=>{assert.equal((await request(form('pdf',Buffer.from('<script>falso</script>')))).status,415);await vazio();});
    it('arquivo excessivo retorna413 sem orfao',async()=>{assert.equal((await request(form('pdf',Buffer.alloc(8193,65)))).status,413);await vazio();});
    it('campos multipart excessivos retornam413 e limpam disco',async()=>{const f=form();for(let i=0;i<5;i++)f.append('extra'+i,'valor');assert.equal((await request(f)).status,413);await vazio();});
    it('limite total tambem funciona sem Content-Length',async()=>{
        const status=await new Promise((resolve,reject)=>{const req=http.request(origem+'/projetos/51/documentos',{method:'POST',headers:{Cookie:cookie,'Content-Type':'multipart/form-data; boundary=fixture'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.write('x'.repeat(11000));req.end();});assert.equal(status,413);await vazio();
    });
    it('projeto proibido e recusado antes de criar arquivo',async()=>{const q=banco.query.bind(banco);banco.query=(sql,p)=>sql==='SELECT id FROM projeto WHERE id = ? FOR SHARE'?Promise.resolve([[]]):q(sql,p);assert.equal((await request(form())).status,404);await vazio();});
    it('erro SQL apos validacao reverte e remove arquivo',async()=>{const q=banco.query.bind(banco);banco.query=(sql,p)=>sql.startsWith('INSERT INTO documentos')?Promise.reject(new Error('fixture SQL')):q(sql,p);assert.equal((await request(form())).status,500);await vazio();});
    it('nome original escapavel nao determina caminho em disco',async()=>{const r=await request(form('pdf',pdf,'Relatorio','<relatorio>.pdf'));assert.equal(r.status,200);assert.match((await arquivos())[0],/^[a-f0-9-]{36}\.pdf$/);});
});
