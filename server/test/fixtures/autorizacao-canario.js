import assert from 'node:assert/strict';
import {test} from 'node:test';
import {carregarAplicacaoIsolada,criarBancoSimulado,aluno,senhaFixture} from '../helpers/aplicacao.js';
const mutacao=process.argv.includes('sem-admin');
test('canário: aluno não cadastra pessoa mesmo forjando perfil administrativo',async()=>{
    const app=await carregarAplicacaoIsolada({transformarModulo:mutacao?(nome,codigo)=>{
        if(nome!=='./autenticacao.js')return codigo;
        const antes="if (req.session.identidade.perfil !== 'administrador') {";assert.ok(codigo.includes(antes));return codigo.replace(antes,'if (false) {');
    }:undefined});
    const banco=criarBancoSimulado(),chamadas=banco.chamadas;app.configurarBancoDeTeste(banco);const servidor=app.app.listen(0,'127.0.0.1');await new Promise(r=>servidor.once('listening',r));const origem='http://127.0.0.1:'+servidor.address().port;
    try{
        const login=await fetch(origem+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:'fixture-aluno',senha:senhaFixture})});assert.equal(login.status,200);const cookie=login.headers.getSetCookie()[0].split(';')[0];chamadas.length=0;
        const r=await fetch(origem+'/cadastro-dashboard',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({...aluno,perfil:'aluno'})});
        // Esta mesma asserção precisa falhar na cópia com requireAdmin removido.
        assert.equal(r.status,403);assert.equal(chamadas.length,0);
    }finally{servidor.closeAllConnections();await new Promise(r=>servidor.close(r));}
});
