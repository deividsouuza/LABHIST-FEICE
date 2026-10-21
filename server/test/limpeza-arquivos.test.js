import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import mysql from 'mysql2/promise';
import { iniciarMysqlTemporario,mysqlDisponivel } from './helpers/mysql-temporario.js';
import { carregarAplicacaoIsolada,contas,senhaFixture } from './helpers/aplicacao.js';
import { executarMigracoes } from '../banco/migrador.js';
import { removerDocumentoConfinado } from '../arquivos-documentos.js';

describe('P17: exclusao/fila/arquivos em MySQL descartavel real',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let instancia,banco,pool,raiz,app,servidor,origem,negar=false;const cookies={};
    async function request(method,url,body,papel='administrador'){
        const r=await fetch(origem+url,{method,headers:{...(cookies[papel]?{Cookie:cookies[papel]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};
    }
    const existe=async nome=>{try{await fs.stat(path.join(raiz,'documentos',nome));return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
    before(async()=>{
        raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p17-files-'));instancia=await iniciarMysqlTemporario('p17');banco=instancia.banco;await executarMigracoes(banco);pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:4});
        await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno')");await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Professor')");
        for(const conta of contas.slice(0,3)){await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[conta.id,conta.usuario,conta.senha,conta.perfil]);if(conta.perfil!=='administrador')await banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${conta.perfil}_id) VALUES (?,?,?)`,[conta.id,conta.perfil,conta.id]);}
        app=await carregarAplicacaoIsolada({diretorioUploads:raiz,removerArquivo:(p,c)=>removerDocumentoConfinado(p,c,negar?{...fs,async unlink(){throw Object.assign(new Error('fixture'),{code:'EACCES'});}}:fs)});app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        for(const c of contas.slice(0,3)){const r=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:c.usuario,senha:senhaFixture})});assert.equal(r.status,200);cookies[c.perfil]=r.headers.getSetCookie()[0].split(';')[0];}
    });
    beforeEach(async()=>{
        negar=false;app.configurarBancoDeTeste(pool);await banco.query('DROP TRIGGER IF EXISTS fixture_p17_falha');
        for(const t of ['limpeza_arquivos','documentos','projeto_aluno','projeto_professor','projeto'])await banco.query(`DELETE FROM ${t}`);
        await banco.query("INSERT INTO projeto (id,titulo) VALUES (51,'Remover'),(52,'Preservar')");await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42)');await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');
        await banco.query("INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil) VALUES (61,51,'A','a.pdf','uploads/documentos/a.pdf',42,'aluno'),(62,51,'B','b.pdf','uploads/documentos/b.pdf',42,'aluno')");
        for(const n of ['a.pdf','b.pdf'])await fs.writeFile(path.join(raiz,'documentos',n),'fixture preservavel');await fs.writeFile(path.join(raiz,'fora.pdf'),'externo preservar');
    });
    after(async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();if(instancia)await instancia.encerrar();if(raiz){assert.equal(path.dirname(path.resolve(raiz)),path.resolve(tmpdir()));assert.ok(path.basename(raiz).startsWith('labhist-p17-'));await fs.rm(raiz,{recursive:true,force:true});}});
    it('remove projeto com multiplos documentos depois de commit e registra conclusao',async()=>{
        const r=await request('DELETE','/projetos/51');assert.equal(r.status,200);assert.equal(r.data.limpeza.concluidas,2);assert.equal(await existe('a.pdf'),false);assert.equal(await existe('b.pdf'),false);
        assert.equal((await banco.query('SELECT * FROM projeto WHERE id=51'))[0].length,0);assert.equal((await banco.query('SELECT * FROM documentos WHERE projeto_id=51'))[0].length,0);assert.equal((await banco.query("SELECT * FROM limpeza_arquivos WHERE estado='concluido'"))[0].length,2);
    });
    it('rollback SQL preserva arquivos, projeto, documentos e nao publica jobs',async()=>{
        await banco.query("CREATE TRIGGER fixture_p17_falha BEFORE DELETE ON projeto FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");assert.equal((await request('DELETE','/projetos/51')).status,500);assert.ok(await existe('a.pdf'));assert.ok(await existe('b.pdf'));assert.equal((await banco.query('SELECT * FROM documentos WHERE projeto_id=51'))[0].length,2);assert.equal((await banco.query('SELECT * FROM limpeza_arquivos'))[0].length,0);
    });
    it('unlink negado gera202, diagnostico sem paths e repeticao idempotente',async()=>{
        negar=true;const r=await request('DELETE','/projetos/51');assert.equal(r.status,202);assert.equal(r.data.limpeza.pendentes,2);assert.ok(await existe('a.pdf'));
        const lista=await request('GET','/limpezas/arquivos');assert.equal(lista.status,200);assert.equal(lista.data.length,2);assert.ok(lista.data.every(j=>j.erro_codigo==='ACESSO_NEGADO'&&j.tentativas===1&&!('caminho' in j)));const ids=lista.data.map(j=>j.id);
        negar=false;assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids})).status,200);assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids})).status,200);assert.equal(await existe('a.pdf'),false);assert.deepEqual((await request('GET','/limpezas/arquivos')).data,[]);
    });
    it('path externo fica bloqueado e bytes externos nao sao alterados',async()=>{
        await banco.query('UPDATE documentos SET arquivo_caminho=? WHERE id=61',[path.join(raiz,'fora.pdf')]);const r=await request('DELETE','/projetos/51');assert.equal(r.status,202);assert.equal(r.data.limpeza.bloqueadas,1);assert.equal(await fs.readFile(path.join(raiz,'fora.pdf'),'utf8'),'externo preservar');const l=await request('GET','/limpezas/arquivos');assert.equal(l.data[0].erro_codigo,'CAMINHO_INVALIDO');assert.equal(JSON.stringify(l.data).includes(raiz),false);
    });
    it('arquivo ja ausente conclui sem falha nem remocao externa',async()=>{await fs.rm(path.join(raiz,'documentos','a.pdf'));const r=await request('DELETE','/projetos/51');assert.equal(r.status,200);assert.equal((await banco.query("SELECT * FROM limpeza_arquivos WHERE erro_codigo='JA_AUSENTE'"))[0].length,1);});
    it('arquivo compartilhado com outro projeto permanece ate ultima referencia',async()=>{
        await banco.query("INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por) VALUES (65,52,'Outro','a.pdf','uploads/documentos/a.pdf',42)");
        assert.equal((await request('DELETE','/projetos/51')).status,202);assert.ok(await existe('a.pdf'));assert.equal((await banco.query('SELECT * FROM projeto WHERE id=52'))[0].length,1);
        assert.equal((await request('DELETE','/projetos/52')).status,200);assert.equal(await existe('a.pdf'),false);const jobs=(await request('GET','/limpezas/arquivos')).data;assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids:jobs.map(j=>j.id)})).status,200);
    });
    it('resposta perdida de COMMIT nao remove arquivos; jobs sobrevivem para retomada',async()=>{
        let primeiro=true;app.configurarBancoDeTeste({query:(...a)=>pool.query(...a),getConnection:async()=>{const c=await pool.getConnection();return {query:(...a)=>c.query(...a),beginTransaction:()=>c.beginTransaction(),rollback:()=>c.rollback(),release:()=>c.release(),destroy:()=>c.destroy(),async commit(){await c.commit();if(primeiro){primeiro=false;throw Error('fixture resposta perdida');}}};}});
        assert.equal((await request('DELETE','/projetos/51')).status,500);assert.ok(await existe('a.pdf'));assert.equal((await banco.query('SELECT * FROM projeto WHERE id=51'))[0].length,0);const ids=(await banco.query('SELECT id FROM limpeza_arquivos'))[0].map(j=>j.id);app.configurarBancoDeTeste(pool);assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids})).status,200);assert.equal(await existe('a.pdf'),false);
    });
    it('falha na atualizacao do job apos unlink permite repetir com arquivo ausente',async()=>{
        let falhar=true;app.configurarBancoDeTeste({query:(...a)=>pool.query(...a),getConnection:async()=>{const c=await pool.getConnection();return {query(sql,...a){if(falhar&&sql.startsWith('UPDATE limpeza_arquivos')){falhar=false;throw Error('fixture atualizar job');}return c.query(sql,...a)},beginTransaction:()=>c.beginTransaction(),commit:()=>c.commit(),rollback:()=>c.rollback(),release:()=>c.release(),destroy:()=>c.destroy()};}});
        assert.equal((await request('DELETE','/projetos/51')).status,202);const ids=(await banco.query('SELECT id FROM limpeza_arquivos'))[0].map(j=>j.id);app.configurarBancoDeTeste(pool);assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids})).status,200);assert.equal(await existe('a.pdf'),false);
    });
    it('documento individual tambem usa fila e preserva projeto/irmao',async()=>{const r=await request('DELETE','/documentos/61');assert.equal(r.status,200);assert.equal(await existe('a.pdf'),false);assert.ok(await existe('b.pdf'));assert.equal((await banco.query('SELECT * FROM projeto WHERE id=51'))[0].length,1);assert.equal((await banco.query('SELECT * FROM documentos WHERE id=62'))[0].length,1);});
    it('negacoes e IDs invalidos nao alteram fila nem bytes',async()=>{
        for(const papel of ['','aluno','professor']){assert.equal((await request('DELETE','/projetos/51',undefined,papel)).status,papel?403:401);assert.equal((await request('GET','/limpezas/arquivos',undefined,papel)).status,papel?403:401);assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids:[1]},papel)).status,papel?403:401);}
        assert.equal((await request('POST','/limpezas/arquivos/repetir',{ids:[1,1]})).status,400);assert.equal((await request('DELETE','/projetos/999')).status,404);assert.ok(await existe('a.pdf'));assert.equal((await banco.query('SELECT * FROM limpeza_arquivos'))[0].length,0);
    });
});
