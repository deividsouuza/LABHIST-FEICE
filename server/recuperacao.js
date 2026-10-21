import crypto from 'node:crypto';
import {ErroHttp} from './erros-api.js';
import {executarTransacao} from './banco/transacao.js';
import {gerarHash,senhaValida} from './credenciais.js';
import {emailValido} from './email-recuperacao.js';
const mensagem='Se os dados estiverem corretos e houver contato confirmado, você receberá as instruções de recuperação.';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const objeto=(b,chaves)=>{if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!chaves.includes(k)))throw new ErroHttp(400,'Dados inválidos.');};
function limitador(agora){const ips=new Map(),nomes=new Map();return (req,res,next)=>{
    const t=agora(),usuario=typeof req.body?.usuario==='string'?req.body.usuario.trim().toLowerCase():'',grupos=[[ips,req.ip,30],[nomes,hash(usuario||req.ip),10]];
    for(const [map] of grupos)for(const [k,v] of map)if(v.ate<=t)map.delete(k);
    if(grupos.some(([m,k,max])=>(m.get(k)?.n||0)>=max||!m.has(k)&&m.size>=10000))return res.set('Retry-After','900').status(429).json({erro:'Limite de tentativas atingido. Tente novamente mais tarde.'});
    for(const [m,k] of grupos){const v=m.get(k)||{n:0,ate:t+900000};v.n++;m.set(k,v);}next();
};}
async function invalidarMemoria(store,contaId){
    if(typeof store.all!=='function')return;
    const todas=await new Promise((resolve,reject)=>store.all((e,v)=>e?reject(e):resolve(v)));
    for(const [sid,s] of Object.entries(todas||{}))if((s.identidade?.conta_id||s.identidade?.id)===contaId)await new Promise((resolve,reject)=>store.destroy(sid,e=>e?reject(e):resolve()));
}
export function registrarRecuperacao(app,{obterPool,requireAuth,requireAdmin,validarIdRota,responderErro,transporte,origemPublica,store,limparCookie,agora=Date.now,registrador=console}){
    const pendentes=new Set(),limitarSolicitacao=limitador(agora),limitarReset=limitador(agora);
    app.put('/contas/:id/recuperacao',requireAuth,requireAdmin,validarIdRota,async(req,res)=>{
        try{objeto(req.body,['email','confirmado']);const email=typeof req.body.email==='string'?req.body.email.trim():'';if(!emailValido(email)||req.body.confirmado!==true)throw new ErroHttp(400,'Informe e-mail válido e confirmação administrativa.');
            await executarTransacao(obterPool(),async b=>{const [u]=await b.query('SELECT id FROM usuarios WHERE id=? FOR UPDATE',[req.recursoId]);if(!u.length)throw new ErroHttp(404,'Conta não encontrada.');await b.query('DELETE FROM recuperacao_senha WHERE usuario_id=?',[req.recursoId]);await b.query('INSERT INTO contatos_recuperacao (usuario_id,email,confirmado_por) VALUES (?,?,?) ON DUPLICATE KEY UPDATE email=VALUES(email),confirmado_por=VALUES(confirmado_por),confirmado_em=UTC_TIMESTAMP(3)',[req.recursoId,email,req.session.identidade.conta_id||req.session.identidade.id]);});res.json({mensagem:'Contato de recuperação confirmado.'});
        }catch(e){responderErro(res,e);}
    });
    async function processar(usuario,email){
        const token=crypto.randomBytes(32).toString('hex');
        const destino=await executarTransacao(obterPool(),async b=>{
            const [u]=await b.query('SELECT id,sessao_versao FROM usuarios WHERE usuario=? FOR UPDATE',[usuario]);if(!u.length)return null;
            const [c]=await b.query('SELECT email FROM contatos_recuperacao WHERE usuario_id=?',[u[0].id]);if(!c.length||c[0].email.toLowerCase()!==email.toLowerCase())return null;
            await b.query('DELETE FROM recuperacao_senha WHERE usuario_id=?',[u[0].id]);await b.query('INSERT INTO recuperacao_senha (usuario_id,token_hash,versao_sessao,expira_em) VALUES (?,?,?,TIMESTAMPADD(MINUTE,30,UTC_TIMESTAMP(3)))',[u[0].id,hash(token),u[0].sessao_versao]);return c[0].email;
        });
        if(destino)await transporte.enviar({email:destino,url:origemPublica+'/login/redefinir.html#token='+token});
    }
    app.post('/recuperacao/solicitar',limitarSolicitacao,(req,res)=>{
        try{objeto(req.body,['usuario','email']);const usuario=typeof req.body.usuario==='string'?req.body.usuario.trim():'',email=typeof req.body.email==='string'?req.body.email.trim():'';if(!usuario||usuario.length>100||/[\x00-\x1f\x7f]/.test(usuario)||!emailValido(email))throw new ErroHttp(400,'Informe usuário e e-mail válidos.');
            if(!transporte.disponivel||!origemPublica||pendentes.size>=100)return res.status(503).json({erro:'Recuperação temporariamente indisponível. Tente novamente mais tarde.'});
            // A resposta uniforme precede toda consulta/envio: ausência de conta/contato e falha SMTP não criam um oráculo de tempo/status.
            res.json({mensagem});
            let tarefa;tarefa=new Promise(resolve=>setImmediate(resolve)).then(()=>processar(usuario,email)).catch(()=>registrador.error('Falha no processamento de recuperação.')).finally(()=>pendentes.delete(tarefa));pendentes.add(tarefa);
        }catch(e){responderErro(res,e);}
    });
    app.post('/recuperacao/redefinir',limitarReset,async(req,res)=>{
        try{objeto(req.body,['token','novaSenha']);if(typeof req.body.token!=='string'||!/^[a-f0-9]{64}$/.test(req.body.token)||!senhaValida(req.body.novaSenha))throw new ErroHttp(400,'Link inválido ou senha inválida. Solicite novas instruções.');
            const tokenHash=hash(req.body.token),senha=await gerarHash(req.body.novaSenha);
            const contaId=await executarTransacao(obterPool(),async b=>{
                const [referencias]=await b.query('SELECT usuario_id FROM recuperacao_senha WHERE token_hash=?',[tokenHash]);if(!referencias.length)throw new ErroHttp(400,'Link inválido ou expirado. Solicite novas instruções.');
                const id=referencias[0].usuario_id,[u]=await b.query('SELECT id,sessao_versao FROM usuarios WHERE id=? FOR UPDATE',[id]);
                const [tokens]=await b.query('SELECT id,versao_sessao FROM recuperacao_senha WHERE token_hash=? AND usuario_id=? AND consumido_em IS NULL AND expira_em>UTC_TIMESTAMP(3) FOR UPDATE',[tokenHash,id]);
                if(!u.length||!tokens.length||tokens[0].versao_sessao!==u[0].sessao_versao)throw new ErroHttp(400,'Link inválido ou expirado. Solicite novas instruções.');
                await b.query('UPDATE usuarios SET senha=?,sessao_versao=sessao_versao+1 WHERE id=?',[senha,id]);await b.query('UPDATE recuperacao_senha SET consumido_em=UTC_TIMESTAMP(3) WHERE usuario_id=? AND consumido_em IS NULL',[id]);await b.query('DELETE FROM sessoes WHERE conta_id=?',[id]);return id;
            });
            await invalidarMemoria(store,contaId);
            if((req.session.identidade?.conta_id||req.session.identidade?.id)===contaId){await new Promise((resolve,reject)=>req.session.destroy(e=>e?reject(e):resolve()));limparCookie(res);}
            res.json({mensagem:'Senha redefinida. Entre novamente com sua nova senha.'});
        }catch(e){responderErro(res,e);}
    });
    return {aguardar:async()=>{while(pendentes.size)await Promise.allSettled([...pendentes]);}};
}
