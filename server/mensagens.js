import {ErroHttp,validarIdRota,responderErro} from './erros-api.js';
import {idProjetoValido} from './projetos-validacao.js';
import {confirmarSessao} from './identidades.js';
import {executarTransacao} from './banco/transacao.js';

// Sem inferência por turma, nome, responsável legado ou campos do cliente.
const vinculoAtual=`EXISTS (SELECT 1 FROM projeto_professor pp JOIN projeto_aluno pa ON pa.projeto_id=pp.projeto_id WHERE pp.professor_id=c.professor_id AND pa.aluno_id=c.aluno_id)
 AND EXISTS (SELECT 1 FROM conta_pessoa cp JOIN usuarios up ON up.id=cp.usuario_id AND up.perfil='professor'
 JOIN conta_pessoa ca ON ca.usuario_id=c.aluno_conta_id AND ca.perfil='aluno' AND ca.aluno_id=c.aluno_id
 JOIN usuarios ua ON ua.id=ca.usuario_id AND ua.perfil='aluno'
 WHERE cp.usuario_id=c.professor_conta_id AND cp.perfil='professor' AND cp.professor_id=c.professor_id)`;
const camposMensagem=`id,conversa_id,remetente_id,destinatario_id,conteudo,
 DATE_FORMAT(enviada_em,'%Y-%m-%dT%H:%i:%s.%fZ') AS enviada_em,DATE_FORMAT(lida_em,'%Y-%m-%dT%H:%i:%s.%fZ') AS lida_em`;
function escopo(i){return {sql:`c.${i.perfil}_conta_id=? AND c.${i.perfil}_id=? AND ${vinculoAtual}`,args:[i.conta_id,i.pessoa_id]};}
function objeto(body){if(!body||typeof body!=='object'||Array.isArray(body))throw new ErroHttp(400,'Envie um objeto JSON.');return body;}
function inteiro(valor,padrao,max=2147483647){const n=valor===undefined?padrao:idProjetoValido(valor);if(n===null||n>max)throw new ErroHttp(400,'Paginação ou identificador inválido.');return n;}
function paginar(query){return {pagina:inteiro(query.pagina,1,10000),limite:inteiro(query.limite,30,50)};}
function busca(query){const q=query.busca??'';if(typeof q!=='string'||Array.from(q).length>80||/[\x00-\x1f\x7f]/.test(q))throw new ErroHttp(400,'Busca inválida; use até 80 caracteres.');return q.trim();}
function academico(req,res,next){if(!['professor','aluno'].includes(req.session.identidade?.perfil))return res.status(403).json({erro:'Mensagens privadas disponíveis apenas a professores e alunos.'});next();}

async function autorizarPar(banco,professor,aluno,travar=false){
    const [rows]=await banco.query(`SELECT pp.projeto_id FROM projeto_professor pp JOIN projeto_aluno pa ON pa.projeto_id=pp.projeto_id WHERE pp.professor_id=? AND pa.aluno_id=? LIMIT 1${travar?' FOR SHARE':''}`,[professor,aluno]);
    if(!rows.length)throw new ErroHttp(403,'Não há vínculo de projeto autorizado para esta conversa.');
}
async function pessoaConta(banco,conta,perfil,pessoa,travar=false){
    const [rows]=await banco.query(`SELECT u.id AS conta_id,p.id AS pessoa_id,p.nome FROM usuarios u JOIN conta_pessoa cp ON cp.usuario_id=u.id AND cp.perfil=u.perfil JOIN ${perfil} p ON p.id=cp.${perfil}_id WHERE u.id=? AND u.perfil=?${pessoa!==undefined?' AND p.id=?':''}${travar?' FOR SHARE':''}`,[conta,perfil,...(pessoa!==undefined?[pessoa]:[])]);
    if(!rows.length)throw new ErroHttp(403,'Participante indisponível para esta conversa.');
    return {...rows[0],perfil};
}
async function autorizarConversa(banco,id,identidade,travar=false){
    const [rows]=await banco.query('SELECT * FROM mensagem_conversa WHERE id=?'+(travar?' FOR UPDATE':''),[id]);
    const c=rows[0];
    if(!c||c[identidade.perfil+'_conta_id']!==identidade.conta_id||c[identidade.perfil+'_id']!==identidade.pessoa_id)throw new ErroHttp(404,'Conversa não encontrada.');
    const perfil=identidade.perfil==='professor'?'aluno':'professor';
    const participante=await pessoaConta(banco,c[perfil+'_conta_id'],perfil,c[perfil+'_id'],travar);
    await autorizarPar(banco,c.professor_id,c.aluno_id,travar);
    return {c,participante};
}

export function registrarMensagens(app,{obterPool,requireAuth,requireIdentidadeAtual,agora=Date.now}){
    const limites=new Map();
    const protegerEnvio=(req,res,next)=>{
        const t=agora();for(const [k,v] of limites)if(t-v.inicio>=60000)limites.delete(k);
        const k=req.identidadeAcesso.conta_id,v=limites.get(k)||{inicio:t,n:0};
        if(v.n>=30||(!limites.has(k)&&limites.size>=10000))return res.set('Retry-After','60').status(429).json({erro:'Limite de envios atingido. Aguarde um minuto.'});
        v.n++;limites.set(k,v);next();
    };
    const acesso=[requireAuth,academico,requireIdentidadeAtual];
    const rota=fn=>async(req,res)=>{res.set('Cache-Control','no-store');try{await fn(req,res);}catch(e){responderErro(res,e,'Não foi possível concluir a operação de mensagens.');}};

    app.get('/mensagens/contatos',...acesso,rota(async(req,res)=>{
        const i=req.identidadeAcesso,perfil=i.perfil==='professor'?'aluno':'professor',{pagina,limite}=paginar(req.query),q=busca(req.query);
        const [rows]=await obterPool().query(`SELECT u.id AS conta_id,p.id AS pessoa_id,p.nome FROM conta_pessoa cp JOIN usuarios u ON u.id=cp.usuario_id AND u.perfil=cp.perfil JOIN ${perfil} p ON p.id=cp.${perfil}_id
        WHERE cp.perfil=? AND EXISTS (SELECT 1 FROM projeto_professor pp JOIN projeto_aluno pa ON pa.projeto_id=pp.projeto_id WHERE ${i.perfil==='professor'?'pp.professor_id=? AND pa.aluno_id=p.id':'pa.aluno_id=? AND pp.professor_id=p.id'})
        AND (?='' OR LOCATE(?,p.nome)>0) ORDER BY p.nome,p.id LIMIT ? OFFSET ?`,[perfil,i.pessoa_id,q,q,limite+1,(pagina-1)*limite]);
        res.json({contatos:rows.slice(0,limite).map(p=>({...p,perfil})),pagina,tem_mais:rows.length>limite});
    }));
    app.get('/mensagens/resumo',...acesso,rota(async(req,res)=>{
        const i=req.identidadeAcesso,e=escopo(i);
        const [rows]=await obterPool().query(`SELECT COUNT(*) AS nao_lidas FROM mensagem m JOIN mensagem_conversa c ON c.id=m.conversa_id WHERE m.destinatario_id=? AND m.lida_em IS NULL AND ${e.sql}`,[i.conta_id,...e.args]);
        res.json({nao_lidas:Number(rows[0].nao_lidas)});
    }));
    app.get('/mensagens/conversas',...acesso,rota(async(req,res)=>{
        const i=req.identidadeAcesso,e=escopo(i),{pagina,limite}=paginar(req.query),q=busca(req.query),perfil=i.perfil==='professor'?'aluno':'professor',alvo=perfil==='aluno'?'a':'p';
        const [rows]=await obterPool().query(`SELECT c.id,c.${perfil}_conta_id AS conta_id,c.${perfil}_id AS pessoa_id,${alvo}.nome,
        m.id AS ultima_id,LEFT(m.conteudo,160) AS previa,m.remetente_id AS ultimo_remetente,DATE_FORMAT(m.enviada_em,'%Y-%m-%dT%H:%i:%s.%fZ') AS ultima_em,
        (SELECT COUNT(*) FROM mensagem n WHERE n.conversa_id=c.id AND n.destinatario_id=? AND n.lida_em IS NULL) AS nao_lidas
        FROM mensagem_conversa c JOIN professor p ON p.id=c.professor_id JOIN aluno a ON a.id=c.aluno_id
        LEFT JOIN mensagem m ON m.id=(SELECT MAX(x.id) FROM mensagem x WHERE x.conversa_id=c.id)
        WHERE ${e.sql} AND (?='' OR LOCATE(?,${alvo}.nome)>0) ORDER BY COALESCE(m.id,0) DESC,c.id DESC LIMIT ? OFFSET ?`,[i.conta_id,...e.args,q,q,limite+1,(pagina-1)*limite]);
        res.json({conversas:rows.slice(0,limite).map(r=>({id:r.id,participante:{conta_id:r.conta_id,pessoa_id:r.pessoa_id,nome:r.nome,perfil},nao_lidas:Number(r.nao_lidas),ultima_mensagem:r.ultima_id?{id:r.ultima_id,conteudo:r.previa,remetente_id:r.ultimo_remetente,enviada_em:r.ultima_em}:null})),pagina,tem_mais:rows.length>limite});
    }));
    app.post('/mensagens/conversas',...acesso,protegerEnvio,rota(async(req,res)=>{
        const destinatario=inteiro(objeto(req.body).destinatario_id,undefined);
        if(!destinatario)throw new ErroHttp(400,'Informe o destinatário.');
        const resultado=await executarTransacao(obterPool(),async banco=>{
            const i=await confirmarSessao(banco,req.session.identidade,true),perfil=i.perfil==='professor'?'aluno':'professor';
            if(destinatario===i.conta_id)throw new ErroHttp(403,'Selecione um participante do outro perfil.');
            const p=await pessoaConta(banco,destinatario,perfil,undefined,true);
            const prof=i.perfil==='professor'?i.pessoa_id:p.pessoa_id,aluno=i.perfil==='aluno'?i.pessoa_id:p.pessoa_id;
            await autorizarPar(banco,prof,aluno,true);
            const [r]=await banco.query(`INSERT INTO mensagem_conversa (professor_conta_id,professor_id,aluno_conta_id,aluno_id,criada_em) VALUES (?,?,?,?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,[i.perfil==='professor'?i.conta_id:p.conta_id,prof,i.perfil==='aluno'?i.conta_id:p.conta_id,aluno]);
            return {id:r.insertId,participante:p};
        });res.status(200).json(resultado);
    }));
    app.get('/mensagens/conversas/:id/mensagens',...acesso,validarIdRota,rota(async(req,res)=>{
        const antes=req.query.antes===undefined?null:inteiro(req.query.antes),apos=req.query.apos===undefined?null:inteiro(req.query.apos),limite=inteiro(req.query.limite,50,100);
        if(antes!==null&&apos!==null)throw new ErroHttp(400,'Use apenas um cursor por consulta.');
        const banco=obterPool(),i=req.identidadeAcesso,{c,participante}=await autorizarConversa(banco,req.recursoId,i);
        const [rows]=await banco.query(`SELECT ${camposMensagem} FROM mensagem WHERE conversa_id=?${antes!==null?' AND id<?':apos!==null?' AND id>?':''} ORDER BY id ${apos!==null?'ASC':'DESC'} LIMIT ?`,[req.recursoId,...(antes!==null?[antes]:apos!==null?[apos]:[]),limite+1]);
        const mensagens=rows.slice(0,limite);if(apos===null)mensagens.reverse();
        res.json({conversa_id:req.recursoId,participante,mensagens,tem_mais:rows.length>limite,lidas_ate:c[i.perfil==='professor'?'aluno_leu_ate':'professor_leu_ate']});
    }));
    app.post('/mensagens/conversas/:id/mensagens',...acesso,validarIdRota,protegerEnvio,rota(async(req,res)=>{
        const body=objeto(req.body),conteudo=typeof body.conteudo==='string'?body.conteudo.trim():'';
        if(!conteudo||Array.from(conteudo).length>4000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\uD800-\uDFFF]/u.test(conteudo))throw new ErroHttp(400,'Escreva uma mensagem válida com até 4000 caracteres.');
        if(typeof body.cliente_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.cliente_id))throw new ErroHttp(400,'Identificador de envio inválido.');
        const mensagem=await executarTransacao(obterPool(),async banco=>{
            const i=await confirmarSessao(banco,req.session.identidade,true),{participante}=await autorizarConversa(banco,req.recursoId,i,true);
            const [existentes]=await banco.query(`SELECT ${camposMensagem} FROM mensagem WHERE remetente_id=? AND cliente_id=?`,[i.conta_id,body.cliente_id]);
            if(existentes.length){if(existentes[0].conversa_id!==req.recursoId||existentes[0].conteudo!==conteudo)throw new ErroHttp(409,'Identificador de envio já utilizado.');return existentes[0];}
            const [r]=await banco.query('INSERT INTO mensagem (conversa_id,remetente_id,destinatario_id,cliente_id,conteudo,enviada_em) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))',[req.recursoId,i.conta_id,participante.conta_id,body.cliente_id,conteudo]);
            return (await banco.query(`SELECT ${camposMensagem} FROM mensagem WHERE id=?`,[r.insertId]))[0][0];
        });res.status(200).json({mensagem});
    }));
    app.post('/mensagens/conversas/:id/leitura',...acesso,validarIdRota,rota(async(req,res)=>{
        const ate=inteiro(objeto(req.body).ate_id,undefined);if(!ate)throw new ErroHttp(400,'Informe a última mensagem exibida.');
        await executarTransacao(obterPool(),async banco=>{
            const i=await confirmarSessao(banco,req.session.identidade,true);await autorizarConversa(banco,req.recursoId,i,true);
            const [rows]=await banco.query('SELECT id FROM mensagem WHERE conversa_id=? AND id=?',[req.recursoId,ate]);if(!rows.length)throw new ErroHttp(400,'Mensagem fora da conversa.');
            await banco.query('UPDATE mensagem SET lida_em=UTC_TIMESTAMP(3) WHERE conversa_id=? AND destinatario_id=? AND id<=? AND lida_em IS NULL',[req.recursoId,i.conta_id,ate]);
            await banco.query(`UPDATE mensagem_conversa SET ${i.perfil}_leu_ate=GREATEST(${i.perfil}_leu_ate,?) WHERE id=?`,[ate,req.recursoId]);
        });res.json({mensagem:'Leitura registrada.'});
    }));
}
