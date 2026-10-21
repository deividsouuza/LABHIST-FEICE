import { ErroHttp } from './erros-api.js';
import { executarTransacao } from './banco/transacao.js';
import { idProjetoValido } from './projetos-validacao.js';

const falhar=mensagem=>{throw new ErroHttp(400,mensagem);};
const objeto=(v,chaves)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!chaves.includes(k)))falhar('Estrutura do quiz invalida.');};
const texto=(v,obrigatorio,max,curto=false)=>{
    if(typeof v!=='string'||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v))falhar('Campos do quiz devem ser textos validos.');
    const t=v.trim();if((obrigatorio&&!t)||(curto?Array.from(t).length:Buffer.byteLength(t,'utf8'))>max||(curto&&/[\r\n\t]/.test(t)))falhar('Tamanho de texto do quiz invalido.');return t;
};

export function validarQuizPayload(req,res,next){
    try{
        const b=req.body,edicao=req.method==='PUT';
        objeto(b,edicao?['id','titulo','descricao','perguntas']:['titulo','descricao','perguntas']);
        if(b.id!==undefined&&idProjetoValido(b.id)!==req.recursoId)falhar('ID do quiz difere da URL.');
        const dados={titulo:texto(b.titulo,true,255,true),descricao:texto(b.descricao===undefined?'':b.descricao,false,65535),perguntas:[]};
        if(!Array.isArray(b.perguntas)||!b.perguntas.length||b.perguntas.length>50)falhar('Informe de 1 a 50 perguntas.');
        const perguntasIds=new Set(),alternativasIds=new Set();
        const identidade=(o,ids)=>{if(o.id===undefined)return undefined;const id=idProjetoValido(o.id);if(id===null||ids.has(id))falhar('IDs de perguntas/alternativas invalidos ou repetidos.');ids.add(id);return id;};
        for(const p of b.perguntas){
            objeto(p,edicao?['id','descricao','alternativas']:['descricao','alternativas']);
            const pergunta={descricao:texto(p.descricao,true,65535),alternativas:[]};if(edicao&&p.id!==undefined)pergunta.id=identidade(p,perguntasIds);
            if(!Array.isArray(p.alternativas)||p.alternativas.length<2||p.alternativas.length>20)falhar('Informe de 2 a 20 alternativas por pergunta.');
            for(const a of p.alternativas){
                objeto(a,edicao?['id','descricao','correta']:['descricao','correta']);
                if(typeof a.correta!=='boolean')falhar('Marque a alternativa correta com valor booleano.');
                const alternativa={descricao:texto(a.descricao,true,65535),correta:a.correta};if(edicao&&a.id!==undefined)alternativa.id=identidade(a,alternativasIds);pergunta.alternativas.push(alternativa);
            }
            if(pergunta.alternativas.filter(a=>a.correta).length!==1)falhar('Cada pergunta exige exatamente uma alternativa correta.');dados.perguntas.push(pergunta);
        }
        req.quizPayload=dados;next();
    }catch(erro){if(erro instanceof ErroHttp)return res.status(erro.status).json({erro:erro.message});next(erro);}
}

async function inserirPergunta(banco,quizId,p,ordem){
    const [r]=await banco.query('INSERT INTO quiz_pergunta (quiz_id,descricao,ordem) VALUES (?,?,?)',[quizId,p.descricao,ordem]);
    await banco.query('INSERT INTO quiz_alternativa (pergunta_id,descricao,correta,ordem) VALUES ?',[p.alternativas.map((a,i)=>[r.insertId,a.descricao,a.correta?1:0,i])]);
    return r.insertId;
}

export async function carregarQuiz(banco,id,travar=false){
    const [rows]=await banco.query('SELECT id,titulo,descricao FROM quiz WHERE id=?'+(travar?' FOR UPDATE':''),[id]);if(!rows.length)throw new ErroHttp(404,'Quiz nao encontrado.');
    const [perguntas]=await banco.query('SELECT id,descricao FROM quiz_pergunta WHERE quiz_id=? ORDER BY ordem,id'+(travar?' FOR UPDATE':''),[id]);
    const [alternativas]=perguntas.length?await banco.query('SELECT id,pergunta_id,descricao,correta FROM quiz_alternativa WHERE pergunta_id IN (?) ORDER BY ordem,id'+(travar?' FOR UPDATE':''),[perguntas.map(p=>p.id)]):[[]];
    return {...rows[0],descricao:rows[0].descricao||'',perguntas:perguntas.map(p=>({...p,alternativas:alternativas.filter(a=>a.pergunta_id===p.id).map(({pergunta_id,...a})=>({...a,correta:a.correta===1}))}))};
}

export async function exigirQuizSemHistorico(banco,q,operacao='Edicao'){
    const ids={quiz:[q.id],quiz_pergunta:q.perguntas.map(p=>p.id),quiz_alternativa:q.perguntas.flatMap(p=>p.alternativas.map(a=>a.id))};
    // Somente as duas relações internas pertencem ao núcleo. Qualquer outro
    // dependente precisa ser preservado, mesmo quando sua FK declara CASCADE.
    const [fks]=await banco.query(`SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME,
        TABLE_SCHEMA=DATABASE() AS esquema_local FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IN ('quiz','quiz_pergunta','quiz_alternativa')`);
    const citar=nome=>'`'+nome.replaceAll('`','``')+'`';
    for(const f of fks){
        if(f.esquema_local&&f.REFERENCED_COLUMN_NAME==='id'&&((f.TABLE_NAME==='quiz_pergunta'&&f.COLUMN_NAME==='quiz_id'&&f.REFERENCED_TABLE_NAME==='quiz')||(f.TABLE_NAME==='quiz_alternativa'&&f.COLUMN_NAME==='pergunta_id'&&f.REFERENCED_TABLE_NAME==='quiz_pergunta')))continue;
        if(!f.esquema_local||f.REFERENCED_COLUMN_NAME!=='id')throw new ErroHttp(409,'Dependencias do quiz precisam de politica explicita.');
        const referencias=ids[f.REFERENCED_TABLE_NAME];if(!referencias.length)continue;
        const [rows]=await banco.query(`SELECT 1 FROM ${citar(f.TABLE_NAME)} WHERE ${citar(f.COLUMN_NAME)} IN (?) LIMIT 1`,[referencias]);
        if(rows.length)throw new ErroHttp(409,operacao+' bloqueada: quiz possui respostas, resultados ou dependentes protegidos.');
    }
}

async function atualizarQuiz(banco,id,dados){
    const atual=await carregarQuiz(banco,id,true);await exigirQuizSemHistorico(banco,atual);
    const perguntas=new Map(atual.perguntas.map(p=>[p.id,p]));
    for(const p of dados.perguntas){
        if(p.id!==undefined&&!perguntas.has(p.id))falhar('Pergunta nao pertence ao quiz.');
        for(const a of p.alternativas)if(a.id!==undefined&&(!p.id||!perguntas.get(p.id).alternativas.some(v=>v.id===a.id)))falhar('Alternativa nao pertence a pergunta.');
    }
    await banco.query('UPDATE quiz SET titulo=?,descricao=? WHERE id=?',[dados.titulo,dados.descricao,id]);
    for(const [ordem,p] of dados.perguntas.entries()){
        if(p.id===undefined){await inserirPergunta(banco,id,p,ordem);continue;}
        await banco.query('UPDATE quiz_pergunta SET descricao=?,ordem=? WHERE id=?',[p.descricao,ordem,p.id]);
        const manter=new Set(p.alternativas.filter(a=>a.id!==undefined).map(a=>a.id));
        for(const a of perguntas.get(p.id).alternativas)if(!manter.has(a.id))await banco.query('DELETE FROM quiz_alternativa WHERE id=?',[a.id]);
        for(const [pos,a] of p.alternativas.entries()){
            if(a.id===undefined)await banco.query('INSERT INTO quiz_alternativa (pergunta_id,descricao,correta,ordem) VALUES (?,?,?,?)',[p.id,a.descricao,a.correta?1:0,pos]);
            else await banco.query('UPDATE quiz_alternativa SET descricao=?,correta=?,ordem=? WHERE id=?',[a.descricao,a.correta?1:0,pos,a.id]);
        }
    }
    const manter=new Set(dados.perguntas.filter(p=>p.id!==undefined).map(p=>p.id));
    for(const p of atual.perguntas)if(!manter.has(p.id)){
        await banco.query('DELETE FROM quiz_alternativa WHERE pergunta_id=?',[p.id]);await banco.query('DELETE FROM quiz_pergunta WHERE id=?',[p.id]);
    }
}

export function registrarQuizzes(app,{obterPool,requireAuth,requireAdmin,validarIdRota,responderErro}){
    app.post('/quizzes',requireAuth,requireAdmin,validarQuizPayload,async(req,res)=>{
        try{
            const id=await executarTransacao(obterPool(),async banco=>{
                const p=req.quizPayload,[r]=await banco.query('INSERT INTO quiz (titulo,descricao) VALUES (?,?)',[p.titulo,p.descricao]);
                for(const [i,pergunta] of p.perguntas.entries())await inserirPergunta(banco,r.insertId,pergunta,i);return r.insertId;
            });res.status(201).json({id,mensagem:'Quiz cadastrado.'});
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/quizzes',requireAuth,requireAdmin,async(req,res)=>{
        try{const [rows]=await obterPool().query('SELECT id,titulo,descricao FROM quiz ORDER BY id');res.set('Cache-Control','no-store').json(rows);}catch(erro){responderErro(res,erro);}
    });
    app.get('/quizzes/:id',requireAuth,requireAdmin,validarIdRota,async(req,res)=>{
        try{const q=await executarTransacao(obterPool(),b=>carregarQuiz(b,req.recursoId));res.set('Cache-Control','no-store').json(q);}catch(erro){responderErro(res,erro);}
    });
    app.put('/quizzes/:id',requireAuth,requireAdmin,validarIdRota,validarQuizPayload,async(req,res)=>{
        try{await executarTransacao(obterPool(),b=>atualizarQuiz(b,req.recursoId,req.quizPayload));res.json({mensagem:'Quiz atualizado.'});}catch(erro){responderErro(res,erro);}
    });
    app.delete('/quizzes/:id',requireAuth,requireAdmin,validarIdRota,async(req,res)=>{
        try{
            await executarTransacao(obterPool(),async banco=>{
                const q=await carregarQuiz(banco,req.recursoId,true);await exigirQuizSemHistorico(banco,q,'Exclusao');
                if(q.perguntas.length)await banco.query('DELETE FROM quiz_alternativa WHERE pergunta_id IN (?)',[q.perguntas.map(p=>p.id)]);
                await banco.query('DELETE FROM quiz_pergunta WHERE quiz_id=?',[q.id]);
                const [r]=await banco.query('DELETE FROM quiz WHERE id=?',[q.id]);if(r.affectedRows!==1)throw new ErroHttp(409,'Exclusao do quiz nao confirmada.');
            });res.json({mensagem:'Quiz excluido.'});
        }catch(erro){responderErro(res,erro);}
    });

}
