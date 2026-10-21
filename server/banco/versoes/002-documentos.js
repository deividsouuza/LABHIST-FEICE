// Versão publicada: não editar; acrescente outra versão para evoluir.
export default {
    "versao": 2,
    "nome": "documentos-e-compatibilidade-legada",
    "passos": [
        {
            "sql": "CREATE TABLE IF NOT EXISTS `documentos` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `projeto_id` INT NOT NULL, `descricao` VARCHAR(255) NOT NULL, `arquivo_caminho` VARCHAR(500) NOT NULL, `arquivo_nome` VARCHAR(255) NOT NULL, `enviado_por` INT NOT NULL, `enviado_por_perfil` VARCHAR(20) NULL DEFAULT NULL, `enviado_em` DATETIME NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "tabela": "professor",
            "coluna": "matricula",
            "sql": "ALTER TABLE `professor` ADD COLUMN `matricula` VARCHAR(100) NULL"
        },
        {
            "tabela": "aluno",
            "coluna": "telefone",
            "sql": "ALTER TABLE `aluno` ADD COLUMN `telefone` VARCHAR(50) NULL"
        },
        {
            "tabela": "aluno",
            "coluna": "curso",
            "sql": "ALTER TABLE `aluno` ADD COLUMN `curso` VARCHAR(255) NULL"
        },
        {
            "tabela": "projeto",
            "coluna": "objetivo",
            "sql": "ALTER TABLE `projeto` ADD COLUMN `objetivo` TEXT NULL"
        },
        {
            "tabela": "projeto",
            "coluna": "professor_id",
            "sql": "ALTER TABLE `projeto` ADD COLUMN `professor_id` INT NULL"
        },
        {
            "tabela": "documentos",
            "coluna": "enviado_por_perfil",
            "sql": "ALTER TABLE `documentos` ADD COLUMN `enviado_por_perfil` VARCHAR(20) NULL DEFAULT NULL"
        }
    ]
};
