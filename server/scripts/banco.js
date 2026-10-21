import mysql from 'mysql2/promise';
import { carregarConfiguracao } from '../configuracao.js';
import { executarMigracoes, verificarEsquema, diagnosticoBanco } from '../banco/migrador.js';
import { diagnosticarProjetos } from '../banco/integridade-projetos.js';

let banco;
try {
    const [comando, ...extras] = process.argv.slice(2);
    if (!['migrate', 'check', 'diagnose'].includes(comando) || extras.length) throw new Error('Argumentos inválidos.');
    banco = await mysql.createConnection(carregarConfiguracao(process.env, false).banco);
    console.log(JSON.stringify(await (comando === 'migrate' ? executarMigracoes(banco) : comando === 'diagnose' ? diagnosticarProjetos(banco) : verificarEsquema(banco))));
} catch (erro) {
    console.error(diagnosticoBanco(erro));
    process.exitCode = 1;
} finally {
    if (banco) await banco.end();
}
