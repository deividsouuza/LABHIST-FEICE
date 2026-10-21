import assert from 'node:assert/strict';
import { before, after, beforeEach, describe, it } from 'node:test';
import multer from 'multer';
import { carregarAplicacaoIsolada, criarBancoSimulado, aluno, professor, payloadProjeto, contas, senhaFixture } from './helpers/aplicacao.js';
import { iniciarMysqlTemporario, mysqlDisponivel } from './helpers/mysql-temporario.js';
import { executarMigracoes } from '../banco/migrador.js';
import { conectarPool } from '../banco/conexao.js';

const recursos = [
    ...['aluno', 'professor'].flatMap(perfil => ['GET','PUT','DELETE'].map(method => ({ nome: `${method} ${perfil}`, method, url: `/usuarios/${perfil === 'aluno' ? 42 : 41}?perfil=${perfil}`, tabela: perfil, body: method === 'PUT' ? perfil === 'aluno' ? aluno : professor : undefined }))),
    ...['GET','PUT','DELETE'].map(method => ({ nome: `${method} projeto`, method, url: '/projetos/51', tabela: 'projeto', body: method === 'PUT' ? payloadProjeto : undefined })),
    { nome: 'DELETE documento', method: 'DELETE', url: '/documentos/61', tabela: 'documentos' }
];

describe('P15: estados HTTP, classificação e rollback com DB simulado', { concurrency: 1 }, () => {
    let app, banco, servidor, origem, cookie;
    async function request(method, url, body, extra = {}) {
        const res = await fetch(origem + url, { method, headers: { Cookie: cookie || '', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra.headers }, body: body === undefined ? undefined : JSON.stringify(body) });
        const data = await res.json(); return { res, data };
    }
    before(async () => {
        app = await carregarAplicacaoIsolada(); banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco);
        app.rotasDeTeste.get('/fixture-interno', () => { throw Object.assign(new Error('segredo-sql-fixture SELECT senha'), { status: 400 }); });
        app.rotasDeTeste.get('/fixture-multer', () => { throw new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'campo-secreto-fixture'); });
        app.rotasDeTeste.get('/fixture-disco', () => { throw Object.assign(new Error('segredo-caminho-fixture'), { code: 'EACCES' }); });
        app.rotasDeTeste.get('/fixture-apos-headers', (req,res) => { res.write('{"parcial":'); throw new Error('segredo-apos-headers-fixture SELECT senha'); });
        servidor = app.app.listen(0,'127.0.0.1'); await new Promise(resolve => servidor.once('listening',resolve)); origem = `http://127.0.0.1:${servidor.address().port}`;
        const login = await request('POST','/login',{ usuario: contas[0].usuario, senha: senhaFixture }); assert.equal(login.res.status,200); cookie = login.res.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(() => { banco = criarBancoSimulado(); app.configurarBancoDeTeste(banco); app.remocoes.length=0; app.logs.length=0; });
    after(async () => { servidor?.closeAllConnections(); if(servidor) await new Promise(resolve => servidor.close(resolve)); });
    function alterarQuery(interceptar) {
        const original = banco.query.bind(banco);
        banco.query = async (sql, params) => {
            const valor = await interceptar(sql,params);
            if(valor !== undefined) { banco.chamadas.push({ tipo:'query',sql,parametros:params }); return valor; }
            return original(sql,params);
        };
    }
    for (const rota of recursos) {
        it(`${rota.nome} inexistente responde 404 sem mutação ou remoção de arquivo`, async () => {
            alterarQuery(async sql => sql.startsWith('SELECT') ? [[]] : undefined);
            const {res,data} = await request(rota.method,rota.url,rota.body);
            assert.equal(res.status,404); assert.equal(typeof data.erro,'string');
            assert.equal(banco.chamadas.some(c => /^(UPDATE|INSERT|DELETE)/.test(c.sql || '')),false); assert.equal(app.remocoes.length,0);
            if(rota.method !== 'GET') { assert.ok(banco.chamadas.some(c => c.tipo==='rollback')); assert.equal(banco.chamadas.at(-1).tipo,'release'); }
        });
        for (const id of ['0','-1','1.5','1e2','abc','2147483648']) {
            it(`${rota.nome} rejeita ID malformado ${id} antes de SQL`, async () => {
                const url = rota.url.replace(/\/\d+(?=\?|$)/,'/'+id);
                const {res} = await request(rota.method,url,rota.body); assert.equal(res.status,400); assert.equal(banco.chamadas.length,0);
            });
        }
    }
    for (const rota of recursos.filter(r => r.method==='PUT')) {
        it(`${rota.nome} mantém sucesso com affectedRows zero quando o registro foi encontrado`, async () => {
            alterarQuery(async sql => sql.startsWith('UPDATE') ? [{ affectedRows:0,changedRows:0 }] : undefined);
            assert.equal((await request(rota.method,rota.url,rota.body)).res.status,200);
            assert.ok(banco.chamadas.some(c => c.tipo==='commit'));
        });
    }
    for (const rota of recursos.filter(r => r.method==='DELETE')) {
        it(`${rota.nome} com affectedRows zero reverte e não anuncia exclusão nem remove arquivo`, async () => {
            alterarQuery(async sql => sql.startsWith(`DELETE FROM ${rota.tabela} WHERE id`) ? [{affectedRows:0}] : undefined);
            assert.equal((await request(rota.method,rota.url)).res.status,404);
            assert.ok(banco.chamadas.some(c => c.tipo==='rollback')); assert.equal(app.remocoes.length,0);
        });
    }
    for (const code of ['ER_DUP_ENTRY','ER_ROW_IS_REFERENCED_2','ER_NO_REFERENCED_ROW_2','ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT']) {
        it(`conflito ${code} responde 409 após rollback sem detalhes SQL`, async () => {
            alterarQuery(async sql => { if(sql.startsWith('UPDATE')) throw Object.assign(new Error('segredo-sql-fixture SELECT senha'),{code,sql:'segredo-query-fixture'}); });
            const {res,data} = await request('PUT','/usuarios/41?perfil=professor',professor);
            assert.equal(res.status,409); assert.equal(JSON.stringify(data).includes('segredo'),false); assert.ok(banco.chamadas.some(c=>c.tipo==='rollback'));
        });
    }
    it('corrida de unicidade no cadastro de conta recebe 409', async () => {
        alterarQuery(async sql => { if(sql.startsWith('INSERT INTO usuarios')) throw Object.assign(new Error('segredo-fixture'),{code:'ER_DUP_ENTRY'}); });
        assert.equal((await request('POST','/cadastro',{usuario:'nova-fixture',senha:senhaFixture,perfil:'administrador'})).res.status,409);
    });
    it('incompatibilidade de tamanho retorna validação 400', async () => {
        alterarQuery(async sql => { if(sql.startsWith('UPDATE')) throw Object.assign(new Error('valor-secreto-fixture'),{code:'ER_DATA_TOO_LONG'}); });
        assert.equal((await request('PUT','/usuarios/41?perfil=professor',professor)).res.status,400);
    });
    it('erro SQL interno é registrado sem SQL, mensagem, stack ou parâmetros', async () => {
        alterarQuery(async sql => { if(sql.startsWith('UPDATE')) throw Object.assign(new Error('segredo-sql-fixture SELECT senha'),{code:'ER_PARSE_ERROR',sql:'segredo-query-fixture'}); });
        const {res,data} = await request('PUT','/usuarios/41?perfil=professor',professor);
        assert.equal(res.status,500); assert.ok(app.logs.some(args => args[0]==='Falha interna na API.'));
        assert.equal(JSON.stringify([data,app.logs]).includes('segredo'),false); assert.equal(JSON.stringify(app.logs).includes('SELECT'),false);
        assert.ok(banco.chamadas.some(c=>c.tipo==='rollback')); assert.equal(banco.chamadas.at(-1).tipo,'release');
    });
    it('falha no commit da exclusão de documento não remove arquivo físico', async () => {
        banco.commit = async () => { throw new Error('segredo-commit-fixture'); };
        assert.equal((await request('DELETE','/documentos/61')).res.status,500); assert.equal(app.remocoes.length,0); assert.equal(banco.chamadas.at(-1).tipo,'destroy');
    });
    it('erro inesperado no middleware é 500 mesmo com status arbitrário no objeto', async () => {
        const {res,data} = await request('GET','/fixture-interno'); assert.equal(res.status,500);
        assert.equal(JSON.stringify([data,app.logs]).includes('segredo'),false); assert.ok(app.logs.length>0);
    });
    it('erro operacional de disco é interno, sem caminho exposto', async () => {
        const {res,data} = await request('GET','/fixture-disco'); assert.equal(res.status,500); assert.equal(JSON.stringify([data,app.logs]).includes('segredo'),false);
    });
    it('falha após início da resposta encerra a conexão sem encaminhar erro sensível', async () => {
        await assert.rejects(async () => { const res=await fetch(origem+'/fixture-apos-headers'); await res.text(); });
        assert.ok(app.logs.some(args=>args[0]==='Falha interna após início da resposta.'));
        assert.equal(JSON.stringify(app.logs).includes('segredo'),false);
    });
    it('erro conhecido de Multer é validação sem nome do campo exposto', async () => {
        const {res,data} = await request('GET','/fixture-multer'); assert.equal(res.status,400); assert.equal(JSON.stringify(data).includes('secreto'),false);
    });
    it('JSON malformado é 400 e não revela corpo original', async () => {
        const res = await fetch(origem+'/cadastro-dashboard',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{"segredo-fixture":'});
        assert.equal(res.status,400); assert.equal(JSON.stringify(await res.json()).includes('segredo'),false); assert.equal(banco.chamadas.length,0);
    });
    it('corpo acima do limite existente é 413 JSON', async () => {
        const {res} = await request('POST','/cadastro-dashboard',{nome:'x'.repeat(110000)}); assert.equal(res.status,413); assert.equal(banco.chamadas.length,0);
    });
    it('extensão não permitida é validação 400 sem gravar arquivo', async () => {
        const dados = new FormData(); dados.append('arquivo',new Blob(['fixture']),'fixture.exe');
        const res=await fetch(origem+'/documentos',{method:'POST',headers:{Cookie:cookie},body:dados});
        assert.equal(res.status,400); assert.equal(typeof (await res.json()).erro,'string'); assert.equal(banco.chamadas.length,0);
    });
    it('rota desconhecida retorna JSON 404', async () => { const {res,data}=await request('GET','/nao-existe'); assert.equal(res.status,404); assert.equal(typeof data.erro,'string'); });
    it('codificação inválida no ID do caminho é 400 sem refletir a URL', async () => {
        const {res,data}=await request('GET','/usuarios/%E0%A4%A?perfil=aluno');
        assert.equal(res.status,400);assert.equal(JSON.stringify(data).includes('%E0'),false);assert.equal(banco.chamadas.length,0);
    });
    it('consulta de documentos em projeto ausente é 404; ID inválido é 400', async () => {
        alterarQuery(async sql => sql.startsWith('SELECT id FROM projeto') ? [[]] : undefined);
        assert.equal((await request('GET','/documentos?projeto_id=999')).res.status,404);
        banco.chamadas.length=0; assert.equal((await request('GET','/documentos?projeto_id=abc')).res.status,400); assert.equal(banco.chamadas.length,0);
    });
});

describe('P15: ausência, edição idêntica e exclusões em MySQL descartável real', {skip:!mysqlDisponivel,concurrency:1},()=>{
    let instancia,banco,pool,app,servidor,origem,cookie;
    async function request(method,url,body) {
        const res=await fetch(origem+url,{method,headers:{Cookie:cookie||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
        return {status:res.status,data:await res.json(),res};
    }
    before(async()=>{
        instancia=await iniciarMysqlTemporario('p15');banco=instancia.banco; await executarMigracoes(banco);
        console.log('MySQL descartável P15:',(await banco.query('SELECT VERSION() AS v'))[0][0].v);
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (1,?,?,?)',[contas[0].usuario,contas[0].senha,contas[0].perfil]);
        pool=await conectarPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01'});
        app=await carregarAplicacaoIsolada();app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        const login=await request('POST','/login',{usuario:contas[0].usuario,senha:senhaFixture});assert.equal(login.status,200);cookie=login.res.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(async()=>{
        await banco.query('DROP TRIGGER IF EXISTS fixture_p15_falha');
        for(const t of ['documentos','projeto_professor','projeto_aluno','projeto','aluno','professor'])await banco.query(`DELETE FROM ${t}`);
        await banco.query('INSERT INTO professor (id,nome,matricula,email,telefone) VALUES (41,?,?,?,?)',[professor.nome,professor.matricula,professor.email,professor.telefone]);
        await banco.query('INSERT INTO aluno (id,nome,matricula,email,telefone,curso,turma) VALUES (42,?,?,?,?,?,?)',[aluno.nome,aluno.matricula,aluno.email,aluno.telefone,aluno.curso,aluno.turma]);
        await banco.query('INSERT INTO projeto (id,titulo,descricao,objetivo,professor_id) VALUES (51,?,?,?,41)',[payloadProjeto.nome,payloadProjeto.descricao,payloadProjeto.objetivo]);
        await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES (51,41)');await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES (51,42)');
        await banco.query("INSERT INTO documentos (id,projeto_id,descricao,arquivo_caminho,arquivo_nome,enviado_por,enviado_por_perfil) VALUES (61,51,'fixture','uploads/documentos/fixture.pdf','fixture.pdf',42,'aluno')");
        app.remocoes.length=0;
    });
    after(async()=>{if(servidor){servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}if(pool)await pool.end();if(instancia)await instancia.encerrar();});
    for(const rota of recursos.filter(r=>r.method==='PUT')){
        it(`${rota.nome}: edição idêntica e real permanecem sucesso, ausente é 404`,async()=>{
            assert.equal((await request('PUT',rota.url,rota.body)).status,200);
            const alterado={...rota.body,...(rota.tabela==='projeto'?{nome:'Título alterado'}:{nome:'Nome alterado'})};
            assert.equal((await request('PUT',rota.url,alterado)).status,200);
            const leitura=await request('GET',rota.url);assert.equal(leitura.data.nome,alterado.nome);
            assert.equal((await request('PUT',rota.url.replace(/\/\d+/,'/999'),rota.body)).status,404);
        });
    }
    for(const rota of recursos.filter(r=>r.method==='DELETE')){
        it(`${rota.nome}: exclusão existente é sucesso e repetição é 404`,async()=>{
            assert.equal((await request('DELETE',rota.url)).status,200);assert.equal((await request('DELETE',rota.url)).status,404);
            assert.equal((await banco.query(`SELECT * FROM ${rota.tabela} WHERE id=?`,[Number(rota.url.match(/\/(\d+)/)[1])]))[0].length,0);
            assert.equal(app.remocoes.length,['documentos','projeto'].includes(rota.tabela)?1:0);
        });
    }
    it('conflito real por FK não provoca exclusão parcial de pessoa/vínculos',async()=>{
        await banco.query('CREATE TABLE fixture_dependente (id INT PRIMARY KEY, professor_id INT, FOREIGN KEY(professor_id) REFERENCES professor(id)) ENGINE=InnoDB');
        try{
            await banco.query('INSERT INTO fixture_dependente VALUES(1,41)');assert.equal((await request('DELETE','/usuarios/41?perfil=professor')).status,409);
            assert.equal((await banco.query('SELECT * FROM projeto_professor'))[0].length,1);assert.equal((await banco.query('SELECT professor_id FROM projeto'))[0][0].professor_id,41);
        }finally{await banco.query('DROP TABLE fixture_dependente');}
    });
    it('falha SQL real preserva pessoa e responde 500 sem detalhe do trigger',async()=>{
        await banco.query("CREATE TRIGGER fixture_p15_falha BEFORE UPDATE ON professor FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='segredo-trigger-fixture'");
        const res=await request('PUT','/usuarios/41?perfil=professor',{...professor,nome:'Não gravar'});assert.equal(res.status,500);assert.equal(JSON.stringify(res.data).includes('segredo'),false);
        assert.equal((await banco.query('SELECT nome FROM professor WHERE id=41'))[0][0].nome,professor.nome);
    });
});
