import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import mysql from 'mysql2/promise';

export const mysqld = process.env.MYSQLD_BIN || 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe';
export const mysqlDisponivel = existsSync(mysqld);

// Instância própria: sem ler my.ini, serviço, dados ou credenciais do projeto.
export async function iniciarMysqlTemporario(etapa = 'p01') {
    if (!['p01', 'p04', 'p05', 'p06', 'p07', 'p08', 'p10', 'p15', 'p17', 'p20', 'p21', 'p22', 'p42'].includes(etapa)) throw new Error('Etapa temporária inválida.');
    const prefixo = `labhist-${etapa}-`;
    const diretorio = await mkdtemp(path.join(tmpdir(), prefixo));
    let processo, banco;
    async function encerrar() {
        if (banco) { try { await banco.query('SHUTDOWN'); } catch {} try { await banco.end(); } catch {} }
        if (processo && processo.exitCode === null) {
            const saiu = once(processo, 'exit');
            processo.kill();
            await saiu;
        }
        const alvo = path.resolve(diretorio);
        if (path.dirname(alvo) !== path.resolve(tmpdir()) || !path.basename(alvo).startsWith(prefixo)) throw new Error('Diretório temporário inválido.');
        await rm(alvo, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    }
    try {
        const base = ['--no-defaults', '--no-monitor', '--console', `--basedir=${path.dirname(path.dirname(mysqld))}`, `--datadir=${path.join(diretorio, 'data')}`];
        const inicializador = spawn(mysqld, [...base, '--initialize-insecure'], { windowsHide: true, stdio: 'ignore' });
        const [codigo] = await once(inicializador, 'exit');
        if (codigo !== 0) throw new Error('Falha ao inicializar MySQL descartável.');
        const portaLivre = net.createServer();
        portaLivre.listen(0, '127.0.0.1'); await once(portaLivre, 'listening');
        const port = portaLivre.address().port;
        await new Promise(resolve => portaLivre.close(resolve));
        processo = spawn(mysqld, [...base, `--port=${port}`, '--bind-address=127.0.0.1', '--mysqlx=OFF', '--skip-log-bin'], { windowsHide: true, stdio: 'ignore' });
        const prazo = Date.now() + 60000;
        while (Date.now() < prazo) {
            if (processo.exitCode !== null) throw new Error('MySQL descartável encerrou prematuramente.');
            try { banco = await mysql.createConnection({ host: '127.0.0.1', port, user: 'root', connectTimeout: 500 }); break; } catch {}
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        if (!banco) throw new Error('MySQL descartável indisponível.');
        await banco.query('CREATE DATABASE fixture_p01');
        await banco.query('USE fixture_p01');
        return { banco, encerrar };
    } catch (erro) { await encerrar(); throw erro; }
}
