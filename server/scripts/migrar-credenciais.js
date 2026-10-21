import mysql from 'mysql2/promise';
import { carregarConfiguracao } from '../configuracao.js';
import { migrarCredenciais } from '../migracao-credenciais.js';

let banco;
try {
    if (process.argv.slice(2).some(arg => !['--apply', '--dry-run'].includes(arg)) ||
        (process.argv.includes('--apply') && process.argv.includes('--dry-run'))) {
        throw new Error('Argumentos inválidos.');
    }
    const configuracao = carregarConfiguracao(process.env, false);
    banco = await mysql.createConnection(configuracao.banco);
    console.log(JSON.stringify(await migrarCredenciais(banco, process.argv.includes('--apply'))));
} catch {
    console.error('Migração não concluída. Confira ambiente, argumentos, tabela InnoDB e compatibilidade das credenciais; nenhum segredo foi registrado.');
    process.exitCode = 1;
} finally {
    if (banco) await banco.end();
}
