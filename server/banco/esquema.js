// Contrato estrutural da API atual. Não introduz vínculos/regras acadêmicas novos.
export const tabelas = {
    subprojeto_aluno:{subprojeto_id:'INT NOT NULL',projeto_id:'INT NOT NULL',aluno_id:'INT NOT NULL'},
    quiz_resultado:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',quiz_id:'INT NOT NULL',aluno_id:'INT NOT NULL',conta_id:'INT NOT NULL',quiz_titulo:'VARCHAR(255) NOT NULL',aluno_nome:'VARCHAR(255) NOT NULL',pontuacao:'INT NOT NULL',total_perguntas:'INT NOT NULL',percentual:'DOUBLE NOT NULL',concluido_em:'DATETIME NOT NULL'},
    quiz_resposta:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',resultado_id:'INT NOT NULL',pergunta_id:'INT NOT NULL',alternativa_id:'INT NOT NULL'},
    contatos_recuperacao:{usuario_id:'INT NOT NULL PRIMARY KEY',email:'VARCHAR(255) NOT NULL',confirmado_por:'INT NOT NULL',confirmado_em:'DATETIME NOT NULL'},
    recuperacao_senha:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',usuario_id:'INT NOT NULL',token_hash:'VARCHAR(64) NOT NULL UNIQUE',versao_sessao:'INT NOT NULL',expira_em:'DATETIME NOT NULL',consumido_em:'DATETIME NULL'},
    sessoes:{sid:'VARCHAR(64) NOT NULL PRIMARY KEY',dados:'TEXT NOT NULL',conta_id:'INT NULL',expira_em:'DATETIME NOT NULL'},
    quiz:{projeto_id:'INT NULL DEFAULT NULL',subprojeto_id:'INT NULL DEFAULT NULL',estado:"VARCHAR(20) NOT NULL DEFAULT 'rascunho'",introducao_publica:'INT NOT NULL DEFAULT 0',id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',titulo:'VARCHAR(255) NOT NULL',descricao:'TEXT NULL'},
    quiz_pergunta:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',quiz_id:'INT NOT NULL',descricao:'TEXT NOT NULL',ordem:'INT NOT NULL'},
    quiz_alternativa:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',pergunta_id:'INT NOT NULL',descricao:'TEXT NOT NULL',correta:'INT NOT NULL',ordem:'INT NOT NULL'},
    subprojeto:{id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY',projeto_id:'INT NOT NULL',titulo:'VARCHAR(255) NOT NULL',
        objetivo:'TEXT NULL',descricao:'TEXT NULL',temas_abordados:'TEXT NULL',created_at:'DATETIME NULL DEFAULT CURRENT_TIMESTAMP'},
    limpeza_arquivos: { id:'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', documento_id:'INT NULL',projeto_id:'INT NULL',
        caminho:'VARCHAR(500) NOT NULL',estado:"VARCHAR(20) NOT NULL DEFAULT 'pendente'",tentativas:'INT NOT NULL DEFAULT 0',
        erro_codigo:'VARCHAR(50) NULL',created_at:'DATETIME NULL DEFAULT CURRENT_TIMESTAMP' },
    usuarios: {
        sessao_versao:'INT NOT NULL DEFAULT 0',
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', usuario: 'VARCHAR(100) NOT NULL UNIQUE',
        senha: 'VARCHAR(255) NOT NULL', perfil: "VARCHAR(50) NOT NULL DEFAULT 'administrador'",
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    professor: {
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', nome: 'VARCHAR(255) NOT NULL',
        email: 'VARCHAR(255) NULL', telefone: 'VARCHAR(50) NULL', matricula: 'VARCHAR(100) NULL',
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', updated_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    aluno: {
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', nome: 'VARCHAR(255) NOT NULL',
        email: 'VARCHAR(255) NULL', turma: 'VARCHAR(100) NULL', matricula: 'VARCHAR(100) NULL',
        telefone: 'VARCHAR(50) NULL', curso: 'VARCHAR(255) NULL',
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', updated_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    projeto: {
        status: 'VARCHAR(20) NULL DEFAULT NULL',
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', titulo: 'VARCHAR(255) NOT NULL',
        descricao: 'TEXT NULL', objetivo: 'TEXT NULL', professor_id: 'INT NULL',
        data_inicio: 'DATE NULL', data_fim: 'DATE NULL', created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    projeto_professor: {
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', projeto_id: 'INT NOT NULL', professor_id: 'INT NOT NULL',
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    projeto_aluno: {
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', projeto_id: 'INT NOT NULL', aluno_id: 'INT NOT NULL',
        created_at: 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'
    },
    documentos: {
        texto_explicativo:'TEXT NULL DEFAULT NULL',
        autor_conta_id:'INT NULL DEFAULT NULL',autor_nome:'VARCHAR(255) NULL DEFAULT NULL',autor_perfil:'VARCHAR(20) NULL DEFAULT NULL',
        id: 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY', projeto_id: 'INT NOT NULL',
        descricao: 'VARCHAR(255) NOT NULL', arquivo_caminho: 'VARCHAR(500) NOT NULL',
        arquivo_nome: 'VARCHAR(255) NOT NULL', enviado_por: 'INT NOT NULL',
        // NULL preserva autoria desconhecida; jamais inferir aluno para um legado.
        enviado_por_perfil: 'VARCHAR(20) NULL DEFAULT NULL', enviado_em: 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP',
        autoria_confirmada: 'INT NOT NULL DEFAULT 0'
    }
};

export const adicoesLegadas = [
    ['quiz','projeto_id'],['quiz','subprojeto_id'],['quiz','estado'],['quiz','introducao_publica'],
    ['usuarios','sessao_versao'],
    ['documentos','texto_explicativo'],
    ['documentos','autor_conta_id'],['documentos','autor_nome'],['documentos','autor_perfil'],
    ['projeto', 'status'],
    ['professor', 'matricula'], ['aluno', 'telefone'], ['aluno', 'curso'],
    ['projeto', 'objetivo'], ['projeto', 'professor_id'], ['documentos', 'enviado_por_perfil'], ['documentos', 'autoria_confirmada']
];

