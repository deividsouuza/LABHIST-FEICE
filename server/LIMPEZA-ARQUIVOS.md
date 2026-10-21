# Exclusão e limpeza recuperável — P17

A migração006 cria limpeza_arquivos. O registro guarda ID do documento/projeto, caminho interno, estado, tentativas e código sanitizado. Não há FK para entidades removidas: a pendência precisa sobreviver à exclusão. Projetos/documentos são bloqueados na transação; documentos dependentes são levantados, jobs inseridos e metadados removidos na mesma conexão. Só depois de COMMIT confirmado começa a limpeza. Rollback ou confirmação perdida não disparam unlink.

Cada job é processado com lock próprio. O caminho usa o confinamento de P08, com recusa de path externo, traversal, symlink/junction e arquivo não regular. Arquivo ainda referenciado por outro documento é preservado e fica pendente (ARQUIVO_REFERENCIADO). Arquivo já ausente conclui idempotentemente. Acesso negado/falha IO gera pendência; caminho inseguro fica bloqueado. Estado/tentativas são persistidos. Se unlink funcionar e a atualização SQL falhar, a repetição verifica ausência e conclui sem nova perda.

DELETE /projetos/:id e DELETE /documentos/:id retornam200 quando os jobs dessa operação estão concluídos, ou202 com mensagem explícita e contagens de pendências/bloqueios. O frontend informa202 ao remover projeto. Falha na transação original continua erro, preservando arquivos. Se o COMMIT aconteceu mas sua resposta se perdeu, o resultado é erro conservador e os jobs persistidos permitem retomada. Não se repete a exclusão automaticamente.

Operação administrativa:

- GET /limpezas/arquivos: até100 pendências/bloqueios com IDs, estados, tentativas e códigos; sem paths, nomes ou SQL.
- POST /limpezas/arquivos/repetir: JSON `{ "ids": [1,2] }`, entre1 e100 IDs distintos. Processa apenas os jobs indicados, sem aceitar caminhos arbitrários. Jobs concluídos/ausentes são idempotentes. Bloqueios de caminho continuam bloqueados; não existe opção de ignorar o confinamento.

Após corrigir uma falha operacional, o administrador pode repetir. Jobs permanecem no banco entre processos; não dependem de memória. Antes de intervir manualmente em um caminho bloqueado, o responsável deve revisar a cópia/backup e a origem dos metadados; o agente não saneou dados reais. Não há daemon nem exclusão em segundo plano automática. Limpeza tem transação própria depois da remoção de metadados; falha nela não desfaz uma exclusão já confirmada e é reportada202.

Validação: limpeza-arquivos.test.js usa MySQL, HTTP e arquivos reais descartáveis, com falhas de unlink/commit/UPDATE injetadas. Regressões anteriores com SQL/fs doubles continuam sem acesso aos uploads reais. A verificação com MySQL não significa homologação da implantação. Resultados no controle08.
