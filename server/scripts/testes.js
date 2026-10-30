import {spawn} from 'node:child_process';
import {readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mysqld} from '../test/helpers/mysql-temporario.js';
import {chromePath} from '../test/helpers/navegador.js';
const raiz=fileURLToPath(new URL('../',import.meta.url));
const bancos=new Set(['acesso-academico','download-documentos','identidades','esquema','integridade-projetos','transacoes','migracao-credenciais','respostas-api','limpeza-arquivos','subprojetos','listagem-projetos','status-projetos','quizzes','publico','operacao','recuperacao','disponibilidade-quizzes','catalogo-quizzes','resultados-quizzes','historico-quizzes','mensagens','quiz-pin']);
const navegadores=new Set(['formulario-pessoas','respostas-api-navegador','sessao-interface','erros-interface','projetos-interface','quizzes-interface','publico-interface','operacao-interface','recuperacao-interface','quizzes-academico-interface','homologacao-interface','nucleos-interface','criacao-professor-interface','mensagens-interface','quizzes-professor-interface','quiz-pin-interface']);
export function validarAmbienteTestes(env,args=[]){
    const proibidas=Object.keys(env).filter(k=>/^(DB_|MYSQL_(?!D_BIN$)|DATABASE_URL$|SMTP_|RECOVERY_|LABHIST_TEST_DB|SESSION_SECRET$|NODE_OPTIONS$)/i.test(k)&&env[k]);
    if(proibidas.length)throw new Error('Ambiente de aplicação recusado para testes: '+proibidas.join(', ')+'. Use um terminal sem configurações de banco/segredo da aplicação.');
    if(args.length>1||args.some(a=>!['--grupo=todos','--grupo=seguranca','--grupo=banco','--grupo=navegador'].includes(a)))throw new Error('Argumentos recusados. Use somente --grupo=todos|seguranca|banco|navegador. Configuração externa de banco não é aceita.');
    return (args[0]||'--grupo=todos').split('=')[1];
}
export function selecionarTestes(grupo){
    return readdirSync(path.join(raiz,'test')).filter(n=>n.endsWith('.test.js')).sort().filter(n=>{const nome=n.slice(0,-8);return grupo==='todos'||grupo==='banco'&&bancos.has(nome)||grupo==='navegador'&&navegadores.has(nome)||grupo==='seguranca'&&!bancos.has(nome)&&!navegadores.has(nome);}).map(n=>'test/'+n);
}
export function planoDeExecucao(grupo){
    if(grupo!=='todos')return [{nome:grupo,concorrencia:grupo==='navegador'?1:2,arquivos:selecionarTestes(grupo)}];
    const navegador=selecionarTestes('navegador'),privados=new Set(navegador);
    return [{nome:'segurança e banco',concorrencia:2,arquivos:selecionarTestes('todos').filter(f=>!privados.has(f))},{nome:'navegador',concorrencia:1,arquivos:navegador}];
}
export function conferirRequisitos(grupo){
    if(Number(process.versions.node.split('.')[0])<24)throw new Error('Use Node.js 24 ou superior.');
    if(['todos','banco','navegador'].includes(grupo)&&!existsSync(mysqld))throw new Error('MySQL Server local não encontrado. Informe apenas o executável em MYSQLD_BIN; os testes criam seus próprios dados/porta temporários.');
    if(['todos','navegador'].includes(grupo)&&!chromePath)throw new Error('Chrome/Edge não encontrado. Informe o executável em CHROME_BIN.');
}
export async function executar(args=process.argv.slice(2),env=process.env){
    const grupo=validarAmbienteTestes(env,args);conferirRequisitos(grupo);const arquivos=selecionarTestes(grupo);
    if(!arquivos.length)throw new Error('Nenhum teste selecionado.');
    console.log('LABHIST: '+grupo+' — '+arquivos.length+' arquivos; sem .env ou banco da aplicação.');
    for(const fase of planoDeExecucao(grupo)){
        console.log('Fase: '+fase.nome+' — '+fase.arquivos.length+' arquivos, concorrência '+fase.concorrencia+'.');
        const filho=spawn(process.execPath,['--experimental-vm-modules','--test','--test-concurrency='+fase.concorrencia,'--test-reporter=spec',...fase.arquivos],{cwd:raiz,env,windowsHide:true,stdio:'inherit'});
        const codigo=await new Promise((resolve,reject)=>{filho.once('error',reject);filho.once('exit',(codigo,sinal)=>resolve(sinal?1:codigo??1));});
        if(codigo!==0)return codigo;
    }
    return 0;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
    try{process.exitCode=await executar();}catch(e){console.error(e.message);process.exitCode=1;}
}
