// Evolução explícita; legados permanecem rascunhos sem vínculo e privados.
export default {versao:14,nome:'disponibilidade-quizzes',passos:[
{tabela:'quiz',coluna:'projeto_id',sql:'ALTER TABLE quiz ADD COLUMN projeto_id INT NULL DEFAULT NULL'},
{tabela:'quiz',coluna:'subprojeto_id',sql:'ALTER TABLE quiz ADD COLUMN subprojeto_id INT NULL DEFAULT NULL'},
{tabela:'quiz',coluna:'estado',sql:"ALTER TABLE quiz ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'rascunho'"},
{tabela:'quiz',coluna:'introducao_publica',sql:'ALTER TABLE quiz ADD COLUMN introducao_publica INT NOT NULL DEFAULT 0'},
{tipo:'unique',tabela:'subprojeto',colunas:['id','projeto_id'],nome:'labhist_uq_subprojeto_pai',sql:'ALTER TABLE subprojeto ADD UNIQUE KEY labhist_uq_subprojeto_pai (id,projeto_id)'},
{quizFk:true,tabela:'quiz',nome:'labhist_fk_quiz_projeto',colunas:['projeto_id'],referencia:'projeto',chaves:['id'],sql:'ALTER TABLE quiz ADD CONSTRAINT labhist_fk_quiz_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE RESTRICT ON UPDATE RESTRICT'},
{quizFk:true,tabela:'quiz',nome:'labhist_fk_quiz_subprojeto',colunas:['subprojeto_id','projeto_id'],referencia:'subprojeto',chaves:['id','projeto_id'],sql:'ALTER TABLE quiz ADD CONSTRAINT labhist_fk_quiz_subprojeto FOREIGN KEY (subprojeto_id,projeto_id) REFERENCES subprojeto(id,projeto_id) ON DELETE RESTRICT ON UPDATE RESTRICT'},
{check:'labhist_quiz_disponivel',checkTabela:'quiz',sql:"ALTER TABLE quiz ADD CONSTRAINT labhist_quiz_disponivel CHECK (estado IN ('rascunho','publicado','arquivado') AND introducao_publica IN (0,1) AND (estado <> 'publicado' OR projeto_id IS NOT NULL) AND (subprojeto_id IS NULL OR projeto_id IS NOT NULL))"}
]};
