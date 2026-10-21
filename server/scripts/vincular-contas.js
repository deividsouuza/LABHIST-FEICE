import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { carregarConfiguracao } from '../configuracao.js';
import { verificarEsquema, diagnosticoBanco } from '../banco/migrador.js';
import { migrarVinculos } from '../identidades.js';

let pool;
try {
    const [arquivo, opcao, ...extras] = process.argv.slice(2);
    if (!arquivo || (opcao && opcao !== '--apply') || extras.length) throw new Error('Argumentos invalidos.');
    const mapa = JSON.parse(await readFile(arquivo, 'utf8'));
    pool = mysql.createPool({ ...carregarConfiguracao(process.env, false).banco, connectionLimit: 1 });
    await verificarEsquema(pool);
    console.log(JSON.stringify(await migrarVinculos(pool, mapa, opcao === '--apply')));
} catch (erro) {
    console.error(diagnosticoBanco(erro));
    process.exitCode = 1;
} finally { if (pool) await pool.end(); }
