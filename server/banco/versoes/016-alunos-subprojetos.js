// Sem atribuições por dedução: subprojetos existentes começam sem participantes.
export default {versao:16,nome:'alunos-subprojetos',passos:[
{sql:`CREATE TABLE IF NOT EXISTS subprojeto_aluno (
    subprojeto_id INT NOT NULL,projeto_id INT NOT NULL,aluno_id INT NOT NULL,
    PRIMARY KEY (subprojeto_id,aluno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
{quizFk:true,tabela:'subprojeto_aluno',nome:'labhist_fk_sa_subprojeto',colunas:['subprojeto_id','projeto_id'],referencia:'subprojeto',chaves:['id','projeto_id'],sql:'ALTER TABLE subprojeto_aluno ADD CONSTRAINT labhist_fk_sa_subprojeto FOREIGN KEY (subprojeto_id,projeto_id) REFERENCES subprojeto(id,projeto_id) ON DELETE RESTRICT ON UPDATE RESTRICT'},
{quizFk:true,tabela:'subprojeto_aluno',nome:'labhist_fk_sa_membro',colunas:['projeto_id','aluno_id'],referencia:'projeto_aluno',chaves:['projeto_id','aluno_id'],sql:'ALTER TABLE subprojeto_aluno ADD CONSTRAINT labhist_fk_sa_membro FOREIGN KEY (projeto_id,aluno_id) REFERENCES projeto_aluno(projeto_id,aluno_id) ON DELETE RESTRICT ON UPDATE RESTRICT'}
]};
