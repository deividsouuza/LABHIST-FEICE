export default {versao:11,nome:'autoria-documentos',passos:[
{tabela:'documentos',coluna:'autor_conta_id',sql:'ALTER TABLE documentos ADD COLUMN autor_conta_id INT NULL DEFAULT NULL'},
{tabela:'documentos',coluna:'autor_nome',sql:'ALTER TABLE documentos ADD COLUMN autor_nome VARCHAR(255) NULL DEFAULT NULL'},
{tabela:'documentos',coluna:'autor_perfil',sql:'ALTER TABLE documentos ADD COLUMN autor_perfil VARCHAR(20) NULL DEFAULT NULL'},
{tipo:'fk',tabela:'documentos',coluna:'autor_conta_id',referencia:'usuarios',sql:'ALTER TABLE documentos ADD CONSTRAINT labhist_fk_documento_autor FOREIGN KEY (autor_conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT'}
]};
