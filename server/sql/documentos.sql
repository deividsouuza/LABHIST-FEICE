-- Documentos de projeto
-- Banco: usuarios_db (MySQL)
--
-- Observacao: a tabela de projetos existente no schema chama-se `projeto`
-- (singular), por isso a FOREIGN KEY abaixo referencia `projeto(id)`.

CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    arquivo_caminho VARCHAR(500) NOT NULL,
    arquivo_nome VARCHAR(255) NOT NULL,
    enviado_por INT NOT NULL,
    enviado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projeto(id) ON DELETE CASCADE,
    FOREIGN KEY (enviado_por) REFERENCES usuarios(id)
);
