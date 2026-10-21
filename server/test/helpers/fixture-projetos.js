import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import { iniciarMysqlTemporario } from './mysql-temporario.js';
import { carregarAplicacaoIsolada,contas,senhaFixture } from './aplicacao.js';
import { executarMigracoes } from '../../banco/migrador.js';

export async function fixtureProjetos(opcoes={}){
    const instancia=await iniciarMysqlTemporario('p42'),banco=instancia.banco;
    let pool,servidor;
    const chamadas=[],cookies={};
    const fechar=async()=>{servidor?.closeAllConnections();if(servidor)await new Promise(r=>servidor.close(r));if(pool)await pool.end();await instancia.encerrar();};
    try{
        await executarMigracoes(banco);
        await banco.query("INSERT INTO professor (id,nome,email) VALUES (41,'Professor A','privado@test.invalid'),(43,'Professor B',null)");
        await banco.query("INSERT INTO aluno (id,nome,email) VALUES (42,'Aluno A','privado@test.invalid'),(44,'Aluno B',null)");
        for(const c of contas.slice(0,3)){await banco.query('INSERT INTO usuarios (id,usuario,senha,perfil) VALUES (?,?,?,?)',[c.id,c.usuario,c.senha,c.perfil]);if(c.perfil!=='administrador')await banco.query(`INSERT INTO conta_pessoa (usuario_id,perfil,${c.perfil}_id) VALUES (?,?,?)`,[c.id,c.perfil,c.id]);}
        pool=mysql.createPool({host:'127.0.0.1',port:banco.config.port,user:'root',database:'fixture_p01',connectionLimit:4});
        const app=await carregarAplicacaoIsolada(opcoes);let falhar=null;
        app.configurarBancoDeTeste({query(sql,args){chamadas.push({sql,args});if(falhar?.test(sql))return Promise.reject(new Error('segredo-fixture'));return pool.query(sql,args);},getConnection:()=>pool.getConnection()});
        servidor=app.app.listen(opcoes.portaHttp||0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));const origem=`http://127.0.0.1:${servidor.address().port}`;
        async function request(url,papel='administrador',options={}){
            const r=await fetch(origem+url,{...options,headers:{...(cookies[papel]?{Cookie:cookies[papel]}:{}),...options.headers}});return {status:r.status,data:await r.json()};
        }
        for(const c of contas.slice(0,3)){const r=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:c.usuario,senha:senhaFixture})});assert.equal(r.status,200);cookies[c.perfil]=r.headers.getSetCookie()[0].split(';')[0];}
        async function preencher(n){
            for(const t of ['subprojeto_aluno','subprojeto','limpeza_arquivos','documentos','projeto_aluno','projeto_professor','projeto'])await banco.query(`DELETE FROM ${t}`);
            if(!n)return;
            const rows=Array.from({length:n},(_,i)=>[i+51,`Projeto ${i}`,'Descrição original | ç','Objetivo',41]);
            await banco.query('INSERT INTO projeto (id,titulo,descricao,objetivo,professor_id) VALUES ?',[rows]);
            await banco.query('INSERT INTO projeto_professor (projeto_id,professor_id) VALUES ?',[rows.map(r=>[r[0],41])]);
            await banco.query('INSERT INTO projeto_aluno (projeto_id,aluno_id) VALUES ?',[rows.flatMap(r=>[[r[0],42],[r[0],44]])]);
        }
        async function medir(n){await preencher(n);chamadas.length=0;const t=performance.now(),r=await request('/projetos');assert.equal(r.status,200);assert.equal(r.data.length,n);return {n,consultas:chamadas.length,ms:Number((performance.now()-t).toFixed(3))};}
        return {banco,app,pool,chamadas,request,preencher,medir,fechar,cookies,origem,falhar:re=>{falhar=re;}};
    }catch(e){await fechar();throw e;}
}
