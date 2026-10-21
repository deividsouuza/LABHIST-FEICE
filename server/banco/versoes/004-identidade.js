// Versão publicada: não editar; evoluções devem acrescentar outra versão.
export default {
    versao: 4,
    nome: 'identidade-academica',
    passos: [
        { tipo: 'unique', tabela: 'usuarios', colunas: ['id', 'perfil'], nome: 'labhist_uq_conta_perfil', sql: 'ALTER TABLE usuarios ADD UNIQUE KEY labhist_uq_conta_perfil (id, perfil)' },
        { tipo: 'unique', tabela: 'usuarios', colunas: ['usuario'], nome: 'labhist_uq_usuario', sql: 'ALTER TABLE usuarios ADD UNIQUE KEY labhist_uq_usuario (usuario)' },
        { sql: `CREATE TABLE IF NOT EXISTS conta_pessoa (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL UNIQUE, perfil VARCHAR(50) NOT NULL,
            aluno_id INT NULL UNIQUE, professor_id INT NULL UNIQUE,
            CONSTRAINT labhist_cp_usuario FOREIGN KEY (usuario_id, perfil) REFERENCES usuarios(id, perfil) ON DELETE RESTRICT ON UPDATE RESTRICT,
            CONSTRAINT labhist_cp_aluno FOREIGN KEY (aluno_id) REFERENCES aluno(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
            CONSTRAINT labhist_cp_professor FOREIGN KEY (professor_id) REFERENCES professor(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
            CONSTRAINT labhist_cp_perfil CHECK (
                (perfil = 'aluno' AND aluno_id IS NOT NULL AND professor_id IS NULL) OR
                (perfil = 'professor' AND professor_id IS NOT NULL AND aluno_id IS NULL)
            )
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` }
    ]
};
