import { executarTransacao } from './banco/transacao.js';
import { validarProjetoPayload, confirmarMembros, ErroProjeto } from './projetos-validacao.js';
import { ErroHttp, validarIdRota, exigirRegistro, conferirExclusao, responderErro } from './erros-api.js';
import { autorizarProjeto, requireCriacaoAcademica } from './acesso-academico.js';
import { enfileirarDocumentos } from './limpeza-arquivos.js';
import { mapProfessorRow, mapAlunoRow } from './pessoas-dados.js';

export function registrarProjetos(app,{obterPool,requireAuth,requireAdmin,requireIdentidadeAtual,concluirLimpeza}) {
    async function syncProjetoProfessores(banco, projetoId, professorIds, substituir = true) {
        if (substituir) await banco.query('DELETE FROM projeto_professor WHERE projeto_id = ?', [projetoId]);

        if (professorIds.length === 0) return;

        const values = professorIds.map(professorId => [Number(projetoId), professorId]);
        await banco.query(
            'INSERT INTO projeto_professor (projeto_id, professor_id) VALUES ?',
            [values]
        );
    }

    async function syncProjetoAlunos(banco, projetoId, alunoIds, substituir = true) {
        // Preserva os vínculos mantidos, que podem ser referenciados por núcleos.
        // A FK recusa remover do projeto um aluno ainda vinculado a subprojetos.
        if (substituir) await banco.query('DELETE FROM projeto_aluno WHERE projeto_id = ? AND aluno_id NOT IN (?)', [projetoId,alunoIds.length?alunoIds:[0]]);

        if (alunoIds.length === 0) return;

        const values = alunoIds.map(alunoId => [Number(projetoId), alunoId]);
        await banco.query(
            'INSERT INTO projeto_aluno (projeto_id, aluno_id) VALUES ?'+(substituir?' ON DUPLICATE KEY UPDATE aluno_id=projeto_aluno.aluno_id':''),
            [values]
        );
    }

    async function carregarProfessoresProjeto(projetoId, fallbackProfessorId = null) {
        const [rows] = await obterPool().query(
            `SELECT p.id, p.nome, p.email, p.telefone, p.matricula
             FROM projeto_professor pp
             JOIN professor p ON p.id = pp.professor_id
             WHERE pp.projeto_id = ?
             ORDER BY COALESCE(NULLIF(p.nome, ''), p.id)`,
            [projetoId]
        );

        const professores = rows.map(mapProfessorRow);
        if (professores.length > 0 || !fallbackProfessorId) return professores;

        const [fallbackRows] = await obterPool().query(
            'SELECT id, nome, email, telefone, matricula FROM professor WHERE id = ?',
            [fallbackProfessorId]
        );

        return fallbackRows.map(mapProfessorRow);
    }

    async function carregarAlunosProjeto(projetoId) {
        const [rows] = await obterPool().query(
            `SELECT a.id, a.nome, a.email, a.telefone, a.matricula, a.curso, a.turma
             FROM projeto_aluno pa
             JOIN aluno a ON a.id = pa.aluno_id
             WHERE pa.projeto_id = ?
             ORDER BY COALESCE(NULLIF(a.nome, ''), a.id)`,
            [projetoId]
        );

        return rows.map(mapAlunoRow);
    }

    async function carregarProjetoCompleto(projeto, identidade = null) {
        let professores, alunos;
        if (!identidade || identidade.perfil==='administrador') {
            professores=await carregarProfessoresProjeto(projeto.id,projeto.professor_id);
            alunos=await carregarAlunosProjeto(projeto.id);
        } else {
            [professores]=await obterPool().query(`SELECT p.id, p.nome FROM projeto_professor pp JOIN professor p ON p.id=pp.professor_id WHERE pp.projeto_id=?`,[projeto.id]);
            [alunos]=await obterPool().query(`SELECT a.id, a.nome FROM projeto_aluno pa JOIN aluno a ON a.id=pa.aluno_id WHERE pa.projeto_id=?${identidade.perfil==='aluno'?' AND a.id=?':''}`,
                identidade.perfil==='aluno'?[projeto.id,identidade.pessoa_id]:[projeto.id]);
        }

        return mapearProjetoCompleto(projeto,professores,alunos);
    }

    function mapearProjetoCompleto(projeto,professores,alunos) {
        return {
            id: projeto.id,
            nome: projeto.titulo,
            descricao: projeto.descricao || '',
            objetivo: projeto.objetivo || '',
            status: projeto.status ?? null,
            professor_id: professores[0]?.id || projeto.professor_id || null,
            professor_ids: professores.map(professor => professor.id),
            aluno_ids: alunos.map(aluno => aluno.id),
            professores,
            alunos,
            professores_texto: professores.length > 0
                ? professores.map(professor => professor.nome).filter(Boolean).join(', ')
                : 'Nenhum professor vinculado.',
            alunos_texto: alunos.length > 0
                ? alunos.map(aluno => aluno.nome).filter(Boolean).join(', ')
                : 'Nenhum aluno vinculado.'
        };
    }

    async function carregarProjetosAgrupados(projetos,identidade) {
        if(!projetos.length)return [];
        const ids=projetos.map(p=>p.id),admin=identidade.perfil==='administrador';
        const [profRows]=await obterPool().query(`SELECT pp.projeto_id, p.id, p.nome${admin?', p.email, p.telefone, p.matricula':''}
            FROM projeto_professor pp JOIN professor p ON p.id=pp.professor_id
            WHERE pp.projeto_id IN (?) ORDER BY COALESCE(NULLIF(p.nome, ''), p.id), p.id`,[ids]);
        const soProprio=identidade.perfil==='aluno';
        const [alunoRows]=await obterPool().query(`SELECT pa.projeto_id, a.id, a.nome${admin?', a.email, a.telefone, a.matricula, a.curso, a.turma':''}
            FROM projeto_aluno pa JOIN aluno a ON a.id=pa.aluno_id
            WHERE pa.projeto_id IN (?)${soProprio?' AND a.id=?':''} ORDER BY COALESCE(NULLIF(a.nome, ''), a.id), a.id`,soProprio?[ids,identidade.pessoa_id]:[ids]);
        const agrupar=(rows,mapear)=>{
            const mapa=new Map();
            for(const {projeto_id,...pessoa} of rows){if(!mapa.has(projeto_id))mapa.set(projeto_id,[]);mapa.get(projeto_id).push(mapear(pessoa));}
            return mapa;
        };
        const professores=agrupar(profRows,admin?mapProfessorRow:p=>p),alunos=agrupar(alunoRows,admin?mapAlunoRow:p=>p);
        // Fallback histórico apenas administrativo; não concede participação acadêmica.
        const legados=admin?projetos.filter(p=>!professores.has(p.id)&&p.professor_id):[];
        if(legados.length){
            const [rows]=await obterPool().query('SELECT id, nome, email, telefone, matricula FROM professor WHERE id IN (?)',[[...new Set(legados.map(p=>p.professor_id))]]);
            const pessoas=new Map(rows.map(p=>[p.id,mapProfessorRow(p)]));
            for(const p of legados)if(pessoas.has(p.professor_id))professores.set(p.id,[pessoas.get(p.professor_id)]);
        }
        return projetos.map(p=>mapearProjetoCompleto(p,professores.get(p.id)||[],alunos.get(p.id)||[]));
    }

    // P33: contrato público explícito, sem joins ou dados de participantes/documentos.
    function projetoPublico(row){return {id:row.id,titulo:row.titulo,descricao:row.descricao||'',objetivo:row.objetivo||'',status:row.status??null};}
    app.get('/publico/projetos',async(req,res)=>{
        try{const [rows]=await obterPool().query('SELECT id,titulo,descricao,objetivo,status FROM projeto ORDER BY id DESC');res.set('Cache-Control','no-store').json(rows.map(projetoPublico));}
        catch(erro){responderErro(res,erro,'Erro ao carregar projetos públicos.');}
    });
    app.get('/publico/projetos/:id',validarIdRota,async(req,res)=>{
        try{const [rows]=await obterPool().query('SELECT id,titulo,descricao,objetivo,status FROM projeto WHERE id=?',[req.recursoId]);if(!rows.length)throw new ErroHttp(404,'Projeto não encontrado.');res.set('Cache-Control','no-store').json(projetoPublico(rows[0]));}
        catch(erro){responderErro(res,erro,'Erro ao carregar projeto público.');}
    });

    app.get('/projetos', requireAuth, requireIdentidadeAtual, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        try {
            const identidade=req.identidadeAcesso;
            const academico=identidade.perfil!=='administrador';
            const [rows] = await obterPool().query(academico
                ? `SELECT id, titulo, descricao, objetivo, professor_id, status, created_at FROM projeto WHERE EXISTS (SELECT 1 FROM projeto_${identidade.perfil} v WHERE v.projeto_id=projeto.id AND v.${identidade.perfil}_id=?) ORDER BY created_at DESC`
                : 'SELECT id, titulo, descricao, objetivo, professor_id, status, created_at FROM projeto ORDER BY created_at DESC',academico?[identidade.pessoa_id]:[]);
            const projetos = await carregarProjetosAgrupados(rows,identidade);
            res.set('Cache-Control','no-store');
            res.json(projetos);
        } catch (erro) {
            responderErro(res, erro, 'Erro ao carregar projetos.');
        }
    });

    // Catálogo mínimo para o formulário acadêmico; não abre /usuarios nem contatos.
    app.get('/projetos/opcoes-criacao',requireAuth,requireCriacaoAcademica,requireIdentidadeAtual,async(req,res)=>{
        try {
            const identidade=req.identidadeAcesso;
            const [professores]=await obterPool().query('SELECT id,nome FROM professor'+(identidade.perfil==='professor'?' WHERE id=?':'')+' ORDER BY nome,id',identidade.perfil==='professor'?[identidade.pessoa_id]:[]);
            const [alunos]=await obterPool().query('SELECT id,nome FROM aluno ORDER BY nome,id');
            res.set('Cache-Control','no-store').json({professores,alunos});
        }catch(erro){responderErro(res,erro,'Erro ao carregar participantes.');}
    });

    app.post('/projetos', requireAuth, requireCriacaoAcademica, requireIdentidadeAtual, validarProjetoPayload, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const { nome, descricao, objetivo } = req.body;
        const { professorIds, alunoIds } = req.projetoPayload;

        try {
            const result = await executarTransacao(obterPool(), async banco => {
                await confirmarMembros(banco, req.projetoPayload);
                const [result] = await banco.query(
                    'INSERT INTO projeto (titulo, descricao, objetivo, professor_id, status) VALUES (?, ?, ?, ?, ?)',
                    [nome, descricao || '', objetivo || '', professorIds[0] || null, req.projetoPayload.status]
                );

                // Projeto recém-criado não tem vínculos a remover. DELETE de faixa
                // vazia provoca gap locks desnecessários em criações concorrentes.
                await syncProjetoProfessores(banco, result.insertId, professorIds, false);
                await syncProjetoAlunos(banco, result.insertId, alunoIds, false);

                return result;
            });

            res.json({ mensagem: 'Projeto cadastrado com sucesso.', id: result.insertId });
        } catch (erro) {
            responderErro(res, erro, 'Erro no servidor ao cadastrar projeto.');
        }
    });

    app.get('/projetos/:id', requireAuth, validarIdRota, requireIdentidadeAtual, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        try {
            await autorizarProjeto(obterPool(),req.recursoId,req.identidadeAcesso);
            const [rows] = await obterPool().query(
                'SELECT id, titulo, descricao, objetivo, professor_id, status, created_at FROM projeto WHERE id = ?',
                [req.params.id]
            );

            if (rows.length === 0) return res.status(404).json({ erro: 'Projeto nao encontrado.' });

            const projeto = await carregarProjetoCompleto(rows[0],req.identidadeAcesso);
            res.json(projeto);
        } catch (erro) {
            responderErro(res, erro, 'Erro ao carregar projeto.');
        }
    });

    app.put('/projetos/:id', requireAuth, requireAdmin, validarIdRota, validarProjetoPayload, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const { nome, descricao, objetivo } = req.body;
        const { professorIds, alunoIds } = req.projetoPayload;

        try {
            await executarTransacao(obterPool(), async banco => {
                const [existentes] = await banco.query('SELECT id, status FROM projeto WHERE id = ? FOR UPDATE', [req.projetoPayload.projetoId]);
                if (!existentes.length) throw new ErroProjeto('Projeto nao encontrado.', 404);
                if(req.projetoPayload.status===null&&existentes[0].status!=null)throw new ErroProjeto('Status definido nao pode ser apagado.');
                await confirmarMembros(banco, req.projetoPayload);
                await banco.query(
                    'UPDATE projeto SET titulo=?, descricao=?, objetivo=?, professor_id=?, status=COALESCE(?,status) WHERE id=?',
                    [nome, descricao || '', objetivo || '', professorIds[0] || null, req.projetoPayload.status??null, req.params.id]
                );

                await syncProjetoProfessores(banco, req.params.id, professorIds);
                await syncProjetoAlunos(banco, req.params.id, alunoIds);
            });

            res.json({ mensagem: 'Projeto atualizado com sucesso.' });
        } catch (erro) {
            responderErro(res, erro, 'Erro ao atualizar projeto.');
        }
    });

    app.delete('/projetos/:id', requireAuth, requireAdmin, validarIdRota, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        try {
            const ids=await executarTransacao(obterPool(), async banco => {
                await exigirRegistro(banco, 'projeto', req.recursoId, 'Projeto nao encontrado.');
                const [docs]=await banco.query('SELECT id, arquivo_caminho FROM documentos WHERE projeto_id=? FOR UPDATE',[req.recursoId]);
                const ids=await enfileirarDocumentos(banco,docs,req.recursoId);
                await banco.query('DELETE FROM documentos WHERE projeto_id=?',[req.recursoId]);
                await banco.query('DELETE FROM projeto_professor WHERE projeto_id=?', [req.params.id]);
                await banco.query('DELETE FROM projeto_aluno WHERE projeto_id=?', [req.params.id]);
                const [resultado] = await banco.query('DELETE FROM projeto WHERE id=?', [req.recursoId]);
                conferirExclusao(resultado, 'Projeto nao encontrado.');
                return ids;
            });
            const limpeza=await concluirLimpeza(ids),pendente=limpeza.pendentes+limpeza.bloqueadas>0;
            res.status(pendente?202:200).json({ mensagem:pendente?'Projeto removido; limpeza de arquivos pendente.':'Projeto removido com sucesso.',limpeza });
        } catch (erro) {
            responderErro(res, erro, 'Erro ao remover projeto.');
        }
    });

}
