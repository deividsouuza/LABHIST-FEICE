// Versão publicada: não editar; acrescente outra versão para evoluir.
export default {
    "versao": 1,
    "nome": "base",
    "passos": [
        {
            "sql": "CREATE TABLE IF NOT EXISTS `usuarios` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `usuario` VARCHAR(100) NOT NULL UNIQUE, `senha` VARCHAR(255) NOT NULL, `perfil` VARCHAR(50) NOT NULL DEFAULT 'administrador', `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "sql": "CREATE TABLE IF NOT EXISTS `professor` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `nome` VARCHAR(255) NOT NULL, `email` VARCHAR(255) NULL, `telefone` VARCHAR(50) NULL, `matricula` VARCHAR(100) NULL, `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "sql": "CREATE TABLE IF NOT EXISTS `aluno` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `nome` VARCHAR(255) NOT NULL, `email` VARCHAR(255) NULL, `turma` VARCHAR(100) NULL, `matricula` VARCHAR(100) NULL, `telefone` VARCHAR(50) NULL, `curso` VARCHAR(255) NULL, `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "sql": "CREATE TABLE IF NOT EXISTS `projeto` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `titulo` VARCHAR(255) NOT NULL, `descricao` TEXT NULL, `objetivo` TEXT NULL, `professor_id` INT NULL, `data_inicio` DATE NULL, `data_fim` DATE NULL, `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "sql": "CREATE TABLE IF NOT EXISTS `projeto_professor` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `projeto_id` INT NOT NULL, `professor_id` INT NOT NULL, `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY projeto_professor_unique (projeto_id, professor_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        },
        {
            "sql": "CREATE TABLE IF NOT EXISTS `projeto_aluno` (`id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY, `projeto_id` INT NOT NULL, `aluno_id` INT NOT NULL, `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY projeto_aluno_unique (projeto_id, aluno_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        }
    ]
};
