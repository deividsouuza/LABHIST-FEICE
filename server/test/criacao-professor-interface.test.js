import assert from 'node:assert/strict';
import {before,beforeEach,after,describe,it} from 'node:test';
import {fixtureProjetos} from './helpers/fixture-projetos.js';
import {abrirNavegador,chromePath} from './helpers/navegador.js';
import {contas,senhaFixture} from './helpers/aplicacao.js';

describe('Criação de projetos e núcleos pelo professor: HTTP/MySQL/Chrome isolados',{concurrency:1},()=>{
    let f,nav,tempo=0;const erros=[];
    const salvar=(url,body,papel='professor',method='POST')=>f.request(url,papel,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const projeto=(extra={})=>({nome:'Pesquisa do professor',descricao:'Memórias',objetivo:'Investigar',status:'em andamento',aluno_ids:[42,44],...extra});
    const total=async tabela=>(await f.banco.query('SELECT COUNT(*) n FROM '+tabela))[0][0].n;
    before(async()=>{
        f=await fixtureProjetos({operacaoEnv:{API_PUBLIC_ORIGIN:''},recuperacaoAgora:()=>tempo});
        await f.banco.query("INSERT INTO aluno (id,nome,email) VALUES (45,'Aluno externo','nao-publicar@test.invalid')");
        // Conta e pessoa têm IDs distintos: a sessão, nunca o corpo, define o professor.
        await f.banco.query("INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (91,'fixture-docente-b',?,'professor')",[contas[1].senha]);
        await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (91,'professor',43)");
        const login=await fetch(f.origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-docente-b',senha:senhaFixture})});
        assert.equal(login.status,200);f.cookies['outro-professor']=login.headers.getSetCookie()[0].split(';')[0];
        assert.ok(chromePath);nav=await abrirNavegador();
        nav.on('Runtime.exceptionThrown',e=>erros.push(e.exceptionDetails.text));
        await nav.send('Network.enable');await nav.send('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
        await nav.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__avisos=[];window.alert=m=>__avisos.push(m);'});
    });
    beforeEach(async()=>{
        tempo+=900001;
        await f.banco.query('DROP TRIGGER IF EXISTS fixture_professor_falha');
        await f.preencher(2);
        await f.banco.query('UPDATE projeto_professor SET professor_id=43 WHERE projeto_id=52');
        await f.banco.query('UPDATE projeto SET professor_id=43 WHERE id=52');
    });
    after(async()=>{if(nav)await nav.close();if(f)await f.fechar();assert.deepEqual(erros,[]);});

    it('professor cria projeto, torna-se responsável e passa a acessá-lo imediatamente',async()=>{
        const r=await salvar('/projetos',projeto());assert.equal(r.status,200);
        const p=(await f.request('/projetos/'+r.data.id,'professor')).data;
        assert.equal(p.nome,'Pesquisa do professor');assert.deepEqual(p.professor_ids,[41]);assert.deepEqual(p.aluno_ids,[42,44]);
        const lista=await f.request('/projetos','professor');assert.ok(lista.data.some(p=>p.id===r.data.id));assert.ok(!lista.data.some(p=>p.id===52));
        assert.deepEqual(Object.keys(p.alunos[0]).sort(),['id','nome']);
    });
    it('IDs distintos de conta/pessoa vinculam a pessoa correta',async()=>{
        const r=await salvar('/projetos',projeto(),'outro-professor');assert.equal(r.status,200);
        assert.deepEqual((await f.request('/projetos/'+r.data.id,'outro-professor')).data.professor_ids,[43]);
        assert.equal((await f.request('/projetos/'+r.data.id,'professor')).status,403);
    });
    it('catálogo retorna somente o professor autenticado e nomes/IDs de alunos',async()=>{
        const r=await f.request('/projetos/opcoes-criacao','professor');assert.equal(r.status,200);
        assert.deepEqual(r.data.professores,[{id:41,nome:'Professor A'}]);assert.equal(r.data.alunos.length,3);
        for(const a of r.data.alunos)assert.deepEqual(Object.keys(a).sort(),['id','nome']);
        assert.equal((await f.request('/usuarios?perfil=aluno','professor')).status,403);
        for(const p of ['aluno',''])assert.equal((await f.request('/projetos/opcoes-criacao',p)).status,p?403:401);
    });
    it('não permite criar em nome de outro professor nem incluir professores extras',async()=>{
        for(const dados of [{professor_id:43},{professor_ids:[43]},{professor_ids:[41,43]},{professor_ids:[]}]){
            const r=await salvar('/projetos',projeto({...dados,perfil:'administrador',pessoa_id:43}));assert.equal(r.status,403);
        }
        assert.equal(await total('projeto'),2);
        assert.equal((await salvar('/projetos',projeto({professor_id:41,professor_ids:[41]}))).status,200);
    });
    it('aluno e visitante não criam projetos, mesmo forjando perfil',async()=>{
        for(const p of ['aluno',''])assert.equal((await salvar('/projetos',projeto({perfil:'professor',professor_ids:[41]}),p)).status,p?403:401);
        assert.equal(await total('projeto'),2);
    });
    it('mantém validação de status, existência e seleção de alunos',async()=>{
        for(const dados of [{status:null},{status:'outro'},{aluno_ids:[]},{aluno_ids:[999]},{aluno_ids:[42,42]}])assert.equal((await salvar('/projetos',projeto(dados))).status,400);
        assert.equal(await total('projeto'),2);
    });
    it('falha ao vincular alunos reverte projeto e professor',async()=>{
        await f.banco.query("CREATE TRIGGER fixture_professor_falha BEFORE INSERT ON projeto_aluno FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture-privada'");
        const r=await salvar('/projetos',projeto());assert.equal(r.status,500);assert.ok(!JSON.stringify(r.data).includes('fixture-privada'));
        assert.equal(await total('projeto'),2);assert.equal(await total('projeto_professor'),2);
    });
    it('professor cria subprojeto com alunos do projeto e administrador consegue lê-lo',async()=>{
        const r=await salvar('/projetos/51/subprojetos',{titulo:'Ludo',aluno_ids:[42]});assert.equal(r.status,201);
        const s=(await f.request('/subprojetos/'+r.data.id)).data;assert.equal(s.projeto_id,51);assert.deepEqual(s.alunos,[{id:42,nome:'Aluno A'}]);
    });
    it('recusa subprojeto fora do vínculo, inclusive com perfil forjado',async()=>{
        assert.equal((await salvar('/projetos/52/subprojetos',{titulo:'Invasão',perfil:'administrador',professor_id:43})).status,403);
        await f.banco.query('DELETE FROM projeto_professor WHERE projeto_id=51');
        assert.equal((await salvar('/projetos/51/subprojetos',{titulo:'Vínculo removido'})).status,403);assert.equal(await total('subprojeto'),0);
    });
    it('recusa aluno externo ao núcleo e reverte a criação inteira',async()=>{
        assert.equal((await salvar('/projetos/51/subprojetos',{titulo:'Externo',aluno_ids:[45]})).status,400);
        assert.equal(await total('subprojeto'),0);assert.equal(await total('subprojeto_aluno'),0);
    });
    it('aluno/anônimo não criam núcleos e professor não ganha edição/exclusão',async()=>{
        for(const p of ['aluno',''])assert.equal((await salvar('/projetos/51/subprojetos',{titulo:'Forjado'},p)).status,p?403:401);
        const c=await salvar('/projetos/51/subprojetos',{titulo:'Preservado'});assert.equal(c.status,201);
        for(const method of ['PUT','DELETE']){
            assert.equal((await salvar('/projetos/51',projeto(),'professor',method)).status,403);
            assert.equal((await salvar('/subprojetos/'+c.data.id,{titulo:'Modificado'},'professor',method)).status,403);
        }
    });
    it('conta sem vínculo acadêmico válido não cria projeto nem acessa catálogo',async()=>{
        await f.banco.query('DELETE FROM conta_pessoa WHERE usuario_id=91');
        try{assert.equal((await salvar('/projetos',projeto(),'outro-professor')).status,401);assert.equal((await f.request('/projetos/opcoes-criacao','outro-professor')).status,401);}
        finally{await f.banco.query("INSERT INTO conta_pessoa (usuario_id,perfil,professor_id) VALUES (91,'professor',43)");}
    });

    async function entrar(papel='professor'){
        await nav.send('Page.navigate',{url:f.origem+'/login/login.html'});await nav.waitFor('typeof fazerLogin==="function"');
        await nav.evaluate(`document.getElementById('usuario-log').value='fixture-${papel==='administrador'?'admin':papel}';document.getElementById('senha-log').value=${JSON.stringify(senhaFixture)};document.getElementById('perfil-log').value=${JSON.stringify(papel==='administrador'?'':papel)};fazerLogin()`);
        await nav.waitFor('location.pathname.includes("menuCadastro")&&document.body.dataset.sessao==="confirmada"');
    }
    async function abrirCadastro(){
        await nav.evaluate('showMeusProjetos()');await nav.evaluate('document.getElementById("btnNovoProjetoProfessor").click()');
        await nav.waitFor('!document.getElementById("btnSubmitProjeto").disabled&&alunosDisponiveis.length===3');
    }
    it('Chrome: professor cria projeto e núcleo pela interface com seleção de alunos',async()=>{
        await entrar();await abrirCadastro();
        assert.equal(await nav.evaluate('getComputedStyle(document.getElementById("proj-professor-escolha")).display'),'none');
        assert.equal(await nav.evaluate('document.querySelectorAll("#proj-professores-lista button").length'),0);
        await nav.evaluate('document.getElementById("proj-nome").value="Núcleo do professor";document.getElementById("proj-status").value="em andamento";document.getElementById("proj-aluno").value="42";addAlunoToProjeto();submitProjeto()');
        assert.equal(await nav.evaluate('document.getElementById("listaSubprojetos").style.display'),'block');
        assert.equal(await nav.evaluate('document.getElementById("btnNovoSubprojeto").hidden'),false);
        const pai=await nav.evaluate('contextoSubprojeto.projetoId');
        await nav.evaluate('document.getElementById("btnNovoSubprojeto").click();document.getElementById("sub-titulo").value="Ser Digital";document.getElementById("sub-aluno-42").checked=true;submitSubprojeto()');
        const [rows]=await f.banco.query('SELECT id FROM subprojeto WHERE projeto_id=?',[pai]);assert.equal(rows.length,1);
        await nav.evaluate('abrirDetalheSubprojeto('+rows[0].id+')');
        assert.equal(await nav.evaluate('document.getElementById("btnEditarSubprojeto").hidden'),true);
        assert.equal(await nav.evaluate('document.getElementById("btnExcluirSubprojeto").hidden'),true);
        await nav.evaluate('voltarDoSubprojetoAoProjeto()');assert.equal(await nav.evaluate('projetoAtualDetalheId'),pai);
        assert.deepEqual((await f.request('/subprojetos/'+rows[0].id)).data.alunos,[{id:42,nome:'Aluno A'}]);
    });
    it('Chrome: erro ao salvar preserva formulário, limpar mantém o professor e voltar abre meus projetos',async()=>{
        await entrar();await abrirCadastro();
        await f.banco.query("CREATE TRIGGER fixture_professor_falha BEFORE INSERT ON projeto_aluno FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");
        await nav.evaluate('document.getElementById("proj-nome").value="Preservado";document.getElementById("proj-status").value="em andamento";document.getElementById("proj-aluno").value="42";addAlunoToProjeto();submitProjeto()');
        assert.equal(await nav.evaluate('document.getElementById("proj-nome").value'),'Preservado');
        assert.equal(await nav.evaluate('selectedProjetoAlunos.length'),1);assert.equal(await total('projeto'),2);
        await nav.evaluate('limparFormularioProjeto()');await nav.waitFor('!document.getElementById("btnSubmitProjeto").disabled');
        assert.deepEqual(await nav.evaluate('selectedProjetoProfessores.map(p=>p.id)'),[41]);
        assert.equal(await nav.evaluate('selectedProjetoAlunos.length'),0);
        await nav.evaluate('backToList("projeto")');assert.equal(await nav.evaluate('document.getElementById("listMeusProjetos").style.display'),'block');
    });
    it('Chrome: aluno não vê criação; administrador mantém cadastro e escolha de professores',async()=>{
        await entrar('aluno');await nav.evaluate('showMeusProjetos()');assert.equal(await nav.evaluate('getComputedStyle(document.getElementById("btnNovoProjetoProfessor")).display'),'none');
        await nav.evaluate('showRegisterForm("projeto")');assert.equal(await nav.evaluate('document.getElementById("formProjeto").style.display'),'none');
        await entrar('administrador');await nav.evaluate('showRegisterForm("projeto")');assert.notEqual(await nav.evaluate('getComputedStyle(document.getElementById("proj-professor-escolha")).display'),'none');
        assert.equal(await nav.evaluate('document.getElementById("formProjeto").style.display'),'block');
    });
    it('Chrome: resposta atrasada do catálogo não repopula participantes após limpar sessão',async()=>{
        await entrar();await nav.evaluate('showMeusProjetos()');
        await nav.evaluate(`window.__apiOriginal=apiFetch;apiFetch=async(...args)=>{const r=await window.__apiOriginal(...args);if(args[0].endsWith('/projetos/opcoes-criacao'))await new Promise(resolve=>window.__soltarOpcoes=resolve);return r;};showRegisterForm('projeto')`);
        await nav.waitFor('typeof window.__soltarOpcoes==="function"');
        await nav.evaluate('limparEstadoSessao();window.__soltarOpcoes();apiFetch=window.__apiOriginal');
        assert.equal(await nav.evaluate('alunosDisponiveis.length'),0);assert.equal(await nav.evaluate('selectedProjetoProfessores.length'),0);
        assert.equal(await nav.evaluate('document.getElementById("btnNovoProjetoProfessor").hidden'),true);
    });
});
