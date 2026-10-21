export default {
    versao:6,nome:'fila-limpeza-arquivos',passos:[{sql:`CREATE TABLE IF NOT EXISTS limpeza_arquivos (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        documento_id INT NULL, projeto_id INT NULL, caminho VARCHAR(500) NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'pendente', tentativas INT NOT NULL DEFAULT 0,
        erro_codigo VARCHAR(50) NULL, created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`}]
};
