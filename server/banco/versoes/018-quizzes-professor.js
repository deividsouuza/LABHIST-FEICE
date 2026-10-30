// Autoria explícita; legados não são atribuídos por dedução.
export default {versao:18,nome:'quizzes-professor',passos:[
    {tabela:'quiz',coluna:'autor_conta_id',sql:'ALTER TABLE quiz ADD COLUMN autor_conta_id INT NULL DEFAULT NULL'},
    {tabela:'quiz',coluna:'autor_professor_id',sql:'ALTER TABLE quiz ADD COLUMN autor_professor_id INT NULL DEFAULT NULL'},
    {quizFk:true,tabela:'quiz',nome:'labhist_fk_quiz_autor_conta',colunas:['autor_conta_id'],referencia:'usuarios',chaves:['id'],sql:'ALTER TABLE quiz ADD CONSTRAINT labhist_fk_quiz_autor_conta FOREIGN KEY (autor_conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT'},
    {quizFk:true,tabela:'quiz',nome:'labhist_fk_quiz_autor_professor',colunas:['autor_professor_id'],referencia:'professor',chaves:['id'],sql:'ALTER TABLE quiz ADD CONSTRAINT labhist_fk_quiz_autor_professor FOREIGN KEY (autor_professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT'},
    {checkTabela:'quiz',check:'labhist_quiz_autoria',sql:'ALTER TABLE quiz ADD CONSTRAINT labhist_quiz_autoria CHECK ((autor_conta_id IS NULL AND autor_professor_id IS NULL) OR (autor_conta_id IS NOT NULL AND autor_professor_id IS NOT NULL))'}
]};
