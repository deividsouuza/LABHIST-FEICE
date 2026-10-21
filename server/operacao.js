import session from 'express-session';
import crypto from 'node:crypto';
import net from 'node:net';
export function configurarOperacao(env={}){
    const producao=env.NODE_ENV==='production';
    const origem=(s,nome)=>{try{const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.origin!==s||u.username||u.password||producao&&u.protocol!=='https:')throw 0;return u.origin;}catch{throw new Error('Origem inválida: '+nome+'.');}};
    const appOrigin=env.APP_ORIGIN?origem(env.APP_ORIGIN,'APP_ORIGIN'):null;
    if(producao&&!appOrigin)throw new Error('APP_ORIGIN HTTPS obrigatória em produção.');
    const allowlist=(env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean).map(s=>origem(s,'CORS_ORIGINS'));
    const apiPublica=env.API_PUBLIC_ORIGIN?origem(env.API_PUBLIC_ORIGIN,'API_PUBLIC_ORIGIN'):'';
    const trustProxy=(env.TRUST_PROXY||'').split(',').map(s=>s.trim()).filter(Boolean);
    for(const s of trustProxy){const [ip,mask,...extra]=s.split('/'),tipo=net.isIP(ip);if(extra.length||!tipo||mask!==undefined&&(!/^\d+$/.test(mask)||Number(mask)>(tipo===4?32:128)))throw new Error('TRUST_PROXY exige IP/subrede explícitos.');}
    if(producao&&!trustProxy.length)throw new Error('TRUST_PROXY explícito obrigatório em produção.');
    const store=env.SESSION_STORE||'mysql';if(!['mysql','memory'].includes(store)||producao&&store!=='mysql')throw new Error('SESSION_STORE inválido; produção exige mysql.');
    const ttlMs=8*60*60*1000;
    return {producao,appOrigin,allowlist,apiPublica,trustProxy,store,ttlMs,cookie:{httpOnly:true,sameSite:'lax',secure:producao}};
}
export function protegerOrigem(opcoes){return (req,res,next)=>{
    const origem=req.get('Origin');if(!origem)return next();
    const propria=opcoes.appOrigin||req.protocol+'://'+req.get('host');
    if(origem===propria||opcoes.allowlist.includes(origem))return next();
    res.status(403).json({erro:'Origem não permitida.'});
};}
export function corsOperacao(opcoes){return (req,callback)=>{const origem=req.get('Origin'),propria=opcoes.appOrigin||req.protocol+'://'+req.get('host');callback(null,{origin:origem&&(origem===propria||opcoes.allowlist.includes(origem))?origem:false,credentials:true,methods:['GET','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type'],maxAge:600});};}
const chave=sid=>crypto.createHash('sha256').update(sid).digest('hex');
export class StoreMysql extends session.Store{
    constructor(obterPool,ttlMs){super();this.obterPool=obterPool;this.ttlMs=ttlMs;}
    get(sid,cb){this.ler(sid).then(s=>cb(null,s),()=>cb(new Error('Falha ao consultar sessão.')));}
    async ler(sid){const [rows]=await this.obterPool().query("SELECT s.dados FROM sessoes s JOIN usuarios u ON u.id=s.conta_id WHERE s.sid=? AND s.expira_em>UTC_TIMESTAMP(3) AND u.sessao_versao=COALESCE(JSON_EXTRACT(s.dados,'$.identidade.versao_sessao'),0)",[chave(sid)]);return rows.length?JSON.parse(rows[0].dados):null;}
    set(sid,sess,cb=()=>{}){const id=sess.identidade?.conta_id||sess.identidade?.id||null;if(!id)return cb();
        this.obterPool().query('INSERT INTO sessoes (sid,dados,conta_id,expira_em) SELECT ?,?,?,TIMESTAMPADD(MICROSECOND,?,UTC_TIMESTAMP(3)) FROM usuarios WHERE id=? AND sessao_versao=? ON DUPLICATE KEY UPDATE dados=VALUES(dados),conta_id=VALUES(conta_id),expira_em=VALUES(expira_em)',[chave(sid),JSON.stringify(sess),id,this.ttlMs*1000,id,sess.identidade.versao_sessao||0])
        .then(()=>this.obterPool().query('DELETE FROM sessoes WHERE expira_em<=UTC_TIMESTAMP(3) LIMIT 100')).then(()=>cb(),()=>cb(new Error('Falha ao salvar sessão.')));
    }
    touch(sid,sess,cb=()=>{}){this.obterPool().query('UPDATE sessoes SET expira_em=TIMESTAMPADD(MICROSECOND,?,UTC_TIMESTAMP(3)) WHERE sid=? AND expira_em>UTC_TIMESTAMP(3)',[this.ttlMs*1000,chave(sid)]).then(()=>cb(),()=>cb(new Error('Falha ao renovar sessão.')));}
    destroy(sid,cb=()=>{}){this.obterPool().query('DELETE FROM sessoes WHERE sid=?',[chave(sid)]).then(()=>cb(),()=>cb(new Error('Falha ao encerrar sessão.')));}
}
