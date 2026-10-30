import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import { before,beforeEach,after,describe,it } from 'node:test';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import mysql from 'mysql2/promise';
import { iniciarMysqlTemporario,mysqlDisponivel } from './helpers/mysql-temporario.js';
import { carregarAplicacaoIsolada,contas,senhaFixture } from './helpers/aplicacao.js';
import { executarMigracoes,verificarEsquema } from '../banco/migrador.js';

const novo={titulo:'Memórias do bairro',objetivo:'Investigar',descricao:'Descrição\nSegunda linha',temas_abordados:'História; memória'};
describe('P20/P21/P22: subprojetos em HTTP/MySQL descartaveis reais',{skip:!mysqlDisponivel,concurrency:1},()=>{
    let instancia,banco,pool,app,servidor,origem,raiz;const cookies={};
    async function request(method,url,body,papel='administrador'){
        const r=await fetch(origem+url,{method,headers:{...(cookies[papel]?{Cookie:cookies[papel]}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};
    }
    const criar=(body=novo,pai=51)=>request('POST',`/projetos/${pai}/subprojetos`,body);
    before(async()=>{
        raiz=await fs.mkdtemp(path.join(tmpdir(),'labhist-p20-files-'));instancia=await iniciarMysqlTemporario('p20');banco=instancia.banco;await executarMigracoes(banco);pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:4});
        await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Professor')");await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno')");
        for(const c of contas.slice(0,3)){await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[c.id,c.usuario,c.senha,c.perfil]);if(c.perfil!=='administrador')await banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${c.perfil}_id) VALUES (?,?,?)`,[c.id,c.perfil,c.id]);}
        app=await carregarAplicacaoIsolada({diretorioUploads:raiz});app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        for(const c of contas.slice(0,3)){const r=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:c.usuario,senha:senhaFixture})});assert.equal(r.status,200);cookies[c.perfil]=r.headers.getSetCookie()[0].split(';')[0];}
    });
    beforeEach(async()=>{
        await banco.query('DROP TABLE IF EXISTS fixture_dep_subprojeto');
        for(const tr of ['fixture_sub_insert','fixture_sub_update','fixture_sub_delete'])await banco.query('DROP TRIGGER IF EXISTS '+tr);
        for(const t of ['subprojeto_aluno','subprojeto','limpeza_arquivos','documentos','projeto_aluno','projeto_professor','projeto'])await banco.query(`DELETE FROM ${t}`);
        await banco.query("INSERT INTO projeto (id,titulo) VALUES (51,'Projeto proprio'),(52,'Projeto alheio')");await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42)');await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');
    });
    after(async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();if(instancia)await instancia.encerrar();if(raiz){assert.equal(path.dirname(path.resolve(raiz)),path.resolve(tmpdir()));assert.ok(path.basename(raiz).startsWith('labhist-p20-'));await fs.rm(raiz,{recursive:true,force:true});}});
    it('P20: cria dois subprojetos do mesmo pai e um de outro sem interferencia',async()=>{
        const a=await criar(),b=await criar({...novo,titulo:'Outro tema'}),c=await criar(novo,52);assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(c.status,201);assert.notEqual(a.data.id,b.data.id);
        const lista=await request('GET','/projetos/51/subprojetos');assert.deepEqual(lista.data.map(s=>s.id),[a.data.id,b.data.id]);assert.equal((await request('GET',`/subprojetos/${a.data.id}`)).data.projeto_id,51);
    });
    it('P20: textos Unicode, trim e linhas persistem sem campos novos',async()=>{const c=await criar({...novo,titulo:'  Título ç  ',conteudo:'fora do contrato'});assert.equal(c.status,201);const r=await request('GET',`/subprojetos/${c.data.id}`);assert.equal(r.data.titulo,'Título ç');assert.equal(r.data.descricao,novo.descricao);assert.equal(r.data.temas_abordados,novo.temas_abordados);assert.equal('conteudo' in r.data,false);});
    for(const titulo of ['', '   ',null,42,{},[], 'a'.repeat(256),'Titulo\nLinha'])it(`P20: titulo invalido ${JSON.stringify(titulo).slice(0,35)} nao grava`,async()=>{assert.equal((await criar({...novo,titulo})).status,400);assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,0);});
    for(const campo of ['objetivo','descricao','temas_abordados'])for(const valor of [null,{},[]])it(`P20: ${campo} rejeita ${JSON.stringify(valor)}`,async()=>{assert.equal((await criar({...novo,[campo]:valor})).status,400);assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,0);});
    for(const campo of ['objetivo','descricao','temas_abordados'])it(`P20: ${campo} aplica limite TEXT em bytes UTF-8`,async()=>{assert.equal((await criar({...novo,[campo]:'ç'.repeat(32768)})).status,400);assert.equal((await criar({...novo,[campo]:'a'.repeat(65535)})).status,201);});
    it('P20: apenas titulo e aceito; opcionais retornam texto vazio',async()=>{const c=await criar({titulo:'Minimo'});assert.equal(c.status,201);const r=await request('GET',`/subprojetos/${c.data.id}`);assert.equal(r.data.objetivo,'');assert.equal(r.data.descricao,'');assert.equal(r.data.temas_abordados,'');assert.equal((await criar({...novo,titulo:'a'.repeat(255)})).status,201);});
    it('P20: projeto ausente e divergencia entre URL/corpo recusados',async()=>{assert.equal((await criar(novo,999)).status,404);assert.equal((await criar({...novo,projeto_id:52})).status,400);assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,0);});
    it('P20: aluno e anônimo não cadastram; perfil no corpo nao concede acesso',async()=>{for(const papel of ['','aluno'])assert.equal((await request('POST','/projetos/51/subprojetos',{...novo,perfil:'administrador'},papel)).status,papel?403:401);assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,0);});
    it('P20: lista/detalhe respeitam participacao para aluno e professor',async()=>{
        const proprio=await criar(),alheio=await criar(novo,52);
        for(const p of ['aluno','professor']){const l=await request('GET','/projetos/51/subprojetos',undefined,p);assert.equal(l.status,200);assert.deepEqual(l.data.map(s=>s.id),[proprio.data.id]);assert.equal((await request('GET',`/subprojetos/${proprio.data.id}`,undefined,p)).status,200);assert.equal((await request('GET','/projetos/52/subprojetos',undefined,p)).status,403);assert.equal((await request('GET',`/subprojetos/${alheio.data.id}?perfil=administrador`,undefined,p)).status,403);}
    });
    it('P20: IDs invalidos e ausencia de detalhe tratados sem falso registro',async()=>{for(const id of [0,'abc','1e2']){assert.equal((await criar(novo,id)).status,400);assert.equal((await request('GET','/subprojetos/'+id)).status,400);}assert.equal((await request('GET','/subprojetos/999')).status,404);assert.equal((await request('GET','/projetos/999/subprojetos')).status,404);});
    it('P20: FK impede orfao e exclusao do pai reverte documentos/fila',async()=>{
        await assert.rejects(banco.query("INSERT INTO subprojeto (projeto_id,titulo) VALUES (999,'Orfao')"));await criar();await fs.writeFile(path.join(raiz,'documentos','preservar.pdf'),'preservar');await banco.query("INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por) VALUES (61,51,'D','preservar.pdf','uploads/documentos/preservar.pdf',42)");
        assert.equal((await request('DELETE','/projetos/51')).status,409);assert.equal((await banco.query('SELECT * FROM documentos WHERE id=61'))[0].length,1);assert.equal((await banco.query('SELECT * FROM limpeza_arquivos'))[0].length,0);assert.equal(await fs.readFile(path.join(raiz,'documentos','preservar.pdf'),'utf8'),'preservar');
    });
    it('P20: FK removida impede partida apesar de historico completo',async()=>{await banco.query('ALTER TABLE subprojeto DROP FOREIGN KEY labhist_fk_subprojeto_projeto');try{await assert.rejects(verificarEsquema(banco),/FK de subprojeto/);}finally{await banco.query('ALTER TABLE subprojeto ADD CONSTRAINT labhist_fk_subprojeto_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE RESTRICT ON UPDATE RESTRICT');}});
    it('P20: migra006 para007 sem alterar projetos existentes',async()=>{await banco.query('ALTER TABLE quiz DROP FOREIGN KEY labhist_fk_quiz_subprojeto');await banco.query('DROP TABLE subprojeto_aluno');await banco.query('DROP TABLE subprojeto');await banco.query('DELETE FROM schema_migrations WHERE versao>=7');const [antes]=await banco.query('SELECT * FROM projeto ORDER BY id');assert.deepEqual(await executarMigracoes(banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-7+1},(_,i)=>i+7)});assert.deepEqual((await banco.query('SELECT * FROM projeto ORDER BY id'))[0],antes);});
    it('P20: falha SQL nao grava metade do subprojeto nem vaza SQL',async()=>{await banco.query("CREATE TRIGGER fixture_sub_insert BEFORE INSERT ON subprojeto FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const r=await criar();assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,0);});
    it('P21: edita cada campo, preserva ID/pai e nao altera irmao',async()=>{
        const a=await criar(),b=await criar({...novo,titulo:'Irmao'}),url=`/subprojetos/${a.data.id}`;
        let dados={...novo};
        for(const campo of ['titulo','objetivo','descricao','temas_abordados']){
            dados={...dados,[campo]:`Novo ${campo} ç`};assert.equal((await request('PUT',url,dados)).status,200);
            assert.deepEqual((await request('GET',url)).data,{alunos:[],id:a.data.id,projeto_id:51,...dados});
        }
        assert.deepEqual((await request('GET',`/subprojetos/${b.data.id}`)).data,{alunos:[],id:b.data.id,projeto_id:51,...novo,titulo:'Irmao'});
    });
    it('P21: salvar sem alteracao retorna sucesso',async()=>{const c=await criar();assert.equal((await request('PUT',`/subprojetos/${c.data.id}`,novo)).status,200);assert.deepEqual((await request('GET',`/subprojetos/${c.data.id}`)).data,{alunos:[],id:c.data.id,projeto_id:51,...novo});});
    for(const alteracao of [{titulo:''},{titulo:' '.repeat(3)},{titulo:22},{objetivo:{}},{descricao:null},{temas_abordados:[]}])it(`P21: validacao compartilhada rejeita ${JSON.stringify(alteracao)}`,async()=>{
        const c=await criar(),url=`/subprojetos/${c.data.id}`;assert.equal((await request('PUT',url,{...novo,...alteracao})).status,400);assert.deepEqual((await request('GET',url)).data,{alunos:[],id:c.data.id,projeto_id:51,...novo});
    });
    it('P21: transferir pai e recusado; mesmo pai aceito; ID no corpo nao altera identidade',async()=>{
        const c=await criar(),url=`/subprojetos/${c.data.id}`;assert.equal((await request('PUT',url,{...novo,projeto_id:52,titulo:'Transferido'})).status,400);
        assert.equal((await request('PUT',url,{...novo,projeto_id:51,id:999})).status,200);assert.deepEqual((await request('GET',url)).data,{alunos:[],id:c.data.id,projeto_id:51,...novo});
    });
    it('P21: nao administrador nao edita proprio/alheio mesmo forjando perfil',async()=>{
        const a=await criar(),b=await criar(novo,52);
        for(const c of [a,b])for(const papel of ['','professor','aluno'])assert.equal((await request('PUT',`/subprojetos/${c.data.id}`,{...novo,perfil:'administrador'},papel)).status,papel?403:401);
        assert.equal((await banco.query('SELECT * FROM subprojeto WHERE titulo<>?',[novo.titulo]))[0].length,0);
    });
    it('P21: ID invalido ou ausente nao atualiza outro registro',async()=>{const c=await criar();assert.equal((await request('PUT','/subprojetos/abc',novo)).status,400);assert.equal((await request('PUT','/subprojetos/999',novo)).status,404);assert.deepEqual((await request('GET',`/subprojetos/${c.data.id}`)).data,{alunos:[],id:c.data.id,projeto_id:51,...novo});});
    it('P21: falha SQL reverte edicao e retorna mensagem sanitizada',async()=>{
        const c=await criar();await banco.query("CREATE TRIGGER fixture_sub_update BEFORE UPDATE ON subprojeto FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");
        const r=await request('PUT',`/subprojetos/${c.data.id}`,{...novo,titulo:'Nao salvar',objetivo:'Outro'});assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.deepEqual((await request('GET',`/subprojetos/${c.data.id}`)).data,{alunos:[],id:c.data.id,projeto_id:51,...novo});
    });
    it('P22: exclui so o alvo e preserva pai, irmaos, documento e arquivo',async()=>{
        const a=await criar(),b=await criar({...novo,titulo:'Irmao'}),c=await criar(novo,52);
        await fs.writeFile(path.join(raiz,'documentos','preservar.pdf'),'preservar');await banco.query("INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por) VALUES (61,51,'D','preservar.pdf','uploads/documentos/preservar.pdf',42)");
        assert.equal((await request('DELETE',`/subprojetos/${a.data.id}`)).status,200);assert.equal((await request('GET',`/subprojetos/${a.data.id}`)).status,404);assert.equal((await request('DELETE',`/subprojetos/${a.data.id}`)).status,404);
        assert.deepEqual((await banco.query('SELECT id FROM subprojeto ORDER BY id'))[0].map(r=>r.id),[b.data.id,c.data.id]);assert.equal((await banco.query('SELECT * FROM projeto'))[0].length,2);assert.equal((await banco.query('SELECT * FROM documentos WHERE id=61'))[0].length,1);assert.equal((await banco.query('SELECT * FROM limpeza_arquivos'))[0].length,0);assert.equal(await fs.readFile(path.join(raiz,'documentos','preservar.pdf'),'utf8'),'preservar');
    });
    for(const politica of ['RESTRICT','CASCADE','SET NULL'])it(`P22: dependente protegido, inclusive FK ${politica}, nao sofre efeito implicito`,async()=>{
        const c=await criar();await banco.query(`CREATE TABLE fixture_dep_subprojeto (id INT PRIMARY KEY,subprojeto_id INT NULL,FOREIGN KEY (subprojeto_id) REFERENCES subprojeto(id) ON DELETE ${politica}) ENGINE=InnoDB`);await banco.query('INSERT INTO fixture_dep_subprojeto VALUES (1,?)',[c.data.id]);
        assert.equal((await request('DELETE',`/subprojetos/${c.data.id}`)).status,409);assert.deepEqual((await banco.query('SELECT * FROM fixture_dep_subprojeto'))[0],[{id:1,subprojeto_id:c.data.id}]);assert.equal((await request('GET',`/subprojetos/${c.data.id}`)).status,200);
        await banco.query('DELETE FROM fixture_dep_subprojeto');assert.equal((await request('DELETE',`/subprojetos/${c.data.id}`)).status,200);
    });
    it('P22: nega anonimo/aluno/professor, inclusive recurso alheio e perfil forjado',async()=>{
        const a=await criar(),b=await criar(novo,52);
        for(const c of [a,b])for(const papel of ['','aluno','professor'])assert.equal((await request('DELETE',`/subprojetos/${c.data.id}?perfil=administrador`,{perfil:'administrador'},papel)).status,papel?403:401);
        assert.equal((await banco.query('SELECT * FROM subprojeto'))[0].length,2);
    });
    it('P22: ID invalido e ausente nao removem registro existente',async()=>{
        const c=await criar();for(const id of ['abc',0,-1,'1e2'])assert.equal((await request('DELETE','/subprojetos/'+id)).status,400);assert.equal((await request('DELETE','/subprojetos/999')).status,404);assert.equal((await request('GET',`/subprojetos/${c.data.id}`)).status,200);
    });
    it('P22: falha SQL reverte exclusao sem revelar driver',async()=>{
        const c=await criar();await banco.query("CREATE TRIGGER fixture_sub_delete BEFORE DELETE ON subprojeto FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");
        const r=await request('DELETE',`/subprojetos/${c.data.id}`);assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);assert.equal((await request('GET',`/subprojetos/${c.data.id}`)).status,200);assert.equal((await banco.query('SELECT * FROM projeto WHERE id=51'))[0].length,1);
    });
});
