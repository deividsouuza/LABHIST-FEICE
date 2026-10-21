-- Migracao: adicionar documentos.enviado_por_perfil
--
-- Motivo: enviado_por guarda um id, mas nao diz de qual tabela ele veio
-- (aluno ou professor). Como os dois tem sequencias de id independentes,
-- o mesmo numero pode representar pessoas diferentes. Esta coluna resolve
-- a ambiguidade para exibir corretamente "quem enviou" na tela do professor.
--
-- DEFAULT 'aluno' porque, ate agora, so a tela do aluno enviava documentos
-- (Prompt 5) -- entao os registros ja existentes sao todos de alunos.

ALTER TABLE documentos
    ADD COLUMN enviado_por_perfil VARCHAR(20) NOT NULL DEFAULT 'aluno' AFTER enviado_por;
