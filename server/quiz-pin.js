import crypto from 'node:crypto';
import {ErroHttp,validarIdRota,responderErro} from './erros-api.js';
import {executarTransacao} from './banco/transacao.js';
import {confirmarSessao} from './identidades.js';
import {autorizarProjeto} from './acesso-academico.js';
import {idProjetoValido} from './projetos-validacao.js';
import {carregarQuiz} from './quizzes.js';
import {corrigirQuiz} from './correcao-quizzes.js';
import {atividadeSemGabarito,camposResultado,mapearResultado,lerResultado,salvarResultadoAluno} from './resultados-quizzes.js';

const indisponivel=()=>new ErroHttp(404,'PIN inválido ou quiz indisponível.');
const acessoInvalido=()=>new ErroHttp(403,'Acesso expirado ou encerrado. Informe o PIN novamente.');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const pinDto=p=>p?{codigo:p.codigo,ativo:p.ativo===1&&p.estado!=='arquivado'}:null;
export async function lerPinQuiz(banco,id){const [rows]=await banco.query('SELECT p.codigo,p.ativo,q.estado FROM quiz_pin p JOIN quiz q ON q.id=p.quiz_id WHERE p.quiz_id=?',[id]);return pinDto(rows[0]);}
export async function gerarPinQuiz(banco,id,gerar=()=>crypto.randomInt(0,100000000).toString().padStart(8,'0')){
    const [rows]=await banco.query('SELECT codigo FROM quiz_pin WHERE quiz_id=? FOR UPDATE',[id]);
    for(let n=0;n<8;n++){
        const codigo=gerar();if(!/^\d{8}$/.test(codigo))throw new Error('Gerador de PIN inválido.');if(codigo===rows[0]?.codigo)continue;
        try{
            if(rows.length)await banco.query('UPDATE quiz_pin SET codigo=?,ativo=1,versao=versao+1,criado_em=UTC_TIMESTAMP(3) WHERE quiz_id=?',[codigo,id]);
            else await banco.query('INSERT INTO quiz_pin (quiz_id,codigo,ativo,versao,criado_em) VALUES (?,?,1,1,UTC_TIMESTAMP(3))',[id,codigo]);
            return {codigo,ativo:true};
        }catch(e){if(e.code!=='ER_DUP_ENTRY')throw e;}
    }
    throw new Error('Não foi possível reservar PIN único.');
}
function validarObjeto(b,chaves){if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==chaves.length||chaves.some(k=>!Object.hasOwn(b,k)))throw new ErroHttp(400,'Confira os dados enviados.');}
async function identidadePin(banco,req,travar=false){
    const sessao=req.session.identidade;
    if(!sessao)return {perfil:'visitante'};
    if(sessao.origem!=='login')throw new ErroHttp(401,'Entre novamente para continuar.');
    if(sessao.perfil!=='aluno')throw new ErroHttp(403,'Use a área de visitante para uma participação anônima.');
    const i=await confirmarSessao(banco,sessao,travar),[rows]=await banco.query('SELECT sessao_versao FROM usuarios WHERE id=?'+(travar?' FOR SHARE':''),[i.conta_id]);
    if(!rows.length||rows[0].sessao_versao!==(sessao.versao_sessao||0))throw new ErroHttp(401,'Entre novamente para continuar.');
    return {...i,versao_sessao:rows[0].sessao_versao};
}
async function quizPorPin(banco,id,versao,travar=false){
    // Mesma ordem de locks das submissões/edições existentes: quiz antes do PIN.
    const [rows]=await banco.query('SELECT id,estado,projeto_id,autor_conta_id,autor_professor_id FROM quiz WHERE id=?'+(travar?' FOR UPDATE':''),[id]);
    const q=rows[0];if(!q||q.estado==='arquivado'||q.projeto_id===null)throw indisponivel();
    if(q.autor_conta_id!==null){
        const [autores]=await banco.query(`SELECT u.id FROM usuarios u JOIN conta_pessoa cp ON cp.usuario_id=u.id AND cp.perfil=u.perfil JOIN projeto_professor pp ON pp.professor_id=cp.professor_id WHERE u.id=? AND u.perfil='professor' AND cp.professor_id=? AND pp.projeto_id=? LIMIT 1${travar?' FOR SHARE':''}`,[q.autor_conta_id,q.autor_professor_id,q.projeto_id]);
        if(!autores.length)throw indisponivel();
    }
    const [pins]=await banco.query('SELECT codigo,ativo,versao FROM quiz_pin WHERE quiz_id=?'+(travar?' FOR UPDATE':''),[id]);
    if(!pins.length||pins[0].ativo!==1||versao!==undefined&&pins[0].versao!==versao)throw indisponivel();
    return {q,pin:pins[0]};
}
async function autorizarGestao(banco,req,id){
    const i=await confirmarSessao(banco,req.session.identidade,true),[rows]=await banco.query('SELECT id,projeto_id,estado,autor_conta_id,autor_professor_id FROM quiz WHERE id=? FOR UPDATE',[id]);
    const q=rows[0];if(!q||i.perfil!=='administrador'&&(q.autor_conta_id!==i.conta_id||q.autor_professor_id!==i.pessoa_id))throw new ErroHttp(404,'Quiz não encontrado.');
    if(i.perfil==='professor'){if(q.projeto_id===null)throw new ErroHttp(403,'Quiz sem projeto autorizado.');await autorizarProjeto(banco,q.projeto_id,i,true);}
    return q;
}
async function resultadoVisitante(banco,id,chave){const [r]=await banco.query('SELECT '+camposResultado+' FROM quiz_resultado_visitante WHERE quiz_id=? AND participacao_hash=?',[id,chave]);return r.length?mapearResultado(r[0]):null;}

export function registrarQuizPin(app,{obterPool,requireAuth,requireIdentidadeAtual,sessionSecret,agora=Date.now}){
    if(typeof sessionSecret!=='string'||Buffer.byteLength(sessionSecret)<32)throw new Error('Segredo de sessão obrigatório para acesso por PIN.');
    const chave=crypto.createHmac('sha256',sessionSecret).update('labhist:quiz-pin:v1').digest(),janelas=new Map();
    const assinatura=p=>crypto.createHmac('sha256',chave).update(p).digest();
    const emitir=(q,p,i)=>{
        const dados={v:1,q:q.id,p:p.versao,t:i.perfil,c:i.conta_id||null,a:i.pessoa_id||null,s:i.versao_sessao??null,exp:Math.floor(agora()/1000)+7200,n:crypto.randomBytes(24).toString('hex')};
        const payload=Buffer.from(JSON.stringify(dados)).toString('base64url');return payload+'.'+assinatura(payload).toString('base64url');
    };
    const verificar=token=>{
        if(typeof token!=='string'||token.length>1024||!(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)))throw acessoInvalido();
        const [p,s]=token.split('.'),b=Buffer.from(s,'base64url'),esperada=assinatura(p);if(b.toString('base64url')!==s||b.length!==esperada.length||!crypto.timingSafeEqual(b,esperada))throw acessoInvalido();
        let d;try{d=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));}catch{throw acessoInvalido();}
        if(!d||d.v!==1||idProjetoValido(d.q)!==d.q||!Number.isInteger(d.p)||d.p<1||!['aluno','visitante'].includes(d.t)||!Number.isSafeInteger(d.exp)||d.exp<=Math.floor(agora()/1000)||d.exp>Math.floor(agora()/1000)+7200||typeof d.n!=='string'||!/^[a-f0-9]{48}$/.test(d.n))throw acessoInvalido();
        if(d.t==='aluno'&&(idProjetoValido(d.c)!==d.c||idProjetoValido(d.a)!==d.a||!Number.isInteger(d.s)||d.s<0)||d.t==='visitante'&&(d.c!==null||d.a!==null||d.s!==null))throw acessoInvalido();
        return d;
    };
    const janela=req=>{const t=agora();for(const [k,v] of janelas)if(t-v.inicio>=60000)janelas.delete(k);const ip=req.ip||req.socket.remoteAddress;if(!janelas.has(ip)){if(janelas.size>=10000)return null;janelas.set(ip,{inicio:t,requisicoes:0,erros:0});}return janelas.get(ip);};
    const limitar=(req,res,next)=>{const j=janela(req);if(!j||j.requisicoes>=300||req.path==='/quizzes/pin/entrar'&&j.erros>=30)return res.set('Retry-After','60').status(429).json({erro:'Limite de tentativas atingido. Aguarde um minuto.'});j.requisicoes++;req.janelaPin=j;next();};
    const rota=fn=>async(req,res)=>{res.set('Cache-Control','no-store');try{await fn(req,res);}catch(e){responderErro(res,e,'Não foi possível concluir a participação no quiz.');}};
    const carregarAcesso=async(banco,req)=>{
        const d=verificar(req.body.acesso),i=await identidadePin(banco,req,true);
        if(d.t==='aluno'&&i.perfil==='visitante')throw new ErroHttp(401,'Entre novamente para consultar a participação da sua conta.');
        if(d.t!==i.perfil||d.t==='aluno'&&(d.c!==i.conta_id||d.a!==i.pessoa_id||d.s!==i.versao_sessao))throw acessoInvalido();
        try{await quizPorPin(banco,d.q,d.p,true);}catch(e){if(e instanceof ErroHttp&&e.status===404)throw acessoInvalido();throw e;}
        return {d,i,q:await carregarQuiz(banco,d.q,true),chave:hash(req.body.acesso)};
    };
    const gestor=(req,res,next)=>{if(!['professor','administrador'].includes(req.session.identidade?.perfil))return res.status(403).json({erro:'Acesso não permitido.'});next();};
    app.get('/quizzes/:id/pin',requireAuth,gestor,validarIdRota,requireIdentidadeAtual,rota(async(req,res)=>{
        const pin=await executarTransacao(obterPool(),async b=>{await autorizarGestao(b,req,req.recursoId);return lerPinQuiz(b,req.recursoId);});res.json({pin});
    }));
    app.post('/quizzes/:id/pin',requireAuth,gestor,validarIdRota,requireIdentidadeAtual,rota(async(req,res)=>{
        validarObjeto(req.body,['acao']);if(!['gerar','desativar'].includes(req.body.acao))throw new ErroHttp(400,'Ação de PIN inválida.');
        const pin=await executarTransacao(obterPool(),async b=>{
            const q=await autorizarGestao(b,req,req.recursoId);
            if(req.body.acao==='gerar'){if(q.estado==='arquivado'||q.projeto_id===null)throw new ErroHttp(409,'Vincule um projeto e mantenha o quiz não arquivado para gerar o PIN.');return gerarPinQuiz(b,q.id);}
            await b.query('UPDATE quiz_pin SET ativo=0,versao=versao+1 WHERE quiz_id=?',[q.id]);return lerPinQuiz(b,q.id);
        });res.json({mensagem:'PIN atualizado.',pin});
    }));
    app.post('/quizzes/pin/entrar',limitar,rota(async(req,res)=>{
        validarObjeto(req.body,['pin','modo']);if(!['aluno','visitante'].includes(req.body.modo))throw new ErroHttp(400,'Modo de participação inválido.');if(typeof req.body.pin!=='string'||!/^\d{8}$/.test(req.body.pin)){req.janelaPin.erros++;throw new ErroHttp(400,'Informe os 8 dígitos do PIN.');}
        try{
            const dados=await executarTransacao(obterPool(),async b=>{
                const i=await identidadePin(b,req,true);
                if(req.body.modo==='aluno'&&i.perfil!=='aluno')throw new ErroHttp(401,'Entre novamente para responder com sua conta.');
                if(req.body.modo!==i.perfil)throw new ErroHttp(403,'Use a área de participação correspondente à sua conta.');
                const [rows]=await b.query('SELECT quiz_id FROM quiz_pin WHERE codigo=? AND ativo=1',[req.body.pin]);if(!rows.length)throw indisponivel();
                const {q,pin}=await quizPorPin(b,rows[0].quiz_id,undefined,true);if(pin.codigo!==req.body.pin)throw indisponivel();
                const acesso=emitir(q,pin,i),quiz=await carregarQuiz(b,q.id,true);
                return {acesso,atividade:atividadeSemGabarito(quiz,i.perfil==='aluno'?await lerResultado(b,q.id,i.pessoa_id):null)};
            });res.json(dados);
        }catch(e){if(e instanceof ErroHttp&&e.status===404)req.janelaPin.erros++;throw e;}
    }));
    app.post('/quizzes/pin/atividade',limitar,rota(async(req,res)=>{
        validarObjeto(req.body,['acesso']);const dados=await executarTransacao(obterPool(),async b=>{const {q,i,chave}=await carregarAcesso(b,req);return atividadeSemGabarito(q,i.perfil==='aluno'?await lerResultado(b,q.id,i.pessoa_id):await resultadoVisitante(b,q.id,chave));});res.json(dados);
    }));
    app.post('/quizzes/pin/respostas',limitar,rota(async(req,res)=>{
        validarObjeto(req.body,['acesso','respostas']);if(!Array.isArray(req.body.respostas)||!req.body.respostas.length||req.body.respostas.length>50)throw new ErroHttp(400,'Responda todas as perguntas.');
        const dados=await executarTransacao(obterPool(),async b=>{
            const {q,i,chave}=await carregarAcesso(b,req);
            if(i.perfil==='aluno')return salvarResultadoAluno(b,q,i,req.body.respostas);
            const c=corrigirQuiz(q.perguntas,req.body.respostas),existente=await resultadoVisitante(b,q.id,chave);
            if(existente){
                const [anteriores]=await b.query('SELECT pergunta_id,alternativa_id FROM quiz_resposta_visitante WHERE resultado_id=? ORDER BY pergunta_id',[existente.id]);
                if(anteriores.length!==c.respostas.length||anteriores.some((a,n)=>a.pergunta_id!==c.respostas[n].pergunta_id||a.alternativa_id!==c.respostas[n].alternativa_id))throw new ErroHttp(409,'Esta participação já foi concluída. Consulte seu resultado.');
                return {resultado:existente,reenvio:true};
            }
            const [r]=await b.query('INSERT INTO quiz_resultado_visitante (quiz_id,participacao_hash,quiz_titulo,pontuacao,total_perguntas,percentual,concluido_em) VALUES (?,?,?,?,?,?,UTC_TIMESTAMP(3))',[q.id,chave,q.titulo,c.pontuacao,c.total_perguntas,c.percentual]);
            await b.query('INSERT INTO quiz_resposta_visitante (resultado_id,pergunta_id,alternativa_id) VALUES ?',[c.respostas.map(a=>[r.insertId,a.pergunta_id,a.alternativa_id])]);
            return {resultado:await resultadoVisitante(b,q.id,chave),reenvio:false};
        });res.status(dados.reenvio?200:201).json({mensagem:dados.reenvio?'Resultado já registrado.':'Respostas registradas.',...dados});
    }));
}
