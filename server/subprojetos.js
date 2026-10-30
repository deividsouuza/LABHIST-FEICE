import { ErroHttp, conferirExclusao } from './erros-api.js';
import { idProjetoValido } from './projetos-validacao.js';
import { executarTransacao } from './banco/transacao.js';
import { autorizarProjeto, requireCriacaoAcademica } from './acesso-academico.js';

export function validarSubprojeto(req,res,next) {
    try{
        if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))throw new ErroHttp(400,'Envie um objeto JSON para o subprojeto.');
        const dados={};
        for(const campo of ['titulo','objetivo','descricao','temas_abordados']){
            const valor=req.body[campo]===undefined&&campo!=='titulo'?'':req.body[campo];
            if(typeof valor!=='string'||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(valor))throw new ErroHttp(400,'Campos do subprojeto devem ser textos validos.');
            dados[campo]=valor.trim();
            if(campo==='titulo'?(!dados[campo]||Array.from(dados[campo]).length>255||/[\r\n\t]/.test(dados[campo])):Buffer.byteLength(dados[campo],'utf8')>65535)throw new ErroHttp(400,'Tamanho de campo do subprojeto invalido.');
        }
        if(req.body.projeto_id!==undefined){dados.projeto_id=idProjetoValido(req.body.projeto_id);if(dados.projeto_id===null)throw new ErroHttp(400,'projeto_id invalido.');}
        if(req.body.aluno_ids!==undefined){
            const ids=req.body.aluno_ids;
            if(!Array.isArray(ids)||ids.length>10000||ids.some(id=>!Number.isSafeInteger(id)||id<=0)||new Set(ids).size!==ids.length)throw new ErroHttp(400,'Selecione alunos válidos, sem duplicação.');
            dados.aluno_ids=[...ids].sort((a,b)=>a-b);
        }
        req.subprojetoPayload=dados;next();
    }catch(erro){res.status(erro.status||400).json({erro:erro.message});}
}

const campos='id, projeto_id, titulo, objetivo, descricao, temas_abordados';
const mapear=row=>({...row,objetivo:row.objetivo||'',descricao:row.descricao||'',temas_abordados:row.temas_abordados||''});

async function salvarAlunosSubprojeto(banco,id,pai,ids){
    if(ids===undefined)return; // PUT antigo preserva participantes.
    if(ids.length){
        const [membros]=await banco.query('SELECT aluno_id FROM projeto_aluno WHERE projeto_id=? AND aluno_id IN (?) ORDER BY aluno_id FOR SHARE',[pai,ids]);
        if(membros.length!==ids.length)throw new ErroHttp(400,'Todos os alunos do subprojeto devem participar do projeto principal.');
    }
    await banco.query('DELETE FROM subprojeto_aluno WHERE subprojeto_id=?',[id]);
    if(ids.length)await banco.query('INSERT INTO subprojeto_aluno (subprojeto_id,projeto_id,aluno_id) VALUES ?',[ids.map(aluno=>[id,pai,aluno])]);
}

async function exigirAusenciaDependentes(banco,id) {
    // Não permitir descarte implícito caso uma FK seja acrescentada, mesmo CASCADE.
    // Identificadores vêm apenas do catálogo do servidor e são escapados.
    const [fks]=await banco.query(`SELECT TABLE_SCHEMA, TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_COLUMN_NAME,
        TABLE_SCHEMA=DATABASE() AS esquema_local FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='subprojeto'`);
    const citar=nome=>'`'+nome.replaceAll('`','``')+'`';
    const grupos=Map.groupBy(fks,f=>JSON.stringify([f.TABLE_SCHEMA,f.TABLE_NAME,f.CONSTRAINT_NAME]));
    for(const grupo of grupos.values()){
        const equipe=grupo.length===2&&grupo.every(f=>f.esquema_local&&f.TABLE_NAME==='subprojeto_aluno'&&f.CONSTRAINT_NAME==='labhist_fk_sa_subprojeto')
            &&grupo.some(f=>f.COLUMN_NAME==='subprojeto_id'&&f.REFERENCED_COLUMN_NAME==='id')&&grupo.some(f=>f.COLUMN_NAME==='projeto_id'&&f.REFERENCED_COLUMN_NAME==='projeto_id');
        if(equipe)continue; // Vínculos próprios são removidos explicitamente, após os demais guards.
        // A FK composta aprovada em014 também referencia projeto_id. Ela é
        // verificada uma vez pelo subprojeto; só bloqueia quando há um quiz.
        // Outros formatos compostos/desconhecidos continuam conservadores.
        const quiz=grupo.length===2&&grupo.every(f=>f.esquema_local&&f.TABLE_NAME==='quiz'&&f.CONSTRAINT_NAME==='labhist_fk_quiz_subprojeto')
            &&grupo.some(f=>f.COLUMN_NAME==='subprojeto_id'&&f.REFERENCED_COLUMN_NAME==='id')
            &&grupo.some(f=>f.COLUMN_NAME==='projeto_id'&&f.REFERENCED_COLUMN_NAME==='projeto_id');
        if(!quiz&&(grupo.length!==1||!grupo[0].esquema_local||grupo[0].REFERENCED_COLUMN_NAME!=='id'))throw new ErroHttp(409,'Dependencias do subprojeto precisam de politica de exclusao.');
        const fk=quiz?grupo.find(f=>f.COLUMN_NAME==='subprojeto_id'):grupo[0];
        const [rows]=await banco.query(`SELECT 1 FROM ${citar(fk.TABLE_NAME)} WHERE ${citar(fk.COLUMN_NAME)}=? LIMIT 1`,[id]);
        if(rows.length)throw new ErroHttp(409,'Subprojeto possui dependentes protegidos.');
    }
}

export function registrarSubprojetos(app,{obterPool,requireAuth,requireAdmin,requireIdentidadeAtual,validarIdRota,responderErro}) {
    app.post('/projetos/:id/subprojetos',requireAuth,requireCriacaoAcademica,validarIdRota,requireIdentidadeAtual,validarSubprojeto,async(req,res)=>{
        try{
            const p=req.subprojetoPayload;
            if(p.projeto_id!==undefined&&p.projeto_id!==req.recursoId)throw new ErroHttp(400,'Projeto do corpo difere da URL.');
            const id=await executarTransacao(obterPool(),async banco=>{
                // O vínculo deve existir e ficar protegido até concluir a gravação.
                await autorizarProjeto(banco,req.recursoId,req.identidadeAcesso,true);
                const [pais]=await banco.query('SELECT id FROM projeto WHERE id=? FOR SHARE',[req.recursoId]);
                if(!pais.length)throw new ErroHttp(404,'Projeto nao encontrado.');
                const [result]=await banco.query('INSERT INTO subprojeto (projeto_id,titulo,objetivo,descricao,temas_abordados) VALUES (?,?,?,?,?)',[req.recursoId,p.titulo,p.objetivo,p.descricao,p.temas_abordados]);
                await salvarAlunosSubprojeto(banco,result.insertId,req.recursoId,p.aluno_ids);
                return result.insertId;
            });
            res.status(201).json({mensagem:'Subprojeto cadastrado.',id});
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/projetos/:id/subprojetos',requireAuth,validarIdRota,requireIdentidadeAtual,async(req,res)=>{
        try{
            const banco=obterPool();await autorizarProjeto(banco,req.recursoId,req.identidadeAcesso);
            const [pais]=await banco.query('SELECT id FROM projeto WHERE id=?',[req.recursoId]);if(!pais.length)throw new ErroHttp(404,'Projeto nao encontrado.');
            const [rows]=await banco.query(`SELECT ${campos} FROM subprojeto WHERE projeto_id=? ORDER BY id`,[req.recursoId]);res.set('Cache-Control','no-store');res.json(rows.map(mapear));
        }catch(erro){responderErro(res,erro);}
    });
    app.get('/subprojetos/:id',requireAuth,validarIdRota,requireIdentidadeAtual,async(req,res)=>{
        try{
            const banco=obterPool(),[rows]=await banco.query(`SELECT ${campos} FROM subprojeto WHERE id=?`,[req.recursoId]);if(!rows.length)throw new ErroHttp(404,'Subprojeto nao encontrado.');
            await autorizarProjeto(banco,rows[0].projeto_id,req.identidadeAcesso);
            const identidade=req.identidadeAcesso;
            const [alunos]=await banco.query('SELECT a.id,a.nome FROM subprojeto_aluno sa JOIN aluno a ON a.id=sa.aluno_id WHERE sa.subprojeto_id=?'+(identidade.perfil==='aluno'?' AND a.id=?':'')+' ORDER BY a.nome,a.id',identidade.perfil==='aluno'?[req.recursoId,identidade.pessoa_id]:[req.recursoId]);
            res.set('Cache-Control','no-store');res.json({...mapear(rows[0]),alunos});
        }catch(erro){responderErro(res,erro);}
    });
    app.put('/subprojetos/:id',requireAuth,requireAdmin,validarIdRota,validarSubprojeto,async(req,res)=>{
        try{
            const p=req.subprojetoPayload;
            await executarTransacao(obterPool(),async banco=>{
                const [rows]=await banco.query('SELECT id, projeto_id FROM subprojeto WHERE id=? FOR UPDATE',[req.recursoId]);
                if(!rows.length)throw new ErroHttp(404,'Subprojeto nao encontrado.');
                if(p.projeto_id!==undefined&&p.projeto_id!==rows[0].projeto_id)throw new ErroHttp(400,'Transferencia de projeto nao permitida.');
                await banco.query('UPDATE subprojeto SET titulo=?,objetivo=?,descricao=?,temas_abordados=? WHERE id=?',[p.titulo,p.objetivo,p.descricao,p.temas_abordados,req.recursoId]);
                await salvarAlunosSubprojeto(banco,req.recursoId,rows[0].projeto_id,p.aluno_ids);
            });
            res.json({mensagem:'Subprojeto atualizado.'});
        }catch(erro){responderErro(res,erro);}
    });
    app.delete('/subprojetos/:id',requireAuth,requireAdmin,validarIdRota,async(req,res)=>{
        try{
            await executarTransacao(obterPool(),async banco=>{
                const [rows]=await banco.query('SELECT id FROM subprojeto WHERE id=? FOR UPDATE',[req.recursoId]);
                if(!rows.length)throw new ErroHttp(404,'Subprojeto nao encontrado.');
                await exigirAusenciaDependentes(banco,req.recursoId);
                await banco.query('DELETE FROM subprojeto_aluno WHERE subprojeto_id=?',[req.recursoId]);
                const [resultado]=await banco.query('DELETE FROM subprojeto WHERE id=?',[req.recursoId]);
                conferirExclusao(resultado,'Subprojeto nao encontrado.');
            });
            res.json({mensagem:'Subprojeto excluido.'});
        }catch(erro){responderErro(res,erro);}
    });
}
