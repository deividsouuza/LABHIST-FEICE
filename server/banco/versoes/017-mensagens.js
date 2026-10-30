// Conversas preservadas, sem cascatas de exclusão de contas/pessoas.
export default {versao:17,nome:'mensagens-privadas',passos:[
{sql:`CREATE TABLE IF NOT EXISTS mensagem_conversa (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    professor_conta_id INT NOT NULL,professor_id INT NOT NULL,
    aluno_conta_id INT NOT NULL,aluno_id INT NOT NULL,criada_em DATETIME(3) NOT NULL,
    professor_leu_ate INT NOT NULL DEFAULT 0,aluno_leu_ate INT NOT NULL DEFAULT 0,
    UNIQUE KEY labhist_uq_conversa (professor_conta_id,professor_id,aluno_conta_id,aluno_id),
    KEY labhist_conversa_aluno (aluno_conta_id,aluno_id),
    CONSTRAINT labhist_fk_conversa_prof_conta FOREIGN KEY (professor_conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_conversa_aluno_conta FOREIGN KEY (aluno_conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_conversa_prof FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_conversa_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_conversa_distinta CHECK (professor_conta_id<>aluno_conta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
{sql:`CREATE TABLE IF NOT EXISTS mensagem (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,conversa_id INT NOT NULL,
    remetente_id INT NOT NULL,destinatario_id INT NOT NULL,cliente_id VARCHAR(36) NOT NULL,
    conteudo TEXT NOT NULL,enviada_em DATETIME(3) NOT NULL,lida_em DATETIME(3) NULL,
    UNIQUE KEY labhist_uq_envio (remetente_id,cliente_id),
    KEY labhist_mensagem_historico (conversa_id,id),
    KEY labhist_mensagem_leitura (destinatario_id,lida_em,conversa_id,id),
    CONSTRAINT labhist_fk_mensagem_conversa FOREIGN KEY (conversa_id) REFERENCES mensagem_conversa(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_mensagem_remetente FOREIGN KEY (remetente_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_mensagem_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_mensagem_valida CHECK (remetente_id<>destinatario_id AND CHAR_LENGTH(conteudo) BETWEEN 1 AND 4000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}
]};
