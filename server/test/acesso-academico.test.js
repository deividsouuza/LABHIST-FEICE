import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import { before, beforeEach, after, describe, it } from 'node:test';
import mysql from 'mysql2/promise';
import { mkdtemp, readdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { iniciarMysqlTemporario, mysqlDisponivel } from './helpers/mysql-temporario.js';
import { carregarAplicacaoIsolada, contas, senhaFixture } from './helpers/aplicacao.js';
import { executarMigracoes } from '../banco/migrador.js';

describe('P07: autorizacao real com MySQL e arquivos descartaveis', {skip:!mysqlDisponivel,concurrency:1},()=>{
    let instancia,banco,pool,app,servidor,origem,raiz;const cookies={};
    const perfis=[['administrador',1,null],['professor',141,41],['aluno',142,42],['outro-professor',143,43],['outro-aluno',144,44]];
    async function request(method,url,body,papel='administrador'){
        const multipart=body instanceof FormData;
        const res=await fetch(origem+url,{method,headers:{...(cookies[papel]?{Cookie:cookies[papel]}:{}),...(!multipart&&body?{'Content-Type':'application/json'}:{})},body:body?(multipart?body:JSON.stringify(body)):undefined});
        return {res,data:await res.json()};
    }
    function arquivo(projetoId=51){const f=new FormData();f.append('arquivo',new Blob(['%PDF-1.4\n% fixture\n1 0 obj <<>> endobj\n%%EOF\n']),'Relatório ç.pdf');f.append('projeto_id',String(projetoId));f.append('descricao','Relatorio fixture');f.append('enviado_por','999');f.append('enviado_por_perfil','administrador');f.append('autoria_confirmada','0');return f;}
    async function arquivos(){return (await readdir(path.join(raiz,'documentos'))).filter(n=>!n.startsWith('.'));}
    async function aguardarLimpeza(){for(let i=0;i<50;i++){if(!(await arquivos()).length&&!(await readdir(path.join(raiz,'.temporarios'))).length)return;await new Promise(r=>setTimeout(r,20));}assert.fail('Arquivos temporarios nao foram limpos.');}
    before(async()=>{
        raiz=await mkdtemp(path.join(tmpdir(),'labhist-p07-uploads-'));instancia=await iniciarMysqlTemporario('p07');banco=instancia.banco;await executarMigracoes(banco);
        pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:4});
        await banco.query("INSERT INTO professor (id,nome,email,telefone,matricula) VALUES (41,'Professor A','privado-prof@test.invalid','privado-telefone','privada-matricula'),(42,'Professor com ID de aluno','privado-colisao@test.invalid',null,null),(43,'Professor B',null,null,null)");
        await banco.query("INSERT INTO aluno (id,nome,email,telefone,matricula) VALUES (42,'Aluno A','privado-aluno@test.invalid','privado-telefone','privada-matricula'),(44,'Aluno B',null,null,null)");
        for(const [papel,id,pessoa] of perfis){const perfil=papel.replace('outro-','');await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[id,'fixture-'+papel,contas[0].senha,perfil]);if(pessoa)await banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${perfil}_id) VALUES (?,?,?)`,[id,perfil,pessoa]);}
        app=await carregarAplicacaoIsolada({diretorioUploads:raiz});app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        for(const [papel] of perfis){const login=await request('POST','/login',{usuario:'fixture-'+papel,senha:senhaFixture},'');assert.equal(login.res.status,200);cookies[papel]=login.res.headers.getSetCookie()[0].split(';')[0];}
    });
    beforeEach(async()=>{
        app.configurarBancoDeTeste(pool);await banco.query('DROP TRIGGER IF EXISTS fixture_p07_falha');
        for(const t of ['documentos','projeto_aluno','projeto_professor','projeto'])await banco.query(`DELETE FROM ${t}`);
        await banco.query("INSERT INTO projeto (id,titulo,descricao,objetivo,professor_id) VALUES (51,'Meu projeto','Descricao','Objetivo',41),(52,'Outro projeto','Descricao','Objetivo',43),(53,'So responsavel legado','Descricao','Objetivo',41)");
        await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42),(51,44),(52,44)');await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41),(52,43)');
        await banco.query(`INSERT INTO documentos (id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil,autoria_confirmada) VALUES
            (61,51,'Meu envio','meu.pdf','uploads/documentos/meu.pdf',42,'aluno',1),
            (62,51,'Envio colega','colega.pdf','uploads/documentos/colega.pdf',44,'aluno',1),
            (63,51,'Professor ID igual','prof.pdf','uploads/documentos/prof.pdf',42,'professor',1),
            (64,51,'Autoria antiga','legado.pdf','uploads/documentos/legado.pdf',42,'aluno',0),
            (65,52,'Outro projeto','outro.pdf','uploads/documentos/outro.pdf',44,'aluno',1),
            (66,51,'Administrador','admin.pdf','uploads/documentos/admin.pdf',1,'administrador',1),
            (67,51,'Sem perfil','sem.pdf','uploads/documentos/sem.pdf',42,null,0)`);
        // Autores definidos explicitamente pela criação destas fixtures novas; legados 64/67 ficam NULL.
        for(const [id,conta,perfil] of [[61,142,'aluno'],[62,144,'aluno'],[63,141,'professor'],[65,144,'aluno'],[66,1,'administrador']])await banco.query('UPDATE documentos SET autor_conta_id=?,autor_nome=?,autor_perfil=? WHERE id=?',[conta,'Autor fixture '+conta,perfil,id]);
        for(const pasta of ['documentos','.temporarios'])for(const nome of await readdir(path.join(raiz,pasta)))await rm(path.join(raiz,pasta,nome));
        app.remocoes.length=0;
    });
    after(async()=>{
        servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();if(instancia)await instancia.encerrar();
        if(raiz){const alvo=path.resolve(raiz);assert.equal(path.dirname(alvo),path.resolve(tmpdir()));assert.ok(path.basename(alvo).startsWith('labhist-p07-uploads-'));await rm(alvo,{recursive:true,force:true});}
    });
    for(const papel of ['aluno','professor']){
        it(`${papel}: lista filtra por pessoa vinculada e ignora perfil/ID forjado`,async()=>{
            const {res,data}=await request('GET','/projetos?perfil=administrador&usuario_id=144&pessoa_id=44',null,papel);assert.equal(res.status,200);
            assert.deepEqual(data.map(p=>p.id),[51]);assert.equal(JSON.stringify(data).includes('privado'),false);assert.equal(JSON.stringify(data).includes('privada-matricula'),false);
        });
        it(`${papel}: detalhe proprio sem campos pessoais desnecessarios`,async()=>{
            const {res,data}=await request('GET','/projetos/51',null,papel);assert.equal(res.status,200);assert.equal(data.nome,'Meu projeto');
            assert.ok(data.professores.every(p=>Object.keys(p).sort().join(',')==='id,nome'));assert.ok(data.alunos.every(p=>Object.keys(p).sort().join(',')==='id,nome'));
            if(papel==='aluno')assert.deepEqual(data.aluno_ids,[42]);
        });
        it(`${papel}: outro projeto e FK de responsavel sem participacao nao autorizam`,async()=>{
            for(const id of [52,53,999]){assert.equal((await request('GET','/projetos/'+id,null,papel)).res.status,403);assert.equal((await request('GET','/documentos?projeto_id='+id,null,papel)).res.status,403);}
        });
        it(`${papel}: cadastro global negado e consulta pessoal limitada a si mesmo`,async()=>{
            const id=papel==='aluno'?42:41;assert.equal((await request('GET','/usuarios?perfil='+papel,null,papel)).res.status,403);
            assert.equal((await request('GET',`/usuarios/${id}?perfil=${papel}`,null,papel)).res.status,200);
            assert.equal((await request('GET',`/usuarios/${id+2}?perfil=${papel}`,null,papel)).res.status,403);
        });
        it(`${papel}: envio a projeto alheio negado antes de receber arquivo`,async()=>{
            assert.equal((await request('POST','/projetos/52/documentos',arquivo(52),papel)).res.status,403);assert.equal((await arquivos()).length,0);assert.equal((await readdir(path.join(raiz,'.temporarios'))).length,0);assert.equal(app.remocoes.length,0);
        });
        it(`${papel}: envio autorizado usa pessoa/perfil da sessao e promove arquivo apos autorizacao`,async()=>{
            const {res,data}=await request('POST','/projetos/51/documentos',arquivo(),papel);assert.equal(res.status,200);
            const [[doc]]=await banco.query('SELECT * FROM documentos WHERE id=?',[data.id]);assert.equal(doc.enviado_por,papel==='aluno'?42:41);assert.equal(doc.enviado_por_perfil,papel);assert.equal(doc.autoria_confirmada,1);
            assert.equal((await arquivos()).length,1);assert.equal((await readdir(path.join(raiz,'.temporarios'))).length,0);assert.ok((await readFile(path.join(raiz,'documentos',path.basename(doc.arquivo_caminho)),'utf8')).includes('fixture'));
        });
    }
    it('aluno ve somente o proprio envio confirmado, sem colisao de perfil nem legado ambiguo',async()=>{const {res,data}=await request('GET','/documentos?projeto_id=51&usuario_id=44&perfil=professor',null,'aluno');assert.equal(res.status,200);assert.deepEqual(data.map(d=>d.id),[61]);});
    it('professor vinculado ve envios do projeto; administrador mantem gestao global',async()=>{
        assert.equal((await request('GET','/documentos?projeto_id=51',null,'professor')).data.length,6);assert.equal((await request('GET','/projetos')).data.length,3);assert.equal((await request('GET','/usuarios?perfil=aluno')).res.status,200);
    });
    it('compatibilidade multipart com arquivo antes dos campos usa staging e limpa ao negar',async()=>{assert.equal((await request('POST','/documentos',arquivo(52),'aluno')).res.status,403);await aguardarLimpeza();});
    it('projeto do corpo diferente da URL e recusado sem arquivo definitivo',async()=>{assert.equal((await request('POST','/projetos/51/documentos',arquivo(52),'aluno')).res.status,400);await aguardarLimpeza();});
    it('falha de INSERT reverte metadados e remove arquivo promovido',async()=>{
        await banco.query("CREATE TRIGGER fixture_p07_falha BEFORE INSERT ON documentos FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");
        assert.equal((await request('POST','/projetos/51/documentos',arquivo(),'aluno')).res.status,500);assert.equal((await banco.query('SELECT COUNT(*) AS n FROM documentos'))[0][0].n,7);await aguardarLimpeza();
    });
    it('vinculo removido durante recebimento e revalidado antes do arquivo definitivo',async()=>{
        let retirado=false;app.configurarBancoDeTeste({query:async(sql,p)=>{const r=await pool.query(sql,p);if(!retirado&&sql.startsWith('SELECT projeto_id FROM projeto_aluno')){retirado=true;await banco.query('DELETE FROM projeto_aluno WHERE projeto_id=51 AND aluno_id=42');}return r;},getConnection:()=>pool.getConnection()});
        assert.equal((await request('POST','/projetos/51/documentos',arquivo(),'aluno')).res.status,403);await aguardarLimpeza();
    });
    it('COMMIT confirmado no banco mas resposta perdida preserva arquivo sem repetir gravacao',async()=>{
        app.configurarBancoDeTeste({query:(...a)=>pool.query(...a),getConnection:async()=>{const c=await pool.getConnection();return {query:(...a)=>c.query(...a),beginTransaction:()=>c.beginTransaction(),rollback:()=>c.rollback(),release:()=>c.release(),destroy:()=>c.destroy(),async commit(){await c.commit();throw new Error('fixture confirmacao perdida');}};}});
        assert.equal((await request('POST','/projetos/51/documentos',arquivo(),'aluno')).res.status,500);assert.equal((await arquivos()).length,1);assert.equal((await banco.query('SELECT COUNT(*) AS n FROM documentos'))[0][0].n,8);assert.ok(app.logs.some(l=>String(l[0]).includes('confirmacao incerta')));
    });
    it('conta desvinculada durante recebimento nao promove arquivo',async()=>{
        let removido=false;app.configurarBancoDeTeste({query:async(sql,p)=>{const r=await pool.query(sql,p);if(!removido&&sql.startsWith('SELECT projeto_id FROM projeto_aluno')){removido=true;await banco.query('DELETE FROM conta_pessoa WHERE usuario_id=142');}return r;},getConnection:()=>pool.getConnection()});
        try {assert.equal((await request('POST','/projetos/51/documentos',arquivo(),'aluno')).res.status,401);await aguardarLimpeza();}
        finally {await banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) VALUES (142,'aluno',42)");app.configurarBancoDeTeste(pool);}
    });
    it('migracao preserva legados como nao confirmados, sem atribuir autoria',async()=>{
        const [antes]=await banco.query('SELECT id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil,enviado_em FROM documentos ORDER BY id');
        await banco.query('ALTER TABLE documentos DROP COLUMN autoria_confirmada');await banco.query('DELETE FROM schema_migrations WHERE versao>=5');
        assert.deepEqual(await executarMigracoes(banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-5+1},(_,i)=>i+5)});
        assert.deepEqual((await banco.query('SELECT id,projeto_id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil,enviado_em FROM documentos ORDER BY id'))[0],antes);
        assert.ok((await banco.query('SELECT autoria_confirmada FROM documentos'))[0].every(d=>d.autoria_confirmada===0));
        assert.deepEqual((await request('GET','/documentos?projeto_id=51',null,'aluno')).data,[]);
    });
    it('pessoa com vinculo de conta removido nao utiliza sessao antiga',async()=>{
        try{await banco.query('DELETE FROM conta_pessoa WHERE usuario_id=142');assert.equal((await request('GET','/projetos',null,'aluno')).res.status,401);}
        finally{await banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) VALUES (142,'aluno',42)");const r=await request('POST','/login',{usuario:'fixture-aluno',senha:senhaFixture},'');cookies.aluno=r.res.headers.getSetCookie()[0].split(';')[0];}
    });
    it('conta removida invalida a identidade academica antes de consultar projetos',async()=>{
        // Conta sem autoria pode ser removida; contas autoras têm teste RESTRICT separado.
        await banco.query("INSERT INTO professor (id,nome) VALUES (49,'Temporário')");await banco.query("INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (191,'fixture-remover',?,'professor')",[contas[0].senha]);await banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (191,'professor',49)");const r=await request('POST','/login',{usuario:'fixture-remover',senha:senhaFixture},''),anterior=cookies.professor;cookies.professor=r.res.headers.getSetCookie()[0].split(';')[0];
        try{await banco.query('DELETE FROM conta_pessoa WHERE usuario_id=191');await banco.query('DELETE FROM usuarios WHERE id=191');assert.equal((await request('GET','/projetos',null,'professor')).res.status,401);}finally{cookies.professor=anterior;await banco.query('DELETE FROM professor WHERE id=49');}
    });

    it('P09: novo envio registra conta e snapshot real, inclusive administrador',async()=>{
        for(const [papel,conta] of [['aluno',142],['professor',141],['administrador',1]]){
            const {res,data}=await request('POST','/projetos/51/documentos',arquivo(),papel);assert.equal(res.status,200);const [[d]]=await banco.query('SELECT * FROM documentos WHERE id=?',[data.id]);assert.equal(d.autor_conta_id,conta);assert.equal(d.autor_perfil,papel);assert.ok(d.autor_nome);assert.ok(d.enviado_em);if(papel==='administrador')assert.equal(d.autor_nome,'fixture-administrador');
        }
    });
    it('P09: legados ficam pendentes, sem autor deduzido, e auditoria é administrativa',async()=>{
        const {data}=await request('GET','/documentos?projeto_id=51',null,'professor');const d=data.find(d=>d.id===64);assert.equal(d.autor_conta_id,null);assert.equal(d.autor_nome,null);assert.equal(d.autoria_pendente,true);assert.equal(d.autoria_confirmada,false);const r=await request('GET','/documentos/autoria/pendencias');assert.equal(r.res.status,200);assert.deepEqual(r.data.map(d=>d.id),[64,67]);for(const papel of ['aluno','professor',''])assert.equal((await request('GET','/documentos/autoria/pendencias',null,papel)).res.status,papel?403:401);
    });
    it('P09: 010→011 não inventa autoria nem altera arquivo, data ou metadados antigos',async()=>{
        const sql='SELECT id,descricao,arquivo_nome,arquivo_caminho,enviado_por,enviado_por_perfil,enviado_em,autoria_confirmada FROM documentos ORDER BY id';const [antes]=await banco.query(sql);
        await banco.query('ALTER TABLE documentos DROP FOREIGN KEY labhist_fk_documento_autor');await banco.query('ALTER TABLE documentos DROP COLUMN autor_conta_id,DROP COLUMN autor_nome,DROP COLUMN autor_perfil');await banco.query('DELETE FROM schema_migrations WHERE versao>=11');await executarMigracoes(banco);assert.deepEqual((await banco.query(sql))[0],antes);assert.ok((await banco.query('SELECT autor_conta_id,autor_nome,autor_perfil FROM documentos'))[0].every(d=>d.autor_conta_id===null&&d.autor_nome===null&&d.autor_perfil===null));
    });
    it('P09: FK impede apagar conta autora e edição/exclusão de pessoa preservam snapshot',async()=>{
        const {data}=await request('POST','/projetos/51/documentos',arquivo(),'aluno');const [[antes]]=await banco.query('SELECT * FROM documentos WHERE id=?',[data.id]);
        await assert.rejects(banco.query('DELETE FROM usuarios WHERE id=142'));
        try{await banco.query("UPDATE aluno SET nome='Nome novo' WHERE id=42");assert.equal((await banco.query('SELECT autor_nome FROM documentos WHERE id=?',[data.id]))[0][0].autor_nome,'Aluno A');assert.equal((await request('DELETE','/usuarios/42?perfil=aluno')).res.status,200);const [[depois]]=await banco.query('SELECT * FROM documentos WHERE id=?',[data.id]);assert.deepEqual(depois,antes);assert.equal((await request('GET','/documentos?projeto_id=51',null,'professor')).data.find(d=>d.id===data.id).autor_nome,'Aluno A');}
        finally{await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno A') ON DUPLICATE KEY UPDATE nome='Aluno A'");await banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) SELECT 142,'aluno',42 WHERE NOT EXISTS (SELECT 1 FROM conta_pessoa WHERE usuario_id=142)");}
    });

    it('P37: descrição e texto separados persistem e HTML permanece literal na leitura',async()=>{const body=arquivo();body.append('texto_explicativo','Texto <script>não executar</script> ç');const {res,data}=await request('POST','/projetos/51/documentos',body,'aluno');assert.equal(res.status,200);const [[d]]=await banco.query('SELECT descricao,texto_explicativo FROM documentos WHERE id=?',[data.id]);assert.equal(d.descricao,'Relatorio fixture');assert.equal(d.texto_explicativo,'Texto <script>não executar</script> ç');assert.equal((await request('GET','/documentos?projeto_id=51',null,'aluno')).data.find(d=>d.id===data.id).texto_explicativo,d.texto_explicativo);});
    it('P37: envio sem texto e legados continuam NULL',async()=>{const r=await request('POST','/projetos/51/documentos',arquivo(),'aluno');assert.equal(r.res.status,200);assert.equal((await banco.query('SELECT texto_explicativo FROM documentos WHERE id=?',[r.data.id]))[0][0].texto_explicativo,null);assert.equal((await banco.query('SELECT texto_explicativo FROM documentos WHERE id=64'))[0][0].texto_explicativo,null);});
    it('P37: multipart repetido/tipo errado e texto excessivo não persistem',async()=>{for(const tipo of ['repetido','excessivo']){const body=arquivo();body.append('texto_explicativo',tipo==='excessivo'?'ç'.repeat(32768):'A');if(tipo==='repetido')body.append('texto_explicativo','B');const antes=(await banco.query('SELECT COUNT(*) n FROM documentos'))[0][0].n;const r=await request('POST','/projetos/51/documentos',body,'aluno');assert.ok([400,413].includes(r.res.status));assert.equal((await banco.query('SELECT COUNT(*) n FROM documentos'))[0][0].n,antes);}});
});
