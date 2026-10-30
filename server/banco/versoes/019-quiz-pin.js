export default {versao:19,nome:'quiz-pin',passos:[
{sql:`CREATE TABLE IF NOT EXISTS quiz_pin (
 quiz_id INT NOT NULL PRIMARY KEY,codigo VARCHAR(8) NOT NULL UNIQUE,ativo INT NOT NULL DEFAULT 1,versao INT NOT NULL DEFAULT 1,criado_em DATETIME(3) NOT NULL,
 CONSTRAINT labhist_fk_pin_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT labhist_pin_valido CHECK (CHAR_LENGTH(codigo)=8 AND ativo IN (0,1) AND versao>=1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
{sql:`CREATE TABLE IF NOT EXISTS quiz_resultado_visitante (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,quiz_id INT NOT NULL,participacao_hash VARCHAR(64) NOT NULL UNIQUE,
 quiz_titulo VARCHAR(255) NOT NULL,pontuacao INT NOT NULL,total_perguntas INT NOT NULL,percentual DOUBLE NOT NULL,concluido_em DATETIME(3) NOT NULL,
 CONSTRAINT labhist_fk_rv_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT labhist_rv_valido CHECK (pontuacao>=0 AND total_perguntas>=1 AND pontuacao<=total_perguntas AND percentual>=0 AND percentual<=100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
{sql:`CREATE TABLE IF NOT EXISTS quiz_resposta_visitante (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,resultado_id INT NOT NULL,pergunta_id INT NOT NULL,alternativa_id INT NOT NULL,
 UNIQUE KEY labhist_uq_rv_resposta (resultado_id,pergunta_id),
 CONSTRAINT labhist_fk_rv_resultado FOREIGN KEY (resultado_id) REFERENCES quiz_resultado_visitante(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT labhist_fk_rv_pergunta FOREIGN KEY (pergunta_id) REFERENCES quiz_pergunta(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT labhist_fk_rv_alternativa FOREIGN KEY (alternativa_id) REFERENCES quiz_alternativa(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}
]};
