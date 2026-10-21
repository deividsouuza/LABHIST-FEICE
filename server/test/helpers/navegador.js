import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const chromePath = [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(file => file && existsSync(file));

// DevTools nativo, sem pacote adicional, perfil pessoal ou clipboard do usuário.
export async function abrirNavegador(executavel = chromePath) {
    const profile = await mkdtemp(path.join(os.tmpdir(), 'labhist-p12-'));
    const child = spawn(executavel, [
        '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
        '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--disable-sync', '--disable-extensions', 'about:blank'
    ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let socket;
    let sessionId;
    let sequence = 0;
    const pending = new Map();
    const listeners = new Map();
    const errors = [];
    const send = (method, params = {}, targetSession = sessionId) => new Promise((resolve, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error('Timeout DevTools: ' + method));
        }, 10000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params, ...(targetSession ? { sessionId: targetSession } : {}) }));
    });
    const close = async () => {
        if (socket?.readyState === WebSocket.OPEN) {
            await send('Browser.close', {}, null).catch(() => {});
            socket.close();
        }
        if (child.exitCode === null) {
            await new Promise(resolve => {
                const timeout = setTimeout(() => { child.kill(); resolve(); }, 2000);
                child.once('exit', () => { clearTimeout(timeout); resolve(); });
            });
        }
        for (const item of pending.values()) {
            clearTimeout(item.timer);
            item.reject(new Error('Navegador de teste encerrado.'));
        }
        pending.clear();
        // Somente o diretório gerado por mkdtemp é elegível para remoção.
        const resolved = path.resolve(profile);
        if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('labhist-p12-')) {
            throw new Error('Perfil temporário fora do diretório de testes esperado.');
        }
        await rm(resolved, { recursive: true, force: true, maxRetries: 4, retryDelay: 200 });
    };
    try {
        const endpoint = await new Promise((resolve, reject) => {
            let output = '';
            const timer = setTimeout(() => reject(new Error('Chrome não publicou DevTools.')), 10000);
            child.once('error', error => { clearTimeout(timer); reject(error); });
            child.stderr.on('data', chunk => {
                output += chunk;
                const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
                if (match) { clearTimeout(timer); resolve(match[1]); }
            });
        });
        socket = new WebSocket(endpoint);
        await new Promise((resolve, reject) => {
            socket.addEventListener('open', resolve, { once: true });
            socket.addEventListener('error', reject, { once: true });
        });
        socket.addEventListener('message', event => {
            const message = JSON.parse(event.data);
            if (message.id) {
                const item = pending.get(message.id);
                if (!item) return;
                pending.delete(message.id);
                clearTimeout(item.timer);
                if (message.error) item.reject(new Error(message.error.message));
                else item.resolve(message.result);
            } else {
                for (const listener of listeners.get(message.method) || []) {
                    Promise.resolve(listener(message.params, message.sessionId)).catch(error => errors.push(error));
                }
            }
        });
        const version = await send('Browser.getVersion', {}, null);
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
        ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }, null));
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
        return {
            send, close, errors, version,
            on(method, listener) {
                if (!listeners.has(method)) listeners.set(method, new Set());
                listeners.get(method).add(listener);
            },
            async evaluate(expression) {
                const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
                if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
                return result.result.value;
            },
            async key(key) {
                const code = key === 'Backspace' ? 8 : 46;
                await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
                await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
            },
            async waitFor(expression) {
                const end = Date.now() + 5000;
                while (Date.now() < end) {
                    const result = await this.evaluate(expression);
                    if (result) return result;
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
                throw new Error('Condição de página não atingida: ' + expression);
            }
        };
    } catch (error) {
        await close();
        throw error;
    }
}
