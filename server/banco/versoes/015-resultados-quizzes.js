export default {versao:15,nome:'resultados-quizzes',passos:[
{sql:`CREATE TABLE IF NOT EXISTS quiz_resultado (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,quiz_id INT NOT NULL,aluno_id INT NOT NULL,conta_id INT NOT NULL,
    quiz_titulo VARCHAR(255) NOT NULL,aluno_nome VARCHAR(255) NOT NULL,pontuacao INT NOT NULL,total_perguntas INT NOT NULL,percentual DOUBLE NOT NULL,concluido_em DATETIME(3) NOT NULL,
    UNIQUE KEY labhist_uq_tentativa (quiz_id,aluno_id),
    CONSTRAINT labhist_fk_resultado_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_resultado_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_resultado_conta FOREIGN KEY (conta_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_quiz_resultado_valido CHECK (pontuacao>=0 AND total_perguntas>=1 AND pontuacao<=total_perguntas AND percentual>=0 AND percentual<=100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
{sql:`CREATE TABLE IF NOT EXISTS quiz_resposta (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,resultado_id INT NOT NULL,pergunta_id INT NOT NULL,alternativa_id INT NOT NULL,
    UNIQUE KEY labhist_uq_resposta (resultado_id,pergunta_id),
    CONSTRAINT labhist_fk_resposta_resultado FOREIGN KEY (resultado_id) REFERENCES quiz_resultado(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_resposta_pergunta FOREIGN KEY (pergunta_id) REFERENCES quiz_pergunta(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT labhist_fk_resposta_alternativa FOREIGN KEY (alternativa_id) REFERENCES quiz_alternativa(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}
]};
