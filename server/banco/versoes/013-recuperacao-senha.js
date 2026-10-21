export default {versao:13,nome:'recuperacao-senha',passos:[
{tabela:'usuarios',coluna:'sessao_versao',sql:'ALTER TABLE usuarios ADD COLUMN sessao_versao INT NOT NULL DEFAULT 0'},
{sql:'CREATE TABLE IF NOT EXISTS contatos_recuperacao (usuario_id INT NOT NULL PRIMARY KEY,email VARCHAR(255) NOT NULL,confirmado_por INT NOT NULL,confirmado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),CONSTRAINT labhist_fk_contato_conta FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'},
{sql:'CREATE TABLE IF NOT EXISTS recuperacao_senha (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,usuario_id INT NOT NULL,token_hash VARCHAR(64) NOT NULL UNIQUE,versao_sessao INT NOT NULL,expira_em DATETIME(3) NOT NULL,consumido_em DATETIME(3) NULL,CONSTRAINT labhist_fk_token_conta FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'}
]};
