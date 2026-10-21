import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validarAmbienteTestes,selecionarTestes,planoDeExecucao} from '../scripts/testes.js';
const raiz=fileURLToPath(new URL('../',import.meta.url));
const ambienteFilho={...process.env};delete ambienteFilho.NODE_TEST_CONTEXT;
test('P43: configuração de banco/segredo/preload é recusada sem imprimir valores',()=>{
    for(const nome of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME','DATABASE_URL','MYSQL_HOST','LABHIST_TEST_DB_URL','SESSION_SECRET','NODE_OPTIONS','SMTP_PASSWORD','RECOVERY_PUBLIC_ORIGIN']){
        assert.throws(()=>validarAmbienteTestes({[nome]:'segredo-nao-imprimir'}),e=>e.message.includes(nome)&&!e.message.includes('segredo-nao-imprimir'));
    }
    assert.equal(validarAmbienteTestes({MYSQLD_BIN:'executavel.exe',CHROME_BIN:'chrome.exe'}),'todos');
});
test('P43: argumentos não permitem escolher banco, env-file ou código externo',()=>{for(const arg of ['--db=real','--env-file=.env','--grupo=desconhecido','../index.js'])assert.throws(()=>validarAmbienteTestes({},[arg]));});
test('P43: grupos cobrem todos os testes sem duplicação',()=>{
    const todos=selecionarTestes('todos'),grupos=['seguranca','banco','navegador'].flatMap(selecionarTestes);assert.deepEqual([...grupos].sort(),todos);assert.equal(new Set(grupos).size,todos.length);assert.ok(todos.includes('test/acesso-academico.test.js'));assert.ok(todos.includes('test/download-documentos.test.js'));assert.ok(todos.includes('test/autorizacao.test.js'));assert.ok(selecionarTestes('banco').includes('test/respostas-api.test.js'));assert.ok(selecionarTestes('seguranca').includes('test/uploads.test.js'));const fases=planoDeExecucao('todos');assert.deepEqual(fases.flatMap(f=>f.arquivos).sort(),todos);assert.equal(fases[1].concorrencia,1);assert.deepEqual(fases[1].arquivos,selecionarTestes('navegador'));assert.ok(fases[0].arquivos.every(f=>!fases[1].arquivos.includes(f)));assert.equal(planoDeExecucao('navegador')[0].concorrencia,1);
});
test('P43: execução com configuração real é rejeitada antes de iniciar qualquer suíte',()=>{
    const r=spawnSync(process.execPath,['scripts/testes.js'],{cwd:raiz,env:{...process.env,DB_HOST:'segredo-nao-imprimir'},encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(r.status,1);assert.match(r.stderr,/Ambiente de aplicação recusado/);assert.equal(r.stderr.includes('segredo-nao-imprimir'),false);assert.equal(r.stdout.includes('LABHIST:'),false);
});
test('P43: mesmo contrato passa original e falha com autorização removida somente em memória',()=>{
    const arquivos=['../index.js','../autenticacao.js'].map(p=>new URL(p,import.meta.url)),hash=()=>createHash('sha256').update(Buffer.concat(arquivos.map(p=>readFileSync(p)))).digest('hex'),antes=hash();
    const executar=extra=>spawnSync(process.execPath,['--experimental-vm-modules','--test-reporter=tap','test/fixtures/autorizacao-canario.js',...extra],{cwd:raiz,env:ambienteFilho,encoding:'utf8',windowsHide:true,timeout:15000});
    const original=executar([]);assert.equal(original.status,0,original.stdout+original.stderr);
    const mutado=executar(['sem-admin']);assert.equal(mutado.status,1);assert.match(mutado.stdout,/not ok/);assert.match(mutado.stdout,/403/);assert.equal(hash(),antes);
});
