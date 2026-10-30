import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador,chromePath} from './helpers/navegador.js';
import {senhaFixture} from './helpers/aplicacao.js';
import {executarMigracoes,verificarEsquema} from '../banco/migrador.js';

describe('Núcleos: participantes de subprojeto, HTTP/MySQL/Chrome descartáveis',{concurrency:1},()=>{
    let f,nav,tempo=0;const erros=[];
    const salvar=(url,body,method='POST',papel='administrador')=>f.request(url,papel,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const criar=(ids=[42],titulo='Ser Digital')=>salvar('/projetos/51/subprojetos',{titulo,aluno_ids:ids});
    const ler=id=>f.request('/subprojetos/'+id);
    const editar=(id,ids,titulo='Ser Digital')=>salvar('/subprojetos/'+id,{titulo,aluno_ids:ids},'PUT');
    before(async()=>{f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});assert.ok(chromePath);nav=await abrirNavegador();nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));await nav.send('Network.enable');await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__avisos=[];window.alert=m=>__avisos.push(m);'});});
    beforeEach(async()=>{tempo+=900001;await f.banco.query('DROP TRIGGER IF EXISTS fixture_sa_falha');await f.preencher(2);});
    after(async()=>{if(nav)await nav.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});
    it('migração015→016 preserva projetos/subprojetos sem atribuir alunos e é repetível',async()=>{
        const c=await criar([]);await f.banco.query('DROP TABLE subprojeto_aluno');await f.banco.query('DELETE FROM schema_migrations WHERE versao>=16');
        const [antes]=await f.banco.query('SELECT * FROM subprojeto ORDER BY id');assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-15},(_,i)=>i+16)});assert.deepEqual((await f.banco.query('SELECT * FROM subprojeto ORDER BY id'))[0],antes);assert.deepEqual((await ler(c.data.id)).data.alunos,[]);assert.deepEqual(await executarMigracoes(f.banco),{versao:versaoEsperada,aplicadas:[]});
    });
    it('cria equipes distintas e um aluno participa de vários núcleos',async()=>{
        const a=await criar([42]),b=await criar([42,44],'Ludo');assert.equal(a.status,201);assert.equal(b.status,201);assert.deepEqual((await ler(a.data.id)).data.alunos,[{id:42,nome:'Aluno A'}]);assert.deepEqual((await ler(b.data.id)).data.alunos.map(a=>a.id),[42,44]);
    });
    for(const ids of [null,'42',[42,42],['42'],[0],[-1],[1.5],[999]])it('recusa participantes inválidos '+JSON.stringify(ids)+' sem criação parcial',async()=>{assert.equal((await criar(ids)).status,400);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM subprojeto'))[0][0].n,0);});
    it('aluno existente fora do projeto é recusado; FK impede associação entre pais',async()=>{
        await f.banco.query('DELETE FROM projeto_aluno WHERE projeto_id=51 AND aluno_id=44');assert.equal((await criar([44])).status,400);const c=await criar([42]);await assert.rejects(f.banco.query('INSERT INTO subprojeto_aluno VALUES (?,?,?)',[c.data.id,52,44]));await assert.rejects(f.banco.query('INSERT INTO subprojeto_aluno VALUES (?,?,?)',[c.data.id,51,44]));
    });
    it('edição substitui alunos, PUT antigo preserva e lista vazia remove somente vínculo',async()=>{
        const c=await criar([42]);assert.equal((await editar(c.data.id,[44])).status,200);assert.deepEqual((await ler(c.data.id)).data.alunos.map(a=>a.id),[44]);assert.equal((await salvar('/subprojetos/'+c.data.id,{titulo:'Renomeado'},'PUT')).status,200);assert.equal((await ler(c.data.id)).data.alunos.length,1);assert.equal((await editar(c.data.id,[])).status,200);assert.deepEqual((await ler(c.data.id)).data.alunos,[]);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM aluno'))[0][0].n,2);
    });
    it('falha ao salvar equipe reverte textos e vínculos juntos',async()=>{
        const c=await criar([42]);await f.banco.query("CREATE TRIGGER fixture_sa_falha BEFORE INSERT ON subprojeto_aluno FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-fixture'");const r=await editar(c.data.id,[44],'Não salvar');assert.equal(r.status,500);assert.equal(JSON.stringify(r.data).includes('segredo'),false);const s=(await ler(c.data.id)).data;assert.equal(s.titulo,'Ser Digital');assert.deepEqual(s.alunos.map(a=>a.id),[42]);
    });
    it('mantém equipe ao editar projeto e bloqueia remover membro ainda presente no núcleo',async()=>{
        const c=await criar([42]);const projeto={nome:'LABHIST',descricao:'Pesquisa',objetivo:'História',professor_ids:[41],aluno_ids:[42,44],status:'em andamento'};
        assert.equal((await salvar('/projetos/51',projeto,'PUT')).status,200);assert.equal((await ler(c.data.id)).data.alunos.length,1);
        assert.equal((await salvar('/projetos/51',{...projeto,nome:'Não salvar',aluno_ids:[44]},'PUT')).status,409);assert.equal((await f.request('/projetos/51')).data.nome,'LABHIST');assert.equal((await editar(c.data.id,[])).status,200);assert.equal((await salvar('/projetos/51',{...projeto,aluno_ids:[44]},'PUT')).status,200);
    });
    it('exclusão do núcleo remove vínculos próprios e preserva aluno/projeto/outro núcleo',async()=>{
        const a=await criar([42]),b=await criar([42],'Ludo');assert.equal((await f.request('/subprojetos/'+a.data.id,'administrador',{method:'DELETE'})).status,200);assert.equal((await ler(b.data.id)).data.alunos.length,1);assert.equal((await f.banco.query('SELECT COUNT(*) n FROM aluno'))[0][0].n,2);
    });
    it('guard de outros dependentes não remove a equipe por engano',async()=>{
        const c=await criar([42]);await f.banco.query('CREATE TABLE fixture_dep_sa (id INT PRIMARY KEY,subprojeto_id INT,FOREIGN KEY (subprojeto_id) REFERENCES subprojeto(id))');try{await f.banco.query('INSERT INTO fixture_dep_sa VALUES (1,?)',[c.data.id]);assert.equal((await f.request('/subprojetos/'+c.data.id,'administrador',{method:'DELETE'})).status,409);assert.equal((await ler(c.data.id)).data.alunos.length,1);}finally{await f.banco.query('DROP TABLE fixture_dep_sa');}
    });
    it('papéis acadêmicos não alteram equipes e leitura mantém minimização por identidade',async()=>{
        const c=await criar([42,44]);for(const perfil of ['professor','aluno',''])assert.equal((await salvar('/subprojetos/'+c.data.id,{titulo:'Forjado',aluno_ids:[]},'PUT',perfil)).status,perfil?403:401);
        const aluno=(await f.request('/subprojetos/'+c.data.id,'aluno')).data;assert.deepEqual(aluno.alunos,[{id:42,nome:'Aluno A'}]);const prof=(await f.request('/subprojetos/'+c.data.id,'professor')).data;assert.deepEqual(prof.alunos.map(a=>a.id),[42,44]);assert.deepEqual(Object.keys(prof.alunos[0]).sort(),['id','nome']);await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');assert.equal((await f.request('/subprojetos/'+c.data.id,'professor')).status,403);
    });
    it('startup detecta FK removida mesmo com histórico completo',async()=>{await f.banco.query('ALTER TABLE subprojeto_aluno DROP FOREIGN KEY labhist_fk_sa_membro');try{await assert.rejects(verificarEsquema(f.banco),/FK de aluno/);}finally{await f.banco.query('ALTER TABLE subprojeto_aluno ADD CONSTRAINT labhist_fk_sa_membro FOREIGN KEY (projeto_id,aluno_id) REFERENCES projeto_aluno(projeto_id,aluno_id) ON DELETE RESTRICT ON UPDATE RESTRICT');}});
    async function entrar(){await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('typeof fazerLogin==="function"');await nav.evaluate(`document.getElementById('usuario-log').value='fixture-admin';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};fazerLogin()`);await nav.waitFor('location.pathname.includes("menuCadastro")&&document.body.dataset.sessao==="confirmada"');}
    it('Chrome: selecionar, persistir, exibir e editar participantes com texto literal',async()=>{
        await f.banco.query('UPDATE aluno SET nome=? WHERE id=42',['Aluno <img src=x>']);await entrar();await nav.evaluate('abrirSubprojetosProjeto(51)');await nav.evaluate('novoSubprojeto()');assert.equal(await nav.evaluate('document.querySelectorAll("#subAlunosLista input").length'),2);assert.equal(await nav.evaluate('document.querySelector("#subAlunosLista img")'),null);
        await nav.evaluate('document.getElementById("sub-titulo").value="Ser Digital";document.getElementById("sub-aluno-42").checked=true;submitSubprojeto()');const [rows]=await f.banco.query('SELECT id FROM subprojeto');assert.equal(rows.length,1);const id=rows[0].id;await nav.evaluate('abrirDetalheSubprojeto('+id+')');assert.ok(await nav.evaluate('document.getElementById("subprojetoCampos").textContent.includes("Aluno <img")'));assert.equal(await nav.evaluate('document.querySelector("#subprojetoCampos img")'),null);
        await nav.evaluate('editarSubprojeto('+id+')');assert.equal(await nav.evaluate('document.getElementById("sub-aluno-42").checked'),true);await nav.evaluate('document.querySelectorAll("#subAlunosLista input").forEach(i=>i.checked=i.value==="44");submitSubprojeto()');assert.deepEqual((await ler(id)).data.alunos.map(a=>a.id),[44]);
        for(const [width,height] of [[360,800],[800,360]]){await nav.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await nav.evaluate('editarSubprojeto('+id+')');assert.ok(await nav.evaluate('document.documentElement.scrollWidth<=innerWidth'));}await nav.send('Emulation.clearDeviceMetricsOverride');
    });
    it('Chrome: erro ao salvar mantém seleção e logout limpa nomes',async()=>{
        await entrar();await nav.evaluate('abrirSubprojetosProjeto(51);');await nav.evaluate('novoSubprojeto();document.getElementById("sub-titulo").value="Rascunho";document.querySelector("#subAlunosLista input").checked=true');await f.banco.query("CREATE TRIGGER fixture_sa_falha BEFORE INSERT ON subprojeto_aluno FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");await nav.evaluate('submitSubprojeto()');assert.equal(await nav.evaluate('document.querySelectorAll("#subAlunosLista input:checked").length'),1);assert.equal(await nav.evaluate('document.getElementById("sub-titulo").value'),'Rascunho');await nav.evaluate(`fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-aluno',senha:${JSON.stringify(senhaFixture)}})}).then(r=>{if(r.status!==200)throw Error('Login fixture');return inicializarSessao()})`);assert.equal(await nav.evaluate('contextoSubprojeto'),null);assert.equal(await nav.evaluate('document.getElementById("subAlunosLista").children.length'),0);await nav.evaluate('limparEstadoSessao()');assert.equal(await nav.evaluate('document.getElementById("subprojetoCampos").children.length'),0);
    });
});
