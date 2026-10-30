import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {randomUUID} from 'node:crypto';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {contas,senhaFixture,carregarAplicacaoIsolada} from './helpers/aplicacao.js';
import {executarMigracoes,verificarEsquema} from '../banco/migrador.js';
import {versaoEsperada} from '../banco/migracoes.js';

describe('Mensagens privadas: HTTP real e MySQL descartável',{concurrency:1},()=>{
    let f,tempo=0;
    const post=(url,body,papel='professor')=>f.request('/mensagens'+url,papel,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const conversa=async(destinatario=42,papel='professor')=>{const r=await post('/conversas',{destinatario_id:destinatario},papel);assert.equal(r.status,200,JSON.stringify(r.data));return r.data.id;};
    const enviar=(id,conteudo='Olá, vamos pesquisar?',papel='professor',cliente_id=randomUUID())=>post('/conversas/'+id+'/mensagens',{conteudo,cliente_id},papel);
    const ler=(id,papel='aluno',query='')=>f.request(`/mensagens/conversas/${id}/mensagens${query}`,papel);
    const resumo=async(papel='aluno')=>(await f.request('/mensagens/resumo',papel)).data.nao_lidas;
    before(async()=>{
        f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});
        for(const [id,perfil,pessoa,papel] of [[91,'professor',43,'professor-b'],[92,'aluno',44,'aluno-b']]){
            await f.banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[id,'fixture-'+papel,contas[1].senha,perfil]);
            await f.banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${perfil}_id) VALUES (?,?,?)`,[id,perfil,pessoa]);
            const r=await fetch(f.origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-'+papel,senha:senhaFixture})});assert.equal(r.status,200);f.cookies[papel]=r.headers.getSetCookie()[0].split(';')[0];
        }
    });
    beforeEach(async()=>{
        tempo+=900001;await f.banco.query('DROP TRIGGER IF EXISTS fixture_mensagem_falha');
        await f.banco.query('DELETE FROM mensagem');await f.banco.query('DELETE FROM mensagem_conversa');await f.preencher(2);
        await f.banco.query('UPDATE projeto_professor SET professor_id=43 WHERE projeto_id=52');
        await f.banco.query('DELETE FROM projeto_aluno WHERE projeto_id=52 AND aluno_id=42');
    });
    after(async()=>{if(f)await f.fechar();});
    it('migra16→17 preservando pessoas, projetos e checksums anteriores; repetição não altera histórico',async()=>{
        await f.banco.query('DROP TABLE mensagem');await f.banco.query('DROP TABLE mensagem_conversa');await f.banco.query('DELETE FROM schema_migrations WHERE versao>=17');
        const [antes]=await f.banco.query('SELECT * FROM schema_migrations ORDER BY versao'),[projetos]=await f.banco.query('SELECT * FROM projeto ORDER BY id');
        assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-16},(_,i)=>i+17)});assert.deepEqual((await f.banco.query('SELECT * FROM schema_migrations WHERE versao<=16 ORDER BY versao'))[0],antes);assert.deepEqual((await f.banco.query('SELECT * FROM projeto ORDER BY id'))[0],projetos);
        assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});assert.deepEqual(await verificarEsquema(f.banco),{versao:versaoEsperada});
    });
    it('contatos são somente do outro perfil com conta e projeto em comum; nomes/IDs mínimos',async()=>{
        const r=await f.request('/mensagens/contatos','professor');assert.equal(r.status,200);assert.deepEqual(r.data.contatos.map(p=>p.pessoa_id),[42,44]);
        assert.deepEqual(Object.keys(r.data.contatos[0]).sort(),['conta_id','nome','perfil','pessoa_id']);
        assert.deepEqual((await f.request('/mensagens/contatos','aluno')).data.contatos.map(p=>p.pessoa_id),[41]);
        assert.deepEqual((await f.request('/mensagens/contatos?busca=Aluno%20B','professor')).data.contatos.map(p=>p.conta_id),[92]);
        await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id=92');try{assert.equal((await f.request('/mensagens/contatos','professor')).data.contatos.length,1);}finally{await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) VALUES (92,'aluno',44)");}
    });
    it('conversa iniciada dos dois lados e em concorrência tem um único par',async()=>{
        const ids=await Promise.all([conversa(),conversa(41,'aluno'),conversa()]);assert.equal(new Set(ids).size,1);
        assert.equal((await f.banco.query('SELECT COUNT(*) n FROM mensagem_conversa'))[0][0].n,1);
    });
    it('professor e aluno enviam, histórico preserva autor/destinatário e UTC',async()=>{
        const id=await conversa(),a=await enviar(id),b=await enviar(id,'Sim, professor.','aluno');assert.equal(a.status,200);assert.equal(b.status,200);
        const r=await ler(id);assert.equal(r.status,200);assert.deepEqual(r.data.mensagens.map(m=>[m.remetente_id,m.destinatario_id]),[[41,42],[42,41]]);assert.equal(r.data.mensagens[0].lida_em,null);assert.ok(r.data.mensagens.every(m=>m.enviada_em.endsWith('Z')&&Number.isFinite(Date.parse(m.enviada_em))));
    });
    it('leitura só altera recebidas até o marcador exibido; GET não marca leitura',async()=>{
        const id=await conversa(),a=await enviar(id,'Primeira'),b=await enviar(id,'Segunda');await enviar(id,'Resposta','aluno');
        assert.equal(await resumo(),2);await ler(id);assert.equal(await resumo(),2);
        assert.equal((await post('/conversas/'+id+'/leitura',{ate_id:a.data.mensagem.id},'aluno')).status,200);assert.equal(await resumo(),1);
        const r=(await ler(id,'professor')).data;assert.equal(r.lidas_ate,a.data.mensagem.id);assert.ok(r.mensagens[0].lida_em);assert.equal(r.mensagens[1].lida_em,null);assert.equal(r.mensagens[2].lida_em,null);
        await post('/conversas/'+id+'/leitura',{ate_id:b.data.mensagem.id},'aluno');assert.equal(await resumo(),0);
    });
    it('conversas ordenam pela mensagem mais recente e expõem contagem por conversa',async()=>{
        const a=await conversa(),b=await conversa(92);await enviar(a,'Mais antiga');await enviar(b,'Intermediária');await enviar(a,'Mais recente');
        const r=await f.request('/mensagens/conversas','professor');assert.deepEqual(r.data.conversas.map(c=>c.id),[a,b]);
        const aluno=(await f.request('/mensagens/conversas','aluno')).data.conversas[0];assert.equal(aluno.nao_lidas,2);assert.equal(aluno.ultima_mensagem.conteudo,'Mais recente');
    });
    it('reenvio com mesma chave é idempotente e chave com outro texto é recusada',async()=>{
        const id=await conversa(),chave=randomUUID(),a=await enviar(id,'Texto','professor',chave),b=await enviar(id,'Texto','professor',chave);assert.equal(b.status,200);assert.equal(a.data.mensagem.id,b.data.mensagem.id);assert.equal(await resumo(),1);
        assert.equal((await enviar(id,'Alterado','professor',chave)).status,409);
    });
    it('paginação percorre todo histórico sem duplicação e cursor incremental não repete mensagens',async()=>{
        const id=await conversa();const linhas=Array.from({length:120},(_,n)=>[id,41,42,randomUUID(),'Mensagem '+n]);await f.banco.query('INSERT INTO mensagem (conversa_id,remetente_id,destinatario_id,cliente_id,conteudo,enviada_em) VALUES '+linhas.map(()=>'(?,?,?,?,?,UTC_TIMESTAMP(3))').join(','),linhas.flat());
        let r=(await ler(id)).data;assert.equal(r.mensagens.length,50);assert.equal(r.tem_mais,true);const ids=r.mensagens.map(m=>m.id),fim=ids.at(-1);
        while(r.tem_mais){r=(await ler(id,'aluno','?antes='+r.mensagens[0].id)).data;ids.push(...r.mensagens.map(m=>m.id));}assert.equal(ids.length,120);assert.equal(new Set(ids).size,120);
        await enviar(id,'Incremental');r=(await ler(id,'aluno','?apos='+fim)).data;assert.equal(r.mensagens.length,1);assert.equal(r.mensagens[0].conteudo,'Incremental');
    });
    it('recusa conteúdo vazio, tipos inválidos, controles, surrogates e excesso; aceita emoji e texto literal',async()=>{
        const id=await conversa();for(const texto of ['', '  \n ',null,{},'x'.repeat(4001),'\x00','\ud800'])assert.equal((await enviar(id,texto)).status,400);
        const r=await enviar(id,"<img src=x onerror=alert(1)> ' OR 1=1; 😀");assert.equal(r.status,200);assert.equal((await ler(id)).data.mensagens[0].conteudo,"<img src=x onerror=alert(1)> ' OR 1=1; 😀");
        assert.equal((await post('/conversas/'+id+'/mensagens',{conteudo:'Texto',cliente_id:'invalido'})).status,400);
    });
    it('recusa vínculo ausente, mesmo perfil, identidade própria, conta administrativa e aluno sem projeto comum',async()=>{
        for(const [dest,papel] of [[91,'professor'],[41,'professor'],[1,'professor'],[42,'professor-b']])assert.equal((await post('/conversas',{destinatario_id:dest,perfil:'administrador'},papel)).status,403);
        await f.banco.query("UPDATE aluno SET turma='1A' WHERE id IN (42,44)");assert.equal((await post('/conversas',{destinatario_id:42},'professor-b')).status,403);
    });
    it('terceiros não leem, enviam ou marcam leitura de uma conversa alheia',async()=>{
        const id=await conversa();await enviar(id);
        for(const papel of ['professor-b','aluno-b']){
            assert.equal((await ler(id,papel)).status,404);assert.equal((await enviar(id,'Forjado',papel)).status,404);assert.equal((await post('/conversas/'+id+'/leitura',{ate_id:1},papel)).status,404);
        }
        assert.equal((await f.request('/mensagens/conversas','professor-b')).data.conversas.length,0);
    });
    it('anônimo e administrador não acessam mensagens privadas por nenhuma rota',async()=>{
        const id=await conversa();for(const papel of ['','administrador']){
            for(const url of ['/resumo','/contatos','/conversas','/conversas/'+id+'/mensagens'])assert.equal((await f.request('/mensagens'+url,papel)).status,papel?403:401);
            for(const [url,body] of [['/conversas',{destinatario_id:42}],['/conversas/'+id+'/mensagens',{conteudo:'Forjado',cliente_id:randomUUID()}],['/conversas/'+id+'/leitura',{ate_id:1}]])assert.equal((await post(url,body,papel)).status,papel?403:401);
        }
    });
    it('revogação bloqueia histórico, leitura e envio, remove contagem e preserva registros',async()=>{
        const id=await conversa();await enviar(id);await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');
        assert.equal((await ler(id)).status,403);assert.equal((await enviar(id)).status,403);assert.equal((await post('/conversas/'+id+'/leitura',{ate_id:1},'aluno')).status,403);assert.equal(await resumo(),0);
        assert.equal((await f.request('/mensagens/conversas','aluno')).data.conversas.length,0);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM mensagem'))[0][0].n,1);
        await f.banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');assert.equal((await ler(id)).status,200);
    });
    it('vínculo em um segundo projeto mantém autorização após remover o primeiro',async()=>{
        const id=await conversa();await f.banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (52,41)');await f.banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (52,42)');await f.banco.query('DELETE FROM projeto_aluno WHERE projeto_id=51 AND aluno_id=42');assert.equal((await enviar(id)).status,200);
    });
    it('reassociar conta não transfere o histórico privado para outra pessoa',async()=>{
        const id=await conversa();await enviar(id);await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id IN (42,92)');await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) VALUES (42,'aluno',44),(92,'aluno',42)");
        try{assert.equal((await ler(id,'professor')).status,403);assert.equal((await f.request('/mensagens/conversas','professor')).data.conversas.length,0);}
        finally{await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id IN (42,92)');await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id) VALUES (42,'aluno',42),(92,'aluno',44)");}
    });
    it('marcador de leitura de outra conversa e paginação inválida são recusados',async()=>{
        const id=await conversa(),outro=await conversa(92),m=await enviar(outro);assert.equal((await post('/conversas/'+id+'/leitura',{ate_id:m.data.mensagem.id},'aluno')).status,400);
        for(const query of ['?antes=abc','?antes=1&apos=2','?limite=101','?limite=0'])assert.equal((await ler(id,'aluno',query)).status,400);
        for(const query of ['?pagina=0','?pagina=1%20OR%201=1','?busca='+encodeURIComponent('x'.repeat(81))])assert.equal((await f.request('/mensagens/contatos'+query,'professor')).status,400);
        assert.equal((await f.request('/mensagens/contatos?busca='+encodeURIComponent("' OR 1=1 --"),'professor')).data.contatos.length,0);
    });
    it('falha SQL reverte envio, não altera contador e não expõe detalhes internos',async()=>{
        const id=await conversa();await f.banco.query("CREATE TRIGGER fixture_mensagem_falha BEFORE INSERT ON mensagem FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture-secreta'");const r=await enviar(id);assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('fixture-secreta'),false);assert.equal(await resumo(),0);
    });
    it('mensagens persistem em nova aplicação e contas participantes não são apagadas em cascata',async()=>{
        const id=await conversa();await enviar(id,'Histórico persistente');await assert.rejects(f.banco.query('DELETE FROM usuarios WHERE id=42'));
        const a=await carregarAplicacaoIsolada({operacaoEnv:{API_PUBLIC_ORIGIN:''}});a.configurarBancoDeTeste(f.pool);const servidor=a.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));const base='http://127.0.0.1:'+servidor.address().port;
        try{const login=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-aluno',senha:senhaFixture})}),cookie=login.headers.getSetCookie()[0].split(';')[0];assert.equal(login.status,200);const r=await fetch(base+`/mensagens/conversas/${id}/mensagens`,{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.equal((await r.json()).mensagens[0].conteudo,'Histórico persistente');}
        finally{servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}
    });
    it('envios são limitados por conta e voltam após a janela',async()=>{
        const id=await conversa();for(let n=0;n<29;n++)assert.equal((await enviar(id,String(n))).status,200);assert.equal((await enviar(id,'Excesso')).status,429);tempo+=60001;assert.equal((await enviar(id,'Após janela')).status,200);
    });
    it('startup recusa índice de histórico removido',async()=>{
        await f.banco.query('ALTER TABLE mensagem ADD INDEX fixture_fk_conversa (conversa_id)');await f.banco.query('ALTER TABLE mensagem DROP INDEX labhist_mensagem_historico');try{await assert.rejects(verificarEsquema(f.banco),/Índice de mensagens/);}finally{await f.banco.query('ALTER TABLE mensagem ADD INDEX labhist_mensagem_historico (conversa_id,id)');await f.banco.query('ALTER TABLE mensagem DROP INDEX fixture_fk_conversa');}
    });
});
