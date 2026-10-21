# P04 — Instalação e atualização do banco

O servidor normal não cria tabelas nem executa ALTER TABLE. Antes de escutar a porta HTTP, ele verifica o histórico e o contrato estrutural. Banco vazio, versão antiga/futura, checksum divergente ou coluna incompatível impedem a partida com diagnóstico sanitizado e código 1. A conexão é fechada em falha.

Após o P05, a aplicação utiliza pool com verificação inicial em conexão adquirida/devolvida; ferramentas de migração mantêm conexão dedicada. Política e testes em [Transações](TRANSACOES.md).

## Preparação

Use MySQL 8.0 e banco previamente criado pelo operador, com InnoDB e utf8mb4. Por exemplo, no cliente MySQL autenticado com uma conta de administração, usando o nome aprovado para o ambiente:

```sql
CREATE DATABASE labhist CHARACTER SET utf8mb4;
```

O nome acima é ilustrativo; o migrador nunca cria nem escolhe o banco automaticamente. Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no ambiente local. Para usar os scripts npm, copie `server/.env.example` para `server/.env` e preencha localmente. Não versionar segredos. A inicialização do servidor também exige SESSION_SECRET, conforme [autenticação](AUTENTICACAO.md).

A conta usada para migrar precisa de SELECT, INSERT, CREATE e ALTER no banco de destino e das permissões necessárias às referências das tabelas criadas. A conta normal da aplicação precisa de SELECT/INSERT/UPDATE/DELETE nas tabelas de negócio e leitura do histórico; não precisa de CREATE/ALTER. O provisionamento de usuários e permissões é responsabilidade do operador e não ocorre automaticamente.

Instale as dependências com `npm ci` na pasta `server`. Os comandos seguintes também partem dessa pasta, com Node 24:

```powershell
npm run db:migrate
npm run db:check
node --env-file=.env index.js
```

Se as variáveis forem fornecidas diretamente pelo ambiente, sem arquivo `.env`, use:

```powershell
node scripts/banco.js migrate
node scripts/banco.js check
node index.js
```

`migrate` é uma operação explícita que grava esquema/histórico; `check` é apenas leitura. Não existe migração automática na partida nem modo dry-run para DDL. A saída contém somente a versão e os números das versões aplicadas. Falhas retornam código 1 sem imprimir valores do ambiente, SQL, linhas ou objetos de erro do driver. Comandos npm podem emitir suas mensagens usuais sobre arquivo `.env` ausente; nesse caso, crie o arquivo ou use a variante de ambiente acima.

## Versões e instalação vazia

| Versão | Conteúdo |
|---|---|
| 001 | usuarios, professor, aluno, projeto, projeto_professor e projeto_aluno, preservando os campos e índices existentes no código anterior. |
| 002 | documentos no formato consumido pela API e adições opcionais conhecidas de schemas legados: matrícula do professor, telefone/curso do aluno, objetivo/professor do projeto e perfil do autor do documento. |
| 003 | Diagnóstico de legados, FKs dos participantes/responsável e proteção UNIQUE dos pares de projeto; detalhes em [Integridade dos projetos](INTEGRIDADE-PROJETOS.md). |

O histórico `schema_migrations` registra versão, nome, checksum SHA-256 e data de aplicação. Versões em `banco/versoes/` são imutáveis; mudanças futuras acrescentam outra versão e atualizam o contrato de verificação, sem reescrever as anteriores. O manifesto aceita apenas prefixo contínuo conhecido: lacunas, versões futuras e checksum diferente causam erro. Segunda execução completa não altera novamente o esquema ou as datas do histórico.

Nenhuma conta, senha padrão, pessoa ou projeto é criado. Senhas não são modificadas pelo migrador de esquema. O provisionamento administrativo em instalação vazia continua explícito; não foi introduzido bootstrap de conta nesta tarefa.

## Atualização de banco existente

1. Pare a aplicação e outros gravadores. Faça backup protegido do banco e dos uploads e valide a restauração em ambiente separado.
2. Em uma cópia descartável, confira `DB_NAME` e execute `db:migrate`. O esquema legado sem histórico pode ser adotado se seus campos existentes forem compatíveis. Nenhum campo com tipo incompatível é convertido silenciosamente; nenhum dado é truncado, apagado ou reatribuído.
3. Os campos opcionais conhecidos ausentes são adicionados; tabelas ausentes são criadas. Tipos, capacidades mínimas, nulabilidade necessária e chaves primárias/autoincremento dos IDs são verificados. Engines sem suporte transacional são recusadas. Estruturas divergentes exigem análise explícita: o migrador não é uma ferramenta genérica de reparo e não resolve toda variante possível de legado.
4. Depois da validação e da autorização do ambiente real, aplique o mesmo comando, execute `db:check` e reinicie a aplicação. Se houver senhas legadas, execute também o procedimento independente do [P01](AUTENTICACAO.md) antes de liberar o login.

Nenhuma execução no banco real foi realizada pelo agente. Os scripts antigos em `sql/` permanecem como referência histórica; não são o fluxo de instalação e não devem ser executados juntamente com o migrador.

## Documentos e limites de escopo

Em instalação nova, documentos possui FK de projeto com ON DELETE CASCADE, como o script original. O autor mantém ID e perfil no formato atual da API, sem FK polimórfica nova. Em legado, a coluna de perfil ausente recebe NULL, inclusive para registros anteriores; não existe preenchimento automático como aluno. Valores, IDs, arquivos e restrições de autoria existentes são preservados. Não se remove automaticamente a FK antiga de enviado_por para usuarios: avaliar sua correspondência pertence ao P09/D10.

Adicionar a coluna não resolve a autoria de documentos nem os filtros de leitura. Os riscos conhecidos de identidade/vínculo/download e a limpeza de arquivos continuam em P06/P07/P08/P09/P17. Posteriormente, o P10 acrescentou as FKs dos participantes/responsável na versão 003; não foram criadas novas cascatas acadêmicas.

## Falhas, concorrência e retomada

O migrador usa uma conexão dedicada e um lock nomeado por banco. Um segundo executor concorrente falha sem iniciar a migração. O lock é liberado no encerramento da operação/conexão. A aplicação deve permanecer parada; esse lock não bloqueia gravadores externos que não participam do protocolo.

DDL no MySQL tem [commit implícito](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html), portanto não se promete rollback transacional de CREATE/ALTER. Uma interrupção pode deixar alguns passos concluídos. Cada CREATE verifica existência e cada adição verifica a coluna; a versão só é registrada depois dos passos. A retomada revalida as estruturas e aplica o restante. Uma versão incompleta impede a partida normal. Não há downgrade automático nem remoção de dados: para recuperar uma alteração incompatível, faça análise e restauração protegida com a aplicação parada. Referência do mecanismo de exclusão: [locks nomeados do MySQL](https://dev.mysql.com/doc/refman/8.0/en/locking-functions.html).

## Testes

A partir da raiz:

```powershell
node --experimental-vm-modules --test --test-reporter=spec server/test/esquema.test.js
```

Os testes usam uma instância própria de MySQL local 8.0.46 com `--no-defaults`, porta e diretório temporários; não usam serviço, dados ou contas reais do projeto. Cobrem instalação vazia, versão 1→2, adoção de legado sem histórico, ausência de duplicações, preservação de dados e autoria desconhecida, recusa de versão/checksum/coluna/engine incompatíveis, permissão negada real, verificação de partida/reinício sem DDL, retomada de falha parcial, concorrência e saída CLI sanitizada com código de erro. A verificação de partida exercita a função de conexão usada pelo servidor, sem iniciar o processo da aplicação na porta 3000.

MYSQLD_BIN pode apontar para outro executável. Se ausente, a suíte é ignorada explicitamente e não constitui evidência de persistência. O processo filho é encerrado e a remoção dos arquivos temporários valida o caminho e o prefixo antes da exclusão. Nenhum teste dessa tarefa depende de aprovação manual; uso do banco real e homologação de implantação permanecem ações separadas.

## Atualização P06/P07 — versão esperada 005

As versões 001–003 anteriores permanecem imutáveis. 004 acrescenta o vínculo inequívoco entre conta e pessoa, com UNIQUE/FKs/CHECK; não associa legados automaticamente nem troca senhas. 005 acrescenta documentos.autoria_confirmada, default0 e NOT NULL, preservando toda autoria antiga como incerta para acesso do aluno. A partida verifica o esquema/constraints sem aplicar DDL e confere default0 do marcador. Atualizar uma cópia com db:migrate e conferir com db:check antes de qualquer aplicação deliberada pelo responsável. Nenhuma migração foi executada no banco real pelo agente.

Leia IDENTIDADE-ACADEMICA.md para relatório, revisão de IDs e migração explícita dos vínculos; ACESSO-ACADEMICO.md para participação/autoria incerta/staging; DOWNLOAD-AUTENTICADO.md para os links privados. Registros antigos não são apagados, renomeados ou automaticamente classificados. P09 segue necessário para compatibilizar autoria/FKs legadas; P03/D12 permanece necessário para implantação. Os comandos e exemplos anteriores são histórico da versão correspondente.

## Atualização P17/P20 — versão esperada 007

As versões001–005 permanecem imutáveis. A006 cria limpeza_arquivos: fila durável sem FKs para sobreviver à exclusão dos metadados. A007 cria subprojeto com FK RESTRICT para projeto e os quatro campos confirmados. Não altera registros legados nem cria relações com conteúdos/quizzes/envios. A partida passa a exigir a versão007, as novas tabelas e a FK de subprojeto; na etapa P20, db:migrate aplicava até007 (destino atual na atualização mais recente abaixo).

Preparação validada somente em MySQL descartável. Nenhuma migração no banco real foi executada. Antes de atualizar deliberadamente uma instalação existente, seguir o fluxo de backup/cópia, db:migrate e db:check deste guia. Contratos e recuperação estão em LIMPEZA-ARQUIVOS.md e SUBPROJETOS.md. Limites operacionais de upload estão em UPLOADS.md.

## Atualização P18 — versão esperada 008

A008 acrescenta projeto.status, nullable e default NULL, com CHECK dos três estados. Legados permanecem não classificados conforme decisão do responsável; nenhum UPDATE deduz estado histórico. Novos projetos exigem escolha na API/UI. Versões001–007 imutáveis. Na etapa P18, db:migrate aplicava até008; o destino atual é009; partida verifica estrutura/restrição sem DDL. Preparação testada somente em cópias descartáveis, sem migração no banco real. Contratos em STATUS-PROJETOS.md.
## Atualização P27 — versão esperada 009

A009 acrescenta o núcleo administrativo quiz/quiz_pergunta/quiz_alternativa, com FKs RESTRICT e CHECK de alternativa correta. Não há vínculo a projeto/subprojeto, publicação, pontuação ou resultado. Versões001–008 permanecem imutáveis. O comando atual db:migrate aplica até009 e a partida exige essa versão, sem executar DDL. Migração preparada/testada em bancos descartáveis, não aplicada ao banco real. Contratos e decisões em QUIZZES.md e no arquivo07 da auditoria.

## Evolução 010–013 — lote de 19/10/2026

Versão esperada atual: **013**. Aplicar migrações explicitamente em ambiente apropriado após revisão; a aplicação continua sem DDL na partida. 010 cria sessões persistentes; 011 adiciona conta/snapshot de autoria com FK RESTRICT e legados NULL; 012 adiciona texto explicativo opcional; 013 adiciona versão de sessão, contatos confirmados e hashes de tokens. Não foram atribuídos autores/contatos por dedução, não foram alterados arquivos/datas históricos nem aplicadas migrações no banco real. Ver OPERACAO.md, AUTORIA-DOCUMENTOS.md e RECUPERACAO.md para os contratos e configuração local. Versões publicadas anteriores preservadas.

Versão 014 (19/10/2026): disponibilidade de quizzes aprovada em 07/09, nullable para legados privados, FK de projeto e FK composta subprojeto/projeto, estados e CHECK. Migração explícita testada somente em MySQL descartável; banco real não migrado.

Versão esperada atual 015: respostas/resultados com FKs RESTRICT, UNIQUE por quiz/aluno e resultado/pergunta e CHECK de faixa; sem backfill de tentativas. Valores de data gravados em UTC; percentual DOUBLE. Versões 001–014 preservadas. Testada em instância descartável; migração real permanece não executada.
