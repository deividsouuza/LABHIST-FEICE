import {versaoEsperada} from '../banco/migracoes.js';
import assert from 'node:assert/strict';
import { before, beforeEach, after, describe, it } from 'node:test';
import mysql from 'mysql2/promise';
import { iniciarMysqlTemporario, mysqlDisponivel } from './helpers/mysql-temporario.js';
import { carregarAplicacaoIsolada, contas, aluno, professor, senhaFixture } from './helpers/aplicacao.js';
import { executarMigracoes, verificarEsquema } from '../banco/migrador.js';
import { migrarVinculos } from '../identidades.js';

describe('P06: identidade e cadastros atomicos em MySQL descartavel', {skip:!mysqlDisponivel,concurrency:1}, () => {
    let instancia, banco, pool, app, servidor, origem, cookie;
    async function request(metodo,url,body,sessao=cookie) {
        const res=await fetch(origem+url,{method:metodo,headers:{...(sessao?{Cookie:sessao}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
        return {res,data:await res.json()};
    }
    before(async()=>{
        instancia=await iniciarMysqlTemporario('p06');banco=instancia.banco;
        await executarMigracoes(banco);
        pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:3});
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (1,?,?,?)',[contas[0].usuario,contas[0].senha,'administrador']);
        app=await carregarAplicacaoIsolada();app.configurarBancoDeTeste(pool);servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));origem=`http://127.0.0.1:${servidor.address().port}`;
        const login=await request('POST','/login',{usuario:contas[0].usuario,senha:senhaFixture},'');assert.equal(login.res.status,200);cookie=login.res.headers.getSetCookie()[0].split(';')[0];
    });
    beforeEach(async()=>{
        await banco.query('DROP TRIGGER IF EXISTS fixture_p06_falha');
        await banco.query('DELETE FROM conta_pessoa');await banco.query('DELETE FROM usuarios WHERE id<>1');
        await banco.query('DELETE FROM aluno');await banco.query('DELETE FROM professor');
        await banco.query("INSERT INTO aluno (id,nome) VALUES (42,'Aluno legado')");await banco.query("INSERT INTO professor (id,nome) VALUES (41,'Professor legado')");
    });
    after(async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();if(instancia)await instancia.encerrar();});
    for (const perfil of ['aluno','professor']) {
        it(`cadastro completo ${perfil} cria conta/pessoa/vinculo e autentica a propria pessoa`,async()=>{
            const dados=perfil==='aluno'?aluno:professor;
            const criado=await request('POST','/cadastro-dashboard',{...dados,perfil,credenciais:{usuario:'nova-'+perfil,senha:senhaFixture}});
            assert.equal(criado.res.status,200);
            const login=await request('POST','/login',{usuario:'nova-'+perfil,senha:senhaFixture,pessoa_id:999,perfil},'');assert.equal(login.res.status,200);
            const [[v]]=await banco.query('SELECT * FROM conta_pessoa WHERE perfil=?',[perfil]);assert.equal(v[perfil+'_id'],criado.data.id);
            const [[u]]=await banco.query('SELECT senha FROM usuarios WHERE id=?',[v.usuario_id]);assert.ok(u.senha.startsWith('$scrypt$'));assert.ok(!JSON.stringify(login.data).includes(u.senha));
        });
    }
    it('conta academica nova exige pessoa existente e perfil compativel',async()=>{
        const base={usuario:'nova',senha:senhaFixture,perfil:'professor'};
        assert.equal((await request('POST','/cadastro',base)).res.status,400);
        assert.equal((await request('POST','/cadastro',{...base,pessoa_id:999})).res.status,404);
        assert.equal((await banco.query('SELECT * FROM usuarios WHERE usuario=?',['nova']))[0].length,0);
        assert.equal((await request('POST','/cadastro',{...base,pessoa_id:41})).res.status,200);
        const [[u]]=await banco.query('SELECT id FROM usuarios WHERE usuario=?',['nova']);
        assert.equal((await request('PUT',`/contas/${u.id}/vinculo`,{perfil:'aluno',pessoa_id:42})).res.status,400);
    });
    it('duplicidade de pessoa e usuario global retornam conflito sem metade do cadastro',async()=>{
        const base={usuario:'unico',senha:senhaFixture,perfil:'aluno',pessoa_id:42};
        assert.equal((await request('POST','/cadastro',base)).res.status,200);
        assert.equal((await request('POST','/cadastro',{...base,usuario:'segundo'})).res.status,409);
        assert.equal((await request('POST','/cadastro',{...base,perfil:'professor',pessoa_id:41})).res.status,409);
        assert.equal((await banco.query('SELECT COUNT(*) AS n FROM usuarios'))[0][0].n,2);
    });
    it('falha na segunda gravacao reverte a pessoa e preserva o administrador',async()=>{
        await banco.query("CREATE TRIGGER fixture_p06_falha BEFORE INSERT ON usuarios FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture'");
        assert.equal((await request('POST','/cadastro-dashboard',{...professor,perfil:'professor',credenciais:{usuario:'falha',senha:senhaFixture}})).res.status,500);
        assert.equal((await banco.query('SELECT COUNT(*) AS n FROM professor'))[0][0].n,1);
        assert.equal((await banco.query('SELECT COUNT(*) AS n FROM usuarios'))[0][0].n,1);
    });
    it('credenciais invalidas nao gravam pessoa',async()=>{
        for(const credenciais of [{},{usuario:'',senha:senhaFixture},null,{usuario:'nova',senha:{}}])assert.equal((await request('POST','/cadastro-dashboard',{...professor,perfil:'professor',credenciais})).res.status,400);
        assert.equal((await banco.query('SELECT COUNT(*) AS n FROM professor'))[0][0].n,1);
    });
    it('legado sem vinculo fica bloqueado; relatorio nao revela senha; administrador regulariza por IDs',async()=>{
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (80,?,?,?)',['legado',contas[0].senha,'aluno']);
        assert.equal((await request('POST','/login',{usuario:'legado',senha:senhaFixture},'')).res.status,401);
        const rel=await request('GET','/contas/pendencias');assert.equal(rel.res.status,200);assert.equal(rel.data.contas_sem_vinculo[0].id,80);assert.ok(!JSON.stringify(rel.data).includes('senha'));
        assert.equal((await request('PUT','/contas/80/vinculo',{perfil:'aluno',pessoa_id:42})).res.status,200);
        assert.equal((await request('POST','/login',{usuario:'legado',senha:senhaFixture},'')).res.status,200);
        assert.equal((await request('PUT','/contas/80/vinculo',{perfil:'aluno',pessoa_id:42})).res.status,409);
    });
    it('mapa explicito dry-run preserva tudo e apply registra atomicamente',async()=>{
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (80,?,?,?)',['legado',contas[0].senha,'aluno']);
        const mapa=[{conta_id:80,perfil:'aluno',pessoa_id:42}];
        assert.equal((await migrarVinculos(pool,mapa)).modo,'validado-sem-gravacao');assert.equal((await banco.query('SELECT * FROM conta_pessoa'))[0].length,0);
        await assert.rejects(migrarVinculos(pool,[...mapa,{conta_id:999,perfil:'professor',pessoa_id:41}],true));assert.equal((await banco.query('SELECT * FROM conta_pessoa'))[0].length,0);
        await migrarVinculos(pool,mapa,true);assert.equal((await banco.query('SELECT * FROM conta_pessoa'))[0].length,1);
    });
    it('FK e CHECK impedem pessoa orfa/perfil errado/identidade dupla mesmo por SQL',async()=>{
        await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (80,?,?,?)',['legado',contas[0].senha,'aluno']);
        for(const params of [[80,'aluno',999,null],[80,'professor',null,41],[80,'aluno',42,41],[80,'aluno',null,null]])await assert.rejects(banco.query('INSERT INTO conta_pessoa (usuario_id,perfil,aluno_id,professor_id) VALUES (?,?,?,?)',params));
        await verificarEsquema(banco);
    });
    it('remover pessoa preserva credencial mas impede novo login',async()=>{
        await request('POST','/cadastro',{usuario:'remover',senha:senhaFixture,perfil:'professor',pessoa_id:41});
        assert.equal((await request('DELETE','/usuarios/41?perfil=professor')).res.status,200);
        assert.equal((await banco.query("SELECT * FROM usuarios WHERE usuario='remover'"))[0].length,1);
        assert.equal((await request('POST','/login',{usuario:'remover',senha:senhaFixture},'')).res.status,401);
    });
    it('editar pessoa conserva o vinculo e a senha',async()=>{
        await request('POST','/cadastro',{usuario:'editar',senha:senhaFixture,perfil:'professor',pessoa_id:41});
        const [antes]=await banco.query('SELECT * FROM conta_pessoa');
        assert.equal((await request('PUT','/usuarios/41?perfil=professor',{nome:'Nome atualizado'})).res.status,200);
        assert.deepEqual((await banco.query('SELECT * FROM conta_pessoa'))[0],antes);
        assert.equal((await request('POST','/login',{usuario:'editar',senha:senhaFixture},'')).res.status,200);
    });
    it('atualizacao 003 para 004 preserva senha e nao infere nomes',async()=>{
        await banco.query('DROP TABLE conta_pessoa');
        await banco.query('DELETE FROM schema_migrations WHERE versao>=4');
        const [antes]=await banco.query('SELECT * FROM usuarios');
        assert.deepEqual(await executarMigracoes(banco),{versao:versaoEsperada,aplicadas:Array.from({length:versaoEsperada-4+1},(_,i)=>i+4)});
        assert.deepEqual((await banco.query('SELECT * FROM usuarios'))[0],antes);
        const [[u]]=await banco.query('SELECT senha FROM usuarios WHERE id=1');assert.equal(u.senha,contas[0].senha);
        assert.equal((await banco.query('SELECT * FROM conta_pessoa'))[0].length,0);
    });
    it('restricoes adulteradas impedem a partida mesmo com historico completo',async()=>{
        await banco.query('ALTER TABLE conta_pessoa ALTER CHECK labhist_cp_perfil NOT ENFORCED');
        try { await assert.rejects(verificarEsquema(banco), /Regra de perfil/); }
        finally { await banco.query('ALTER TABLE conta_pessoa ALTER CHECK labhist_cp_perfil ENFORCED'); }
    });
    it('vinculos e relatorios sao administrativos e negam acesso anonimo',async()=>{
        assert.equal((await request('GET','/contas/pendencias',undefined,'')).res.status,401);
        assert.equal((await request('PUT','/contas/1/vinculo',{perfil:'aluno',pessoa_id:42},'')).res.status,401);
        await request('POST','/cadastro',{usuario:'com-vinculo',senha:senhaFixture,perfil:'aluno',pessoa_id:42});
        const login=await request('POST','/login',{usuario:'com-vinculo',senha:senhaFixture},'');const c=login.res.headers.getSetCookie()[0].split(';')[0];
        assert.equal((await request('GET','/contas/pendencias',undefined,c)).res.status,403);
        assert.equal((await request('PUT','/contas/1/vinculo',{perfil:'aluno',pessoa_id:42},c)).res.status,403);
    });
});
