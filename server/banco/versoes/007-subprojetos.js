export default {
    versao:7,nome:'subprojetos',passos:[{sql:`CREATE TABLE IF NOT EXISTS subprojeto (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, projeto_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL, objetivo TEXT NULL, descricao TEXT NULL, temas_abordados TEXT NULL,
        created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT labhist_fk_subprojeto_projeto FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE RESTRICT ON UPDATE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}]
};
