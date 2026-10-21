// Versão publicada: não editar; acrescente outra versão para evoluir.
export default {
    versao: 3,
    nome: 'integridade-projetos',
    passos: [
        { tipo: 'unique', tabela: 'projeto_professor', colunas: ['projeto_id', 'professor_id'], nome: 'labhist_uq_projeto_professor', sql: 'ALTER TABLE projeto_professor ADD UNIQUE KEY labhist_uq_projeto_professor (projeto_id, professor_id)' },
        { tipo: 'unique', tabela: 'projeto_aluno', colunas: ['projeto_id', 'aluno_id'], nome: 'labhist_uq_projeto_aluno', sql: 'ALTER TABLE projeto_aluno ADD UNIQUE KEY labhist_uq_projeto_aluno (projeto_id, aluno_id)' },
        { tipo: 'fk', tabela: 'projeto_professor', coluna: 'projeto_id', referencia: 'projeto', nome: 'labhist_fk_pp_projeto', sql: 'ALTER TABLE projeto_professor ADD CONSTRAINT labhist_fk_pp_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE RESTRICT ON UPDATE RESTRICT' },
        { tipo: 'fk', tabela: 'projeto_professor', coluna: 'professor_id', referencia: 'professor', nome: 'labhist_fk_pp_professor', sql: 'ALTER TABLE projeto_professor ADD CONSTRAINT labhist_fk_pp_professor FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT' },
        { tipo: 'fk', tabela: 'projeto_aluno', coluna: 'projeto_id', referencia: 'projeto', nome: 'labhist_fk_pa_projeto', sql: 'ALTER TABLE projeto_aluno ADD CONSTRAINT labhist_fk_pa_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE RESTRICT ON UPDATE RESTRICT' },
        { tipo: 'fk', tabela: 'projeto_aluno', coluna: 'aluno_id', referencia: 'aluno', nome: 'labhist_fk_pa_aluno', sql: 'ALTER TABLE projeto_aluno ADD CONSTRAINT labhist_fk_pa_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE RESTRICT ON UPDATE RESTRICT' },
        { tipo: 'fk', tabela: 'projeto', coluna: 'professor_id', referencia: 'professor', nome: 'labhist_fk_projeto_responsavel', sql: 'ALTER TABLE projeto ADD CONSTRAINT labhist_fk_projeto_responsavel FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT' }
    ]
};
