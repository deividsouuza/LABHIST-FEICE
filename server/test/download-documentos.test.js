import assert from 'node:assert/strict';
import { before, beforeEach, after, describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { abrirArquivoDocumento, nomeDownload } from '../arquivos-documentos.js';
import { iniciarMysqlTemporario, mysqlDisponivel } from './helpers/mysql-temporario.js';
import { carregarAplicacaoIsolada, contas, senhaFixture } from './helpers/aplicacao.js';
import { executarMigracoes } from '../banco/migrador.js';

async function apagarFixture(raiz,prefixo){const alvo=path.resolve(raiz);assert.equal(path.dirname(alvo),path.resolve(tmpdir()));assert.ok(path.basename(alvo).startsWith(prefixo));await fs.rm(alvo,{recursive:true,force:true});}

describe('P08: confinamento de arquivos e descritores', {concurrency:1},()=>{
    let raiz,pasta,fora;
    before(async()=>{raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p08-path-'));pasta=path.join(raiz,'documentos');await fs.mkdir(pasta);await fs.writeFile(path.join(pasta,'fixture.pdf'),'permitido');fora=path.join(raiz,'fora.pdf');await fs.writeFile(fora,'fora-nao-ler');});
    after(async()=>{if(raiz)await apagarFixture(raiz,'labhist-p08-path-');});
    for(const caminho of ['../fora.pdf','uploads/documentos/../fora.pdf','uploads/documentos/sub/arquivo.pdf','uploads\\documentos\\..\\fora.pdf','uploads/documentos/fixture.pdf:fluxo','uploads/documentos/NUL.pdf','uploads/documentos/CON','uploads/documentos/fixture.pdf.','uploads/documentos/fixture.pdf ','uploads/documentos/a\0.pdf','uploads/documentos/..','https://externo.test/arquivo.pdf']){
        it(`recusa caminho inseguro sem iniciar acesso ao disco: ${JSON.stringify(caminho)}`,async()=>{
            let acessos=0;await assert.rejects(abrirArquivoDocumento(pasta,caminho,{async lstat(){acessos++;throw new Error('nao deve acessar')}}),e=>e.status===404);assert.equal(acessos,0);
        });
    }
    it('absoluto externo e recusado sem abrir arquivo',async()=>{let aberto=false;await assert.rejects(abrirArquivoDocumento(pasta,fora,{...fs,async open(){aberto=true;throw new Error('nao abrir')}}),e=>e.status===404);assert.equal(aberto,false);});
    it('arquivo regular relativo/absoluto interno abre e fecha sem reconstruir caminho no stream',async()=>{
        for(const caminho of ['uploads/documentos/fixture.pdf',path.join(pasta,'fixture.pdf')]){const a=await abrirArquivoDocumento(pasta,caminho);try{assert.equal(await a.handle.readFile('utf8'),'permitido');assert.equal(a.tamanho,9n);}finally{await a.handle.close();}}
    });
    it('link simbolico simulado no lstat e recusado antes de open',async()=>{
        let abriu=false;const lstat=async(c,...a)=>c===path.join(pasta,'fixture.pdf')?{isFile:()=>true,isSymbolicLink:()=>true}:fs.lstat(c,...a);
        await assert.rejects(abrirArquivoDocumento(pasta,'uploads/documentos/fixture.pdf',{...fs,lstat,async open(){abriu=true;throw Error('nao abrir')}}),e=>e.status===404);assert.equal(abriu,false);
    });
    it('junction de diretorio real nao serve como raiz permitida',async()=>{
        const junction=path.join(raiz,'junction');await fs.symlink(pasta,junction,process.platform==='win32'?'junction':'dir');
        await assert.rejects(abrirArquivoDocumento(junction,'uploads/documentos/fixture.pdf'),e=>e.status===404);
    });
    it('troca entre verificacao e open fecha descritor diferente antes de ler bytes',async()=>{
        let fechado=false,leu=false;
        const open=async()=>{const h=await fs.open(fora,'r');return {stat:o=>h.stat(o),async close(){fechado=true;await h.close()},async readFile(){leu=true;return h.readFile()},createReadStream(){leu=true;return h.createReadStream()}};};
        await assert.rejects(abrirArquivoDocumento(pasta,'uploads/documentos/fixture.pdf',{...fs,open}),e=>e.status===404);assert.ok(fechado);assert.equal(leu,false);
    });
    it('arquivo ausente tem mensagem generica sem caminho',async()=>{await assert.rejects(abrirArquivoDocumento(pasta,'uploads/documentos/ausente.pdf'),e=>e.status===404&&!e.message.includes(raiz));});
    it('nome de download conserva acentos e elimina separadores/controles',()=>{assert.equal(nomeDownload('Relatório ç.pdf'),'Relatório ç.pdf');assert.equal(/[\r\n/\\]/.test(nomeDownload('../../Relatório\r\nX-Test: 1.pdf')),false);assert.equal(nomeDownload('...'),'documento');});
});

describe('P08: HTTP/MySQL/arquivos reais descartaveis', {skip:!mysqlDisponivel,concurrency:1},()=>{
    let raiz,instancia,banco,pool,app,servidor,origem;const cookies={};const conteudo='%PDF-conteudo reservado da fixture';
    const papeis=[['administrador',1,null],['professor',141,41],['aluno',142,42],['outro-professor',143,43],['outro-aluno',144,44]];
    const baixar=(id,papel='administrador',extra='')=>fetch(origem+`/documentos/${id}/download`+extra,{headers:cookies[papel]?{Cookie:cookies[papel]}:{}});
    async function fechados(){for(let i=0;i<50;i++){if(app.arquivosAbertos.every(h=>h.fd===-1))return;await new Promise(r=>setTimeout(r,20));}assert.fail('Descritor ficou aberto.');}
    before(async()=>{
        raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p08-uploads-'));instancia=await iniciarMysqlTemporario('p08');banco=instancia.banco;await executarMigracoes(banco);pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:4});
        await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Prof A'),(42,'Prof com ID igual'),(43,'Prof B')");await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno A'),(44,'Aluno B')");
        for(const [papel,id,pessoa] of papeis){const perfil=papel.replace('outro-','');await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[id,'fixture-'+papel,contas[0].senha,perfil]);if(pessoa)await banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${perfil}_id) VALUES (?,?,?)`,[id,perfil,pessoa]);}
        await banco.query("INSERT INTO projeto (id,titulo) VALUES (51,'Projeto A'),(52,'Projeto B')");
        await banco.query(`INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil,autoria_confirmada) VALUES
            (61,51,'Proprio','Relatório ç.pdf','uploads/documentos/fixture.pdf',42,'aluno',1),
            (62,51,'Outro aluno','outro.pdf','uploads/documentos/fixture.pdf',44,'aluno',1),
            (63,51,'Colisao perfil','prof.pdf','uploads/documentos/fixture.pdf',42,'professor',1),
            (64,51,'Legado ambiguo','legado.pdf','uploads/documentos/fixture.pdf',42,'aluno',0),
            (65,52,'Outro projeto','externo.pdf','uploads/documentos/fixture.pdf',44,'aluno',1),
            (66,51,'Administrador','admin.pdf','uploads/documentos/fixture.pdf',1,'administrador',1),
            (67,51,'Sem perfil','sem.pdf','uploads/documentos/fixture.pdf',42,null,0)`);
        // Autores definidos explicitamente pela criação destas fixtures novas; legados 64/67 ficam NULL.
        for(const [id,conta,perfil] of [[61,142,'aluno'],[62,144,'aluno'],[63,141,'professor'],[65,144,'aluno'],[66,1,'administrador']])await banco.query('UPDATE documentos SET autor_conta_id=?,autor_nome=?,autor_perfil=? WHERE id=?',[conta,'Autor fixture '+conta,perfil,id]);
        app=await carregarAplicacaoIsolada({diretorioUploads:raiz});app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        for(const [papel] of papeis){const res=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-'+papel,senha:senhaFixture})});assert.equal(res.status,200);cookies[papel]=res.headers.getSetCookie()[0].split(';')[0];}
    });
    beforeEach(async()=>{
        await fechados();app.leituras.length=0;app.arquivosAbertos.length=0;
        await banco.query('DELETE FROM projeto_aluno');await banco.query('DELETE FROM projeto_professor');await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42),(51,44),(52,44)');await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41),(52,43)');
        await banco.query("UPDATE documentos SET arquivo_caminho='uploads/documentos/fixture.pdf' WHERE id=61");await banco.query('UPDATE documentos SET arquivo_nome=? WHERE id=61',['Relatório ç.pdf']);
        await fs.writeFile(path.join(raiz,'documentos','fixture.pdf'),conteudo);await fs.writeFile(path.join(raiz,'fora.pdf'),'conteudo externo nao permitido');
    });
    after(async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();if(instancia)await instancia.encerrar();if(raiz)await apagarFixture(raiz,'labhist-p08-uploads-');});
    it('autor aluno baixa bytes corretos com nome acentuado, attachment e no-store',async()=>{
        const res=await baixar(61,'aluno');assert.equal(res.status,200);assert.equal(await res.text(),conteudo);assert.ok(res.headers.get('content-disposition').startsWith('attachment;'));assert.ok(res.headers.get('content-disposition').includes('filename*=UTF-8'));assert.ok(res.headers.get('content-disposition').includes('Relat%C3%B3rio'));assert.equal(res.headers.get('x-content-type-options'),'nosniff');assert.equal(res.headers.get('cache-control'),'private, no-store');assert.equal(res.headers.get('content-type'),'application/octet-stream');await fechados();
    });
    it('professor responsavel baixa inclusive legado incerto; administrador mantem acesso global',async()=>{for(const [id,papel] of [[61,'professor'],[64,'professor'],[65,'administrador']]){const r=await baixar(id,papel);assert.equal(r.status,200);assert.equal(await r.text(),conteudo);}await fechados();});
    for(const [nome,id,papel] of [['anonimo',61,''],['outro aluno do mesmo projeto',61,'outro-aluno'],['professor nao vinculado',61,'outro-professor'],['aluno em outro projeto',65,'aluno'],['colisao de IDs entre perfis',63,'aluno'],['legado com ID coincidente',64,'aluno'],['legado sem perfil',67,'aluno'],['administrador com ID de outro perfil',66,'aluno']]){
        it(`nega ${nome} antes de acessar arquivos`,async()=>{const r=await baixar(id,papel,'?perfil=administrador&usuario_id=1');assert.equal(r.status,papel?403:401);assert.equal((await r.text()).includes(conteudo),false);assert.equal(app.leituras.length,0);});
    }
    it('aluno que tambem participa baixa seu proprio envio',async()=>{const res=await baixar(62,'outro-aluno');assert.equal(res.status,200);assert.equal(await res.text(),conteudo);});
    it('URLs estaticas antigas e staging nao entregam arquivos mesmo com sessao',async()=>{
        for(const url of ['/uploads/documentos/fixture.pdf','/uploads/.temporarios/fixture.pdf'])for(const papel of ['', 'administrador']){const r=await fetch(origem+url,{headers:cookies[papel]?{Cookie:cookies[papel]}:{}});assert.equal(r.status,404);assert.equal((await r.text()).includes(conteudo),false);}assert.equal(app.leituras.length,0);
    });
    it('metadados retornam somente link por ID, sem caminho fisico',async()=>{const r=await fetch(origem+'/documentos?projeto_id=51',{headers:{Cookie:cookies.aluno}});assert.equal(r.status,200);const data=await r.json();assert.deepEqual(data.map(d=>d.id),[61]);assert.equal(data[0].download_url,'/documentos/61/download');assert.equal('arquivo_caminho' in data[0],false);assert.equal(JSON.stringify(data).includes(raiz),false);});
    it('documento ausente e ID invalido nao iniciam acesso a arquivos',async()=>{for(const [id,status] of [[999,404],['abc',400],[0,400]])assert.equal((await baixar(id,'aluno')).status,status);assert.equal(app.leituras.length,0);});
    it('arquivo ausente retorna 404 generico sem caminho ou detalhes SQL',async()=>{await banco.query("UPDATE documentos SET arquivo_caminho='uploads/documentos/ausente.pdf' WHERE id=61");const r=await baixar(61,'aluno');assert.equal(r.status,404);const t=await r.text();assert.equal(t.includes(raiz),false);assert.equal(t.includes('ausente.pdf'),false);});
    for(const caminho of ['uploads/documentos/../fora.pdf','../fora.pdf','uploads\\documentos\\..\\fora.pdf','uploads/documentos/fixture.pdf:fluxo'])it(`registro malicioso recusado: ${caminho}`,async()=>{await banco.query('UPDATE documentos SET arquivo_caminho=? WHERE id=61',[caminho]);const r=await baixar(61,'aluno');assert.equal(r.status,404);assert.equal((await r.text()).includes('conteudo externo'),false);});
    it('absoluto externo recusado; absoluto interno legado pode ser baixado',async()=>{await banco.query('UPDATE documentos SET arquivo_caminho=? WHERE id=61',[path.join(raiz,'fora.pdf')]);assert.equal((await baixar(61,'aluno')).status,404);await banco.query('UPDATE documentos SET arquivo_caminho=? WHERE id=61',[path.join(raiz,'documentos','fixture.pdf')]);const r=await baixar(61,'aluno');assert.equal(r.status,200);assert.equal(await r.text(),conteudo);});
    it('nome original malicioso nao injeta headers',async()=>{await banco.query('UPDATE documentos SET arquivo_nome=? WHERE id=61',['../Relatório\r\nX-Bad: 1.pdf']);const r=await baixar(61,'aluno');assert.equal(r.status,200);assert.equal(r.headers.get('x-bad'),null);assert.equal(/[\r\n]/.test(r.headers.get('content-disposition')),false);await r.arrayBuffer();});
    it('retirar participacao revoga download imediatamente',async()=>{await banco.query('DELETE FROM projeto_aluno WHERE projeto_id=51 AND aluno_id=42');assert.equal((await baixar(61,'aluno')).status,403);assert.equal(app.leituras.length,0);});
    it('cliente que interrompe download nao deixa descritor aberto',async()=>{
        await fs.writeFile(path.join(raiz,'documentos','fixture.pdf'),Buffer.alloc(8*1024*1024,65));const controle=new AbortController();const r=await fetch(origem+'/documentos/61/download',{headers:{Cookie:cookies.aluno},signal:controle.signal});assert.equal(r.status,200);const leitor=r.body.getReader();await leitor.read();controle.abort();await leitor.cancel().catch(()=>{});await fechados();
    });
    it('logout invalida download com cookie antigo',async()=>{const r=await fetch(origem+'/logout',{method:'POST',headers:{Cookie:cookies.aluno}});assert.equal(r.status,200);assert.equal((await baixar(61,'aluno')).status,401);assert.equal(app.leituras.length,0);});
});
