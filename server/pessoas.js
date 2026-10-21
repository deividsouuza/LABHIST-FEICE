import { executarTransacao } from './banco/transacao.js';
import { validarIdRota, exigirRegistro, conferirExclusao, responderErro } from './erros-api.js';
import { normalizarPerfil, validarCredenciais, vincularConta } from './identidades.js';
import { senhaValida, gerarHash } from './credenciais.js';
import { validarPessoaPayload, getPessoaTable, mapProfessorRow, mapAlunoRow } from './pessoas-dados.js';

export function registrarPessoas(app,{obterPool,requireAuth,requireAdmin,requireIdentidadeAtual}) {
    app.get('/usuarios', requireAuth, requireAdmin, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const perfil = normalizarPerfil(req.query.perfil);

        try {
            if (perfil === 'professor') {
                const [rows] = await obterPool().query(
                    'SELECT id, nome, email, telefone, matricula FROM professor ORDER BY nome'
                );
                return res.json(rows.map(mapProfessorRow));
            }

            if (perfil === 'aluno') {
                const [rows] = await obterPool().query(
                    'SELECT id, nome, email, telefone, matricula, curso, turma FROM aluno ORDER BY nome'
                );
                return res.json(rows.map(mapAlunoRow));
            }

            const [professores] = await obterPool().query(
                'SELECT id, nome, email, telefone, matricula FROM professor ORDER BY nome'
            );
            const [alunos] = await obterPool().query(
                'SELECT id, nome, email, telefone, matricula, curso, turma FROM aluno ORDER BY nome'
            );

            res.json([
                ...professores.map(mapProfessorRow),
                ...alunos.map(mapAlunoRow)
            ]);
        } catch (erro) {
            responderErro(res, erro, 'Erro ao carregar usuarios.');
        }
    });

    app.get('/usuarios/:id', requireAuth, validarIdRota, requireIdentidadeAtual, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const perfil = normalizarPerfil(req.query.perfil);
        const table = getPessoaTable(perfil);

        if (!table) {
            return res.status(400).json({ erro: 'Informe um perfil valido para consultar o registro.' });
        }

        if (req.identidadeAcesso.perfil!=='administrador' && (req.identidadeAcesso.perfil!==perfil || req.identidadeAcesso.pessoa_id!==req.recursoId)) return res.status(403).json({erro:'Acesso restrito aos seus dados.'});

        try {
            const sql = table === 'professor'
                ? 'SELECT id, nome, email, telefone, matricula FROM professor WHERE id = ?'
                : 'SELECT id, nome, email, telefone, matricula, curso, turma FROM aluno WHERE id = ?';

            const [rows] = await obterPool().query(sql, [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ erro: 'Registro nao encontrado.' });

            res.json(table === 'professor' ? mapProfessorRow(rows[0]) : mapAlunoRow(rows[0]));
        } catch (erro) {
            responderErro(res, erro, 'Erro ao buscar registro.');
        }
    });

    app.put('/usuarios/:id', requireAuth, requireAdmin, validarIdRota, validarPessoaPayload, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const { table, nome, matricula, email, telefone, curso, turma } = req.pessoaPayload;

        try {
            await executarTransacao(obterPool(), async banco => {
                await exigirRegistro(banco, table, req.recursoId);
                if (table === 'professor') {
                    await banco.query(
                        'UPDATE professor SET nome=?, matricula=?, email=?, telefone=? WHERE id=?',
                        [nome, matricula, email, telefone, req.params.id]
                    );
                } else {
                    await banco.query(
                        'UPDATE aluno SET nome=?, matricula=?, email=?, telefone=?, curso=?, turma=? WHERE id=?',
                        [nome, matricula, email, telefone, curso, turma, req.params.id]
                    );
                }
            });

            res.json({ mensagem: 'Atualizado com sucesso.' });
        } catch (erro) {
            responderErro(res, erro, 'Erro ao atualizar registro.');
        }
    });

    app.delete('/usuarios/:id', requireAuth, requireAdmin, validarIdRota, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const perfil = normalizarPerfil(req.query.perfil);
        const table = getPessoaTable(perfil);

        if (!table) {
            return res.status(400).json({ erro: 'Informe um perfil valido para remover o registro.' });
        }

        try {
            await executarTransacao(obterPool(), async banco => {
                await exigirRegistro(banco, table, req.recursoId);
                // A conta é preservada, mas fica sem acesso acadêmico após remover a pessoa.
                await banco.query(`DELETE FROM conta_pessoa WHERE ${table}_id=?`, [req.recursoId]);
                if (table === 'professor') {
                    await banco.query('DELETE FROM projeto_professor WHERE professor_id = ?', [req.params.id]);
                    await banco.query('UPDATE projeto SET professor_id = NULL WHERE professor_id = ?', [req.params.id]);
                    const [resultado] = await banco.query('DELETE FROM professor WHERE id = ?', [req.recursoId]);
                    conferirExclusao(resultado, 'Registro nao encontrado.');
                } else {
                    await banco.query('DELETE FROM projeto_aluno WHERE aluno_id = ?', [req.params.id]);
                    const [resultado] = await banco.query('DELETE FROM aluno WHERE id = ?', [req.recursoId]);
                    conferirExclusao(resultado, 'Registro nao encontrado.');
                }
            });
            res.json({ mensagem: 'Removido com sucesso.' });
        } catch (erro) {
            responderErro(res, erro, 'Erro ao remover registro.');
        }
    });

    app.post('/cadastro-dashboard', requireAuth, requireAdmin, validarPessoaPayload, async (req, res) => {
        if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

        const { table, nome, matricula, email, telefone, curso, turma } = req.pessoaPayload;

        try {
            // Dados pessoais sem credenciais continuam admitidos para manutenção do legado.
            const credenciais = req.body.credenciais === undefined ? null : validarCredenciais(req.body.credenciais, senhaValida);
            const hash = credenciais ? await gerarHash(credenciais.senha) : null;
            const result = await executarTransacao(obterPool(), async banco => {
            let result;

            if (table === 'professor') {
                [result] = await banco.query(
                    'INSERT INTO professor (nome, matricula, email, telefone) VALUES (?, ?, ?, ?)',
                    [nome, matricula, email, telefone]
                );
            } else {
                [result] = await banco.query(
                    'INSERT INTO aluno (nome, matricula, email, telefone, curso, turma) VALUES (?, ?, ?, ?, ?, ?)',
                    [nome, matricula, email, telefone, curso, turma]
                );
            }

            if (credenciais) {
                const [conta] = await banco.query('INSERT INTO usuarios (usuario, senha, perfil) VALUES (?, ?, ?)', [credenciais.usuario, hash, table]);
                await vincularConta(banco, conta.insertId, table, result.insertId);
            }
            return result;
            });
            res.json({ mensagem: 'Cadastrado com sucesso.', id: result.insertId });
        } catch (erro) {
            responderErro(res, erro, 'Erro ao cadastrar.');
        }
    });

}
