export default {
    versao:9,nome:'nucleo-quizzes',passos:[
        {sql:`CREATE TABLE IF NOT EXISTS quiz (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,titulo VARCHAR(255) NOT NULL,descricao TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
        {sql:`CREATE TABLE IF NOT EXISTS quiz_pergunta (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,quiz_id INT NOT NULL,descricao TEXT NOT NULL,ordem INT NOT NULL,
            CONSTRAINT labhist_fk_pergunta_quiz FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`},
        {sql:`CREATE TABLE IF NOT EXISTS quiz_alternativa (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,pergunta_id INT NOT NULL,descricao TEXT NOT NULL,correta INT NOT NULL,ordem INT NOT NULL,
            CONSTRAINT labhist_fk_alternativa_pergunta FOREIGN KEY (pergunta_id) REFERENCES quiz_pergunta(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
            CONSTRAINT labhist_quiz_correta CHECK (correta IN (0,1))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}
    ]
};
