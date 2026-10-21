-- Migracao: remover a FOREIGN KEY de documentos.enviado_por -> usuarios(id)
--
-- Motivo: ainda nao existe login real de aluno/professor (a tabela `usuarios`
-- so tem a conta hardcoded do administrador). O valor de enviado_por na
-- pratica sera o id de um registro em `aluno` (e futuramente `professor`),
-- nao um id de `usuarios`. Como MySQL nao suporta uma FK que aponte para
-- duas tabelas diferentes dependendo do perfil (referencia "polimorfica"),
-- a solucao mais simples por enquanto e remover a restricao e manter
-- enviado_por como um INT comum, sem validacao de integridade referencial
-- no banco. Quando existir login real, revisitar esse ponto.
--
-- Este script encontra o nome da constraint automaticamente (o MySQL gera
-- nomes como "documentos_ibfk_2") e a remove. Se não houver nenhuma FK
-- correspondente (ex: script já rodado antes), ele avisa e não faz nada.

SET @constraint_name := (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'documentos'
      AND COLUMN_NAME = 'enviado_por'
      AND REFERENCED_TABLE_NAME = 'usuarios'
    LIMIT 1
);

SET @sql := IF(
    @constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE documentos DROP FOREIGN KEY ', @constraint_name),
    'SELECT "Nenhuma FK encontrada em documentos.enviado_por -> usuarios (nada a fazer)" AS aviso'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
