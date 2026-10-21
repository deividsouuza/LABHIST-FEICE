# Prompts independentes de implementação

**Sequência autorizada em 18/10/2026:** P06 → P13 → P14 → P07 → P08, validando uma tarefa por vez dentro do lote. Proposta R02 aceita pelo usuário; regras D10/D11 aprovadas estão no arquivo 07. IDs, escopos e demais dependências preservados.

**46 prompts — planejamento da auditoria de 15/10/2026. Nenhum foi executado.** Copie um bloco completo por conversa, respeitando a dependência indicada. O projeto é LABHIST em `C:\Users\deivi\OneDrive\Documentos\LABHIST`, hoje HTML/CSS/JS + Node/Express/mysql2/MySQL/Multer/express-session.

Partes removidas/indefinidas não têm prompt de implementação. Quando houver decisão prévia, leia seu conteúdo registrado em docs/auditoria-ers/07-DUVIDAS-DA-ERS.md. **Um prompt bloqueado não deve avançar inventando a definição**: primeiro obtenha a decisão e reavalie o escopo. P35 depende ainda de uma futura tarefa de cálculo RF40 que só poderá ser especificada após D08; ela não existe hoje. Nem a existência deste arquivo nem a conclusão da auditoria autorizam iniciar código nesta etapa.

Cada bloco contém contexto e orientações suficientes para ser utilizado individualmente; as dependências identificam comportamentos prévios necessários. Caminhos/linhas representam a fotografia auditada e devem ser conferidos novamente caso o código mude.

## PROMPT 01 — AUTENTICAÇÃO COM SENHA E PROTEÇÃO DAS CREDENCIAIS

**Identificador:** P01. **Prioridade:** P0.

**Objetivo:** Autenticação com senha e proteção das credenciais no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF01, RF03, RS02, RS03, RS04, RN02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Login usa senha em texto puro; /sessao/pessoa autentica por ID; segredos e conta padrão estão no código (E01/E03/E12).

**Arquivos relacionados:** server/index.js:24, :125, :163, :390, :423, :498; server/package.json. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** D11 exige procedimento de migração de credenciais legadas; a correção imediata do login sem senha não depende dessa definição.

**Instruções de implementação:**

Feche o endpoint que cria identidade por seleção sem senha e a enumeração pública usada para isso. Use hash adaptativo com salt e verificação no login/cadastro; não aceite hash enviado como senha. Retire valores sensíveis do fonte e a criação automática de conta previsível. Planeje migração/redefinição explícita dos legados sem manter comparação de texto puro. Regenere sessão após login, invalide a anterior, uniformize erro de credencial e limite tentativas com política documentada. Configuração deve falhar com diagnóstico sem imprimir segredos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Nenhuma sessão surge só por pessoa_id.
- conta válida entra com hash.
- senha errada não entra.
- não há segredo nem senha legada revelados.

**Testes necessários:**

Positivo: login válido e logout. Negativo: ID de outra pessoa, senha/hash inválido, perfil arbitrário e repetição de tentativas. Regressão: sessão administrativa e resposta de erro ao usuário.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 02 — AUTORIZAR OPERAÇÕES ADMINISTRATIVAS NO SERVIDOR

**Identificador:** P02. **Prioridade:** P0.

**Objetivo:** Autorizar operações administrativas no servidor no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF04, RF07–RF18, RS01, RS05, RN01. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Só DELETE /documentos usa requireAdmin; aluno cria conta e exclui professor (E02).

**Arquivos relacionados:** server/index.js:108, :118, :390, :593, :625, :656, :710, :755, :781. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** Preferencialmente P01 (autenticação com senha); pode corrigir a autorização central antes dela.

**Instruções de implementação:**

Aplique autorização administrativa a criação de credenciais, cadastro/edição/exclusão de pessoas e mutações de projetos. Use lista fechada de perfis no cadastro de conta. Dê 401 sem sessão e 403 a perfil sem permissão, antes de consultar ou alterar SQL. Não restrinja de modo indevido leituras acadêmicas, tratadas por vínculo em P07.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Administrador preserva CRUD.
- aluno/professor não executam mutações administrativas por HTTP direto, mesmo manipulando localStorage.

**Testes necessários:**

Positivo: cada rota administrativa autorizada. Negativo: anônimo, aluno, professor e perfil desconhecido em cada método. Regressão: professor continua podendo ler material autorizado.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 03 — CONFIGURAR ORIGEM DA API, CORS E COOKIES

**Identificador:** P03. **Prioridade:** P0.

**Objetivo:** Configurar origem da API, CORS e cookies no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF11, RC01, RC04, RS04. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Os dois scripts apontam a http://localhost:3000; CORS aceita qualquer origem com credenciais (E12/E13).

**Arquivos relacionados:** login/login.js:1; mainPage/cadastro.js:1; server/index.js:19, :26, :934. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01; D12 para parâmetros do ambiente de implantação.

**Instruções de implementação:**

Use origem atual por padrão ao servir o frontend pelo Express; se outra origem for necessária, use configuração pública explícita por ambiente. Defina allowlist CORS e opções de cookie/store/expiração adequadas ao ambiente HTTPS, sem embutir segredos. Preserve desenvolvimento local. Documente hospedagem e proxy de confiança somente se aplicável.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Celular acessando o host correto chama a API desse host.
- origem não permitida não recebe autorização CORS.
- sessões persistem conforme configuração explícita.

**Testes necessários:**

Positivo: mesma origem em desktop/celular e ambiente de teste HTTPS. Negativo: origem externa e cookie vencido. Regressão: login/logout/upload local.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 04 — ORGANIZAR INSTALAÇÃO E MIGRAÇÕES DO BANCO

**Identificador:** P04. **Prioridade:** P1.

**Objetivo:** Organizar instalação e migrações do banco no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF08, RNF10, RF44, RF47. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** DDL no connectDB não cria documentos; scripts separados mudam autor; ensureColumn ignora falhas (E10/E23).

**Arquivos relacionados:** server/index.js:88, :163, :241, :931; server/sql/*.sql; server/package.json. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01 remove bootstrap inseguro. Não combinar aqui migração de autoria P09 nem integridade P10.

**Instruções de implementação:**

Crie fluxo versionado de migrações, com sequência de instalação e atualização, retirando DDL silencioso da inicialização normal. Inclua schema base e documentos com versão esperada pela API. Falha deve ser observável e terminar com código de erro apropriado. Documente criação prévia/configuração do banco e comandos. Não execute migração em dados reais nesta tarefa sem escopo explícito.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Banco descartável vazio instala e reinicia.
- segunda execução não duplica alterações.
- versão incompatível/falha é diagnosticada sem segredo.

**Testes necessários:**

Positivo: instalação vazia e atualização de versão anterior. Negativo: permissão negada e coluna incompatível. Regressão: dados fictícios preservados entre versões.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 05 — ISOLAR TRANSAÇÕES POR CONEXÃO DE POOL

**Identificador:** P05. **Prioridade:** P1.

**Objetivo:** Isolar transações por conexão de pool no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF09, RNF10, RF15, RF17, RF18. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Toda requisição compartilha uma conexão mysql2 global (E08).

**Arquivos relacionados:** server/index.js:48, :164, :283, :295, :625, :710, :755, :781. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P04: ambiente de banco isolado e schema versionado.

**Instruções de implementação:**

Use pool mysql2; obtenha uma conexão dedicada por transação e passe-a às funções de sincronização. Faça commit/rollback e release em finally; não misture connection.query global com transação dedicada. Documente tratamento de perda de conexão, sem reconectar no meio de uma transação incompleta.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Duas operações concorrentes não compartilham transação.
- falha numa não confirma/reverte dados da outra.
- conexões sempre voltam ao pool.

**Testes necessários:**

Positivo: transações independentes concorrentes em banco descartável. Negativo: falha intermediária, rollback e indisponibilidade. Regressão: CRUD de projeto e pessoa.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 06 — VINCULAR CREDENCIAIS A ALUNOS E PROFESSORES

**Identificador:** P06. **Prioridade:** P0.

**Objetivo:** Vincular credenciais a alunos e professores no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF01, RF03, RF07, RF11, RF47, RN11. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** usuarios não referencia aluno/professor; registros acadêmicos são criados sem conta (E01/E06).

**Arquivos relacionados:** server/index.js:171, :182, :193, :390, :449, :656; server/sql/ (novas migrações). Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01 (hash e login), P04/P05 (migração e transação); D10/D11 (identificador e legados).

**Instruções de implementação:**

Modele referência inequívoca entre credencial e pessoa/perfil e inclua-a na sessão autenticada. Faça cadastro administrativo da pessoa e credencial com consistência transacional. Aplique identificador e política de senha aprovados; não use nome para vincular legados automaticamente. Preveja relatório e migração explícita dos registros existentes e evite credenciais órfãs ou vínculos incompatíveis.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Conta de aluno/professor autentica a própria pessoa sem seletor.
- duplicidade de vínculo é recusada.
- falha parcial não deixa metade do cadastro.

**Testes necessários:**

Positivo: criar e entrar nos dois perfis. Negativo: pessoa inexistente, perfil incompatível, vínculo duplicado e falha na segunda gravação. Regressão: administrador e pessoas legadas.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 07 — FILTRAR RECURSOS ACADÊMICOS POR IDENTIDADE E VÍNCULO

**Identificador:** P07. **Prioridade:** P0.

**Objetivo:** Filtrar recursos acadêmicos por identidade e vínculo no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF04, RF08, RF12, RF16, RF43, RF44, RF48, RS01, RS04, RS05, RN06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** GET /projetos retorna tudo; frontend filtra; professor lê documentos de qualquer projeto (E04).

**Arquivos relacionados:** server/index.js:531, :568, :689, :736, :827, :860; mainPage/cadastro.js:535. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01 e P06: identidade autenticada vinculada a pessoa; P02: privilégios administrativos.

**Instruções de implementação:**

Obtenha identidade exclusivamente da sessão e aplique acesso por projeto_aluno/projeto_professor em lista, detalhe, metadados e envio. Administrador mantém gestão; alunos consultam somente sua participação e seus envios; professores consultam atividades que acompanham. Restrinja dados pessoais retornados ao necessário e não exponha /usuarios inteiro a perfis acadêmicos. Rejeite acesso por ID alheio antes do upload definitivo.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Lista não contém projeto alheio.
- detalhe, documentos e envio não permitem contornar filtro.
- alterar IDs na URL não muda identidade.

**Testes necessários:**

Positivo: membro com acesso correto. Negativo: projeto de outro aluno/professor, IDs de sessão inexistentes, manipulação de query e localStorage. Regressão: gestão do administrador.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 08 — DOWNLOAD AUTENTICADO DOS DOCUMENTOS

**Identificador:** P08. **Prioridade:** P0.

**Objetivo:** Download autenticado dos documentos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF44, RF48, RS07, RN02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** /uploads é público e frontend usa caminho direto (E05).

**Arquivos relacionados:** server/index.js:46, :814, :827; mainPage/cadastro.js:646. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07: regras de vínculo; P09 pode depois substituir o formato legado da autoria.

**Instruções de implementação:**

Substitua express.static de uploads por endpoint de download por ID do documento. Autentique e autorize com o mesmo vínculo de projeto e autoria dos metadados; resolva caminho a partir do registro e confine-o ao diretório permitido. Defina Content-Disposition seguro para o nome original e trate arquivo ausente sem revelar caminho interno. Atualize os links da interface.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- URL estática antiga não entrega bytes.
- autor autorizado e professor responsável baixam.
- não autorizado recebe negação.
- caminho fora da pasta nunca é lido.

**Testes necessários:**

Positivo: download autorizado com nome acentuado. Negativo: anônimo, outro aluno, professor não vinculado, traversal em dado legado e arquivo ausente. Regressão: listagem e logout.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 09 — CORRIGIR IDENTIDADE DO AUTOR DOS DOCUMENTOS

**Identificador:** P09. **Prioridade:** P0.

**Objetivo:** Corrigir identidade do autor dos documentos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF47, RF48, RS04, RS07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Autor usa inteiro polimórfico; filtro do aluno ignora perfil e administrador vira aluno (E06).

**Arquivos relacionados:** server/index.js:814, :849, :869; server/sql/documentos*.sql; mainPage/cadastro.js:646. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P06, P04 e D07/D10 para preservação de autores legados.

**Instruções de implementação:**

Migre autoria para referência estável à credencial/pessoa autenticada. Nunca derive perfil administrativo como aluno. Separe registros legados sem correspondência inequívoca, preservando data/nome/arquivo e registrando pendência de saneamento. Atualize consultas e exibição para não confundir professor/aluno com o mesmo ID. Preserve autoria histórica ao alterar/excluir cadastro, segundo política aprovada.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Professor e aluno com IDs iguais não compartilham envios.
- novo envio tem autor real e data.
- administrador não é rotulado aluno.
- legado ambíguo não recebe autor inventado.

**Testes necessários:**

Positivo: envio e leitura dos perfis previstos. Negativo: colisão de IDs, identidade inválida e legado ambíguo. Regressão: arquivos e timestamps preservados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 10 — VALIDAR RELAÇÕES E INTEGRIDADE DOS PROJETOS

**Identificador:** P10. **Prioridade:** P1.

**Objetivo:** Validar relações e integridade dos projetos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF15, RF17, RS06, RN08. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** IDs são normalizados e UNIQUE protege pares; FKs e checagem de existência faltam (E09).

**Arquivos relacionados:** server/index.js:208, :221, :231, :257, :364, :710, :755; server/sql/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P04, P05; não muda quantidades de membros sem D09.

**Instruções de implementação:**

Valide tipos e inteiros positivos sem descartar silenciosamente entradas ruins; confirme existência de todos os membros antes de gravar. Adicione FKs para os vínculos e referência compatível de responsável após diagnosticar legados. Não remova registros inválidos automaticamente. Preserve deduplicação e regras atuais de equipe até D09 decidir alteração.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- IDs inexistentes/inválidos não viram vínculo.
- falha cancela operação.
- banco rejeita relações órfãs.
- pares duplicados permanecem bloqueados.

**Testes necessários:**

Positivo: múltiplos membros válidos. Negativo: referência ausente, zero, decimal, objeto, string inválida, duplicata e erro intermediário. Regressão: edição preserva membros não alterados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 11 — VALIDAR CADASTRO E EDIÇÃO DE PESSOAS NA API

**Identificador:** P11. **Prioridade:** P1.

**Objetivo:** Validar cadastro e edição de pessoas na API no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF07, RF09, RF11, RF13, RS06, RN08. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** POST exige só nome; PUT aceita vazio; colunas permitem demais campos ausentes (E07/E22).

**Arquivos relacionados:** server/index.js:593, :656; server/sql/; mainPage/menuCadastro.html:269. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02; D10 somente para campos específicos/identificador do professor.

**Instruções de implementação:**

Centralize validação de POST/PUT: tipos, trim, tamanho e nome. Para aluno exija matrícula numérica inteira, curso da lista da ERS, turma, e-mail válido e telefone brasileiro. Normalize valores legados de curso sem perder dados. Para professor aplique os obrigatórios aprovados e valide opcionais quando informados. Não invente unicidade global nem domínio institucional obrigatório.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- API direta rejeita aluno incompleto e entradas malformadas.
- professor segue contrato explícito.
- erros apontam campos sem persistência parcial.

**Testes necessários:**

Positivo: cadastros/edições válidos. Negativo: objetos no lugar de texto, obrigatório ausente, matrícula decimal/negativa, curso/turma inválidos, e-mail e telefone errados. Regressão: legados e nomes acentuados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 12 — VALIDAR FORMULÁRIO DE ALUNO E APLICAR MÁSCARA DE TELEFONE

**Identificador:** P12. **Prioridade:** P1.

**Objetivo:** Validar formulário de aluno e aplicar máscara de telefone no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF07, RF09, RS06, RN08, RN09. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Campos são text/radio e submitAluno só verifica nome; telefone tem placeholder (E07/E22).

**Arquivos relacionados:** mainPage/menuCadastro.html:269; mainPage/cadastro.js:759, :788; mainPage/menu.css. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P11: contrato e mensagens de validação da API.

**Instruções de implementação:**

Faça validação explícita antes de fetch ou form semântico equivalente. Exija matrícula inteira numérica, curso, turma, e-mail e telefone para aluno; alinhe rótulo Desenvolvimento de Jogos Digitais à ERS e mapeamento persistido. Use máscara JavaScript (99) 99999-9999 em cadastro/edição com colar/apagar; mantenha validação do servidor. Aplique formatação no telefone do professor sem inventar obrigatoriedade adicional.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Dados incompletos não são enviados.
- telefone digitado/colado/editado mantém formato.
- curso e filtros continuam coerentes com legados.

**Testes necessários:**

Positivo: aluno válido e edição. Negativo: campos vazios, e-mail inválido, matrícula não inteira, telefone curto, colagem e caracteres extras. Regressão: limpar/voltar/filtros.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 13 — USAR SESSÃO DO SERVIDOR COMO IDENTIDADE NA INTERFACE

**Identificador:** P13. **Prioridade:** P1.

**Objetivo:** Usar sessão do servidor como identidade na interface no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF01, RF03, RF04, RNF02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Perfil e IDs vêm do localStorage; seletor Quem é você troca identidade (E01/E19).

**Arquivos relacionados:** server/index.js:449, :523; mainPage/cadastro.js:422, :428, :476, :981; mainPage/menuCadastro.html:103; login/login.html; login/login.js. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01, P02 e P06.

**Instruções de implementação:**

Forneça consulta de sessão com dados mínimos e carregue menus a partir dela. Remova escolha de pessoa como autenticação e default administrativo sem sessão. Aluno/professor veem própria identidade após login. Atenda à seleção visual de tipo do usuário descrita na ERS sem usá-la como prova de permissão; perfil validado pelo servidor prevalece. Trate expiração e logout limpando estado.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Reload mantém identidade confirmada.
- alterar localStorage não muda acesso/menu real.
- tela sem sessão encaminha ao login.
- perfil incompatível não é aceito como autenticação.

**Testes necessários:**

Positivo: login/reload/logout de cada perfil. Negativo: storage forjado, sessão expirada e pessoa removida. Regressão: menu móvel e fluxo administrativo.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 14 — TRATAR RESPOSTAS HTTP ANTES DE ATUALIZAR A INTERFACE

**Identificador:** P14. **Prioridade:** P1.

**Objetivo:** Tratar respostas HTTP antes de atualizar a interface no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF03, RF08, RF12, RF16. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Leituras chamam json e usam objetos sem res.ok; 401 redireciona mas continua (E14).

**Arquivos relacionados:** mainPage/cadastro.js:7, :71, :446, :535, :619, :729, :829, :840, :853; login/login.js. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P13 estabelece sessão; pode ser preparada com respostas simuladas antes.

**Instruções de implementação:**

Centralize tratamento de status/JSON e erros de rede. Interrompa fluxo em 401 e valide o formato dos dados antes de renderizar/alterar currentEditId. Não abra edição vazia quando GET falha. Distinga 403/404/validação/servidor sem revelar dados técnicos; preserve mensagens amigáveis e possibilidade de tentar novamente.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- 404/500 não iniciam edição nem causam TypeError de coleção.
- 401 interrompe fluxo.
- erro não sobrescreve dados já corretos.

**Testes necessários:**

Positivo: listas/detalhes válidos. Negativo: 401,403,404,500, JSON inválido e rede indisponível. Regressão: busca/filtro/retorno e envio multipart.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 15 — RESPOSTAS CORRETAS PARA RECURSOS AUSENTES E ERROS DA API

**Identificador:** P15. **Prioridade:** P1.

**Objetivo:** Respostas corretas para recursos ausentes e erros da API no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF09, RF10, RF13, RF14, RF17, RF18, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** PUT/DELETE retornam sucesso sem existência; handler devolve 400 para qualquer erro (E15).

**Arquivos relacionados:** server/index.js:593, :625, :755, :781, :925. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02 e P05; integração com P14.

**Instruções de implementação:**

Verifique existência/affectedRows de maneira que UPDATE sem alteração não seja confundido com registro ausente. Responda 404 para recurso inexistente, conflito apropriado, validação 400/422 consistente e falha interna 500 sem err.message sensível. Preserve rollback e formato JSON. Não refaça neste prompt filtros de autorização já corrigidos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Recurso ausente não recebe sucesso.
- salvar valores iguais permanece sucesso.
- erro interno é registrado e não vaza detalhe SQL.

**Testes necessários:**

Positivo: edição real e idêntica, exclusão existente. Negativo: IDs inexistentes/malformados, conflito e erro SQL simulado. Regressão: frontend trata todos os estados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 16 — VALIDAR E LIMITAR UPLOADS DE DOCUMENTOS

**Identificador:** P16. **Prioridade:** P1.

**Objetivo:** Validar e limitar uploads de documentos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF44, RF45, RS06, RS07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Há allowlist de extensão e UUID; não há limite/inspeção do conteúdo (E11).

**Arquivos relacionados:** server/index.js:58, :73, :81, :860; mainPage/cadastro.js:694. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07, P08, P04; limite operacional deve ser documentado sem apresentar como requisito da ERS.

**Instruções de implementação:**

Estabeleça limite documentado e configurável de arquivo e multipart; valide extensão e conteúdo compatível, sem confiar em MIME do cliente. Autorize projeto antes do armazenamento definitivo. Valide descricao como texto não vazio após trim e dentro do tamanho do schema; limpe temporários em falha. Dê mensagem e status adequados; não acrescente tipos de arquivo fora dos atualmente aceitos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Arquivo válido autorizado persiste.
- tipo falso, tamanho excessivo e descrição inválida são recusados.
- falhas não deixam arquivo órfão.

**Testes necessários:**

Positivo: cada formato aceito com fixture mínima válida. Negativo: assinatura incompatível, extensão dupla, arquivo grande, campo objeto/whitespace e projeto proibido. Regressão: nome original escapado e UUID seguro.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 17 — COORDENAR EXCLUSÃO DE PROJETO E ARQUIVOS FÍSICOS

**Identificador:** P17. **Prioridade:** P1.

**Objetivo:** Coordenar exclusão de projeto e arquivos físicos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF18, RF44, RS07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Cascade remove linhas, mas DELETE /projetos não remove arquivos; unlink ignora falha (E16).

**Arquivos relacionados:** server/index.js:781, :804, :903; server/sql/documentos.sql:15. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02, P08, P04 e P05.

**Instruções de implementação:**

Levante documentos dependentes antes da remoção do projeto. Faça limpeza recuperável, com paths confinados à pasta de documentos e diagnóstico/repetição em caso de falha. Não apague arquivo antes de saber que a transação de banco foi confirmada. Evite remover bytes externos e reporte pendências de limpeza sem anunciar conclusão falsa.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Exclusão autorizada deixa resultado consistente e arquivos removidos ou pendência rastreável.
- rollback não perde arquivo.
- caminho fora da pasta não é tocado.

**Testes necessários:**

Positivo: projeto com múltiplos documentos. Negativo: falha SQL, unlink negado, path externo e arquivo já ausente. Regressão: projeto não excluído mantém seus arquivos.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 18 — ADICIONAR STATUS DO PROJETO

**Identificador:** P18. **Prioridade:** P1.

**Objetivo:** Adicionar status do projeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF15, RF16, RF17. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Projeto só tem título/descrição/objetivo/membros; datas no DDL não são usadas (E17).

**Arquivos relacionados:** server/index.js:208, :341, :364, :710, :755; mainPage/menuCadastro.html:321; mainPage/cadastro.js:853, :891; server/sql/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02, P04 e P10; classificação inicial dos legados deve ser acordada na execução.

**Instruções de implementação:**

Adicione status aos contratos, persistência, cadastro/edição e visualização, limitado aos valores finalizado, em andamento e cancelado descritos em §4.1.7. Só administrador altera. Migre projetos existentes por regra explícita que preserve a incerteza histórica, sem afirmar que estavam em andamento por dedução. Não implemente período enquanto D05 estiver aberto.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Status escolhido persiste e reaparece.
- valor inválido/perfil sem permissão é recusado.
- legados têm tratamento documentado.

**Testes necessários:**

Positivo: criar/alterar/exibir os três estados. Negativo: estado arbitrário e aluno alterando. Regressão: descrição/objetivo e vínculos inalterados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 19 — MOSTRAR INFORMAÇÕES DO PROJETO AOS PARTICIPANTES

**Identificador:** P19. **Prioridade:** P1.

**Objetivo:** Mostrar informações do projeto aos participantes no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF16, RF43, RF48, RNF02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Detalhe acadêmico exibe só título/documentos; participação é associação administrativa (E17).

**Arquivos relacionados:** mainPage/cadastro.js:535, :592; mainPage/menuCadastro.html:114; server/index.js:736. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07, P13 e P18; participação além do vínculo administrativo aguarda D09.

**Instruções de implementação:**

Exiba descrição, objetivo, status disponível e membros autorizados no detalhe retornado pela API segura. Preserve documentos enviados e separação aluno/professor. Não use lista global como fonte da autorização. Mostre indicação de participação existente; não crie autoinscrição, aprovação ou exigência nova de equipe.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Participante lê informações e seus documentos autorizados.
- não membro não abre detalhe.
- professor responsável identifica submissões permitidas.

**Testes necessários:**

Positivo: aluno/professor vinculados e projeto sem documentos. Negativo: URL/ID de outro projeto e sessão expirada. Regressão: upload/voltar/menu móvel.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 20 — MODELO E API DE CADASTRO DE SUBPROJETO

**Identificador:** P20. **Prioridade:** P1.

**Objetivo:** Modelo e API de cadastro de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF19, RF20, RN04. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Subprojeto não existe; ERS §4.1.8 define campos (pp.7–8).

**Arquivos relacionados:** server/index.js:208 e rotas de projeto; server/sql/ (novo schema). Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02, P07, P04 e P10.

**Instruções de implementação:**

Crie relação 1:N com projeto e endpoint administrativo de cadastro com título, objetivo, descrição e temas abordados. Garanta projeto existente e tipos/tamanhos coerentes; título identifica o registro. Não crie entidade Conteúdo nem vínculo de quiz ainda indefinidos. Defina contrato de lista/detalhe seguro para leitura posterior, sem frontend neste prompt.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Administrador cadastra dois subprojetos do mesmo projeto, que persistem.
- projeto inexistente e perfil sem permissão são rejeitados.

**Testes necessários:**

Positivo: vários subprojetos no mesmo projeto. Negativo: projeto ausente, título vazio, texto de tipo errado e perfil aluno/professor. Regressão: projetos existentes.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 21 — API DE EDIÇÃO DE SUBPROJETO

**Identificador:** P21. **Prioridade:** P1.

**Objetivo:** API de edição de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF21, RS06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe edição; P20 deverá fornecer entidade e cadastro.

**Arquivos relacionados:** server/index.js ou módulo de subprojetos extraído; server/sql/; contratos de P20. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P20 e P15.

**Instruções de implementação:**

Implemente leitura para edição e atualização administrativa dos campos definidos em §4.1.8, com validação e resposta de ausência. Preserve identidade/projeto pai; se transferência de projeto não tiver sido aprovada, não acrescente essa operação. Reuse autorização e validação do cadastro.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Edição válida persiste sem alterar outros subprojetos.
- registro ausente e usuário não administrador são recusados.

**Testes necessários:**

Positivo: editar cada campo e salvar sem alteração. Negativo: vazio/tipos inválidos, ID alheio/inexistente e perfil não autorizado. Regressão: cadastro/lista e vínculo pai.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 22 — API DE EXCLUSÃO DE SUBPROJETO

**Identificador:** P22. **Prioridade:** P1.

**Objetivo:** API de exclusão de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF22, RS07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe exclusão de subprojeto nem política de dependentes.

**Arquivos relacionados:** server/index.js ou módulo de subprojetos; server/sql/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P20/P21, P05/P15; D07 se já houver envios associados.

**Instruções de implementação:**

Implemente exclusão administrativa com verificação de existência e transação conforme dependentes reais. Não apague conteúdos, quizzes ou arquivos por uma cascata presumida: use apenas política registrada e relacionamentos já existentes. Garanta ausência de efeitos em outros subprojetos e tratamento de falha.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Administrador exclui subprojeto permitido.
- dependentes seguem política explícita.
- acesso indevido e ID ausente são rejeitados.

**Testes necessários:**

Positivo: subprojeto sem dependentes. Negativo: dependência protegida, falha SQL, perfil sem acesso e registro ausente. Regressão: projeto pai e irmãos preservados.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 23 — LISTA E DETALHE DE SUBPROJETOS

**Identificador:** P23. **Prioridade:** P1.

**Objetivo:** Lista e detalhe de subprojetos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF19, RF20, RN04, RNF02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Menus e detalhes atuais não têm subprojetos.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js:592; mainPage/menu.css; API de P20. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P19, P20 e P14.

**Instruções de implementação:**

Inclua navegação de leitura de subprojetos por projeto para administrador e participantes autorizados. Exiba título, objetivo, descrição e temas, com carregando/vazio/erro e retorno ao pai. Não implemente formulário de escrita neste prompt nem menus de conteúdos/editais. Não renderize HTML arbitrário dos textos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Cada projeto mostra somente seus subprojetos.
- participante autorizado lê.
- voltar preserva contexto.
- erro não abre detalhe vazio.

**Testes necessários:**

Positivo: projeto com vários ou nenhum subprojeto. Negativo: ID de outro projeto e API 401/403/404/500. Regressão: detalhe de projeto/documentos.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 24 — FORMULÁRIO DE CRIAÇÃO DE SUBPROJETO

**Identificador:** P24. **Prioridade:** P1.

**Objetivo:** Formulário de criação de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF20, RS06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe formulário; leitura é P23 e API é P20.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; mainPage/menu.css; API P20. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P20, P23 e P14.

**Instruções de implementação:**

Inclua formulário administrativo no contexto de um projeto para título, objetivo, descrição e temas. Valide conforme API e preserve dados em erro; após sucesso atualize lista mantendo projeto selecionado. Não crie conteúdo didático separado, quiz ou atividade nesse cadastro.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Subprojeto cadastrado persiste e aparece somente no pai correto.
- perfil acadêmico não tem escrita.

**Testes necessários:**

Positivo: criar subprojeto em dois projetos. Negativo: título inválido, pai inexistente, 403/500 e tentativa por aluno. Regressão: voltar/lista/projeto.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 25 — FORMULÁRIO DE EDIÇÃO DE SUBPROJETO

**Identificador:** P25. **Prioridade:** P1.

**Objetivo:** Formulário de edição de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF21, RS06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe edição visual; API é P21.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; API P21. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P21, P23, P24 e P14.

**Instruções de implementação:**

Carregue registro confirmado e edite apenas campos aprovados. Preserve o projeto pai e IDs conforme contrato; não habilite transferência sem decisão. Atualize detalhe/lista após sucesso e mantenha rascunho em falha.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Alteração reaparece após recarregar.
- erro de consulta não vira formulário vazio.
- outros subprojetos não são alterados.

**Testes necessários:**

Positivo: editar todos os campos. Negativo: 404/403, validação e falha de gravação. Regressão: criação/listagem e retorno ao pai.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 26 — CONFIRMAÇÃO DE EXCLUSÃO DE SUBPROJETO

**Identificador:** P26. **Prioridade:** P1.

**Objetivo:** Confirmação de exclusão de subprojeto no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF22, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há ação visual; API de exclusão é P22.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; API P22. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P22, P23, P24 e P14.

**Instruções de implementação:**

Adicione exclusão administrativa com confirmação no contexto do projeto. Respeite política da API para dependentes; cancelar não faz requisição. Após sucesso atualize lista e seleções; em falha preserve item e apresente mensagem segura.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Exclusão permitida remove só o subprojeto escolhido.
- cancelamento e impedimento não alteram lista ou projeto pai.

**Testes necessários:**

Positivo: excluir registro elegível. Negativo: cancelar, dependentes protegidos, 403/404/500. Regressão: irmãos, projeto e documentos existentes.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 27 — NÚCLEO E API ADMINISTRATIVA DE CRIAÇÃO DE QUIZZES

**Identificador:** P27. **Prioridade:** P1.

**Objetivo:** Núcleo e API administrativa de criação de quizzes no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF33, RS06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há quiz, pergunta ou alternativa; diagrama na p.8 diverge nos vínculos/pontos.

**Arquivos relacionados:** server/index.js (rotas/módulos); server/sql/; ERS §4.1.9 p.8. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02, P04, P05; D08 para tipo de questão. D03/D04 e RF40 continuam fora deste escopo.

**Instruções de implementação:**

Implemente apenas o núcleo confirmado de quiz: título, descrição, perguntas, alternativas e marcação de resposta correta, com criação administrativa e persistência transacional. Registre decisões aprovadas sobre tipo de questão antes de validar quantidade de corretas. Não decida relação projeto/subprojeto, pontuação nem publicação neste prompt. Pode criar núcleo sem expô-lo a alunos enquanto os contratos pendentes não forem definidos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Administrador cria estrutura consistente e consulta seus dados.
- falha em alternativa reverte o conjunto.
- nenhum gabarito é exposto publicamente.

**Testes necessários:**

Positivo: quiz com perguntas/alternativas segundo tipo aprovado. Negativo: pergunta/alternativa inválida, escrita não administrativa e falha parcial. Regressão: usuários/projetos/subprojetos.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 28 — FORMULÁRIO ADMINISTRATIVO DE CRIAÇÃO DE QUIZ

**Identificador:** P28. **Prioridade:** P1.

**Objetivo:** Formulário administrativo de criação de quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF33, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há interface; núcleo de API é P27.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; mainPage/menu.css; API P27. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P27, P13 e P14.

**Instruções de implementação:**

Crie formulário para título/descrição, perguntas, alternativas e resposta correta conforme contrato aprovado. Permita compor e revisar estrutura antes de enviar; valide e apresente erros por campo. Só administrador acessa e API continua autorizando. Não adicione publicação, vínculos nem pontuação enquanto os respectivos requisitos estiverem indefinidos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Quiz criado reaparece pela API com a mesma estrutura.
- erro não apaga rascunho local do formulário.
- campos incorretos não são enviados.

**Testes necessários:**

Positivo: montar quiz com múltiplas perguntas. Negativo: estrutura inválida, API 400/403/500 e aluno abrindo form. Regressão: navegação administrativa e cadastro de projeto.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 29 — API DE EDIÇÃO ADMINISTRATIVA DE QUIZ

**Identificador:** P29. **Prioridade:** P1.

**Objetivo:** API de edição administrativa de quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF34, RS06. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe edição de quiz; núcleo é dependência P27.

**Arquivos relacionados:** Módulo/API de quiz criado em P27; server/sql/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P27, P05, P15; D08 sobre alterações após respostas.

**Instruções de implementação:**

Implemente leitura administrativa e atualização de título, descrição, perguntas, alternativas e resposta correta do núcleo. Preserve IDs de forma consistente e valide transacionalmente. Política de alteração quando já existirem respostas deve estar registrada antes da execução; não crie restrição ou versionamento sem decisão. Não adicione publicação ou pontuação neste prompt.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Alteração válida persiste.
- conjunto inválido não é salvo parcialmente.
- gabarito permanece disponível somente para administração.

**Testes necessários:**

Positivo: editar textos/alternativas. Negativo: estrutura inválida, perfil indevido e quiz com respostas sob a política aprovada. Regressão: criação e integridade das respostas existentes.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 30 — FORMULÁRIO ADMINISTRATIVO DE EDIÇÃO DE QUIZ

**Identificador:** P30. **Prioridade:** P1.

**Objetivo:** Formulário administrativo de edição de quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF34, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há edição visual; API é dependência P29.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; mainPage/menu.css; API P29. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P29, P28 e P14.

**Instruções de implementação:**

Carregue quiz autorizado e permita editar campos do núcleo conforme contrato P29. Preserve IDs, respostas corretas e textos não alterados; apresente restrições de alteração aprovadas sem descartar dados. Não abra formulário vazio em falha nem adicione regra de publicação/cálculo.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Salvar e recarregar preserva estrutura.
- falha não mostra sucesso nem perde edição.
- política de quiz com respostas é respeitada.

**Testes necessários:**

Positivo: editar cada tipo de campo. Negativo: 404/403, conjunto inválido e alteração vedada pela política. Regressão: criação/lista e tentativas existentes.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 31 — API DE EXCLUSÃO ADMINISTRATIVA DE QUIZ

**Identificador:** P31. **Prioridade:** P1.

**Objetivo:** API de exclusão administrativa de quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF35. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não existe remoção de quiz nem política de retenção.

**Arquivos relacionados:** Módulo/API de quiz criado em P27; server/sql/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P27, P05, P15; D08 para retenção.

**Instruções de implementação:**

Implemente exclusão administrativa com existência e transação. Antes, exija política registrada para quizzes com respostas/resultados; aplique-a sem apagar histórico por conveniência. Não altere estado de publicação, cálculo ou regras de tentativa nesta tarefa.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Quiz elegível é removido.
- respostas/resultados são preservados ou tratados exatamente pela decisão aprovada.
- perfil indevido não altera dados.

**Testes necessários:**

Positivo: quiz sem dependentes. Negativo: quiz com resultado protegido, ID ausente e falha intermediária. Regressão: outros quizzes e consultas de resultado.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 32 — CONFIRMAÇÃO DE EXCLUSÃO ADMINISTRATIVA DE QUIZ

**Identificador:** P32. **Prioridade:** P1.

**Objetivo:** Confirmação de exclusão administrativa de quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF35, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há ação visual; API depende de P31.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; API P31. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P31, P28 e P14.

**Instruções de implementação:**

Adicione ação com confirmação explícita antes de excluir. Use API administrativa, trate ausência/conflito/negação e atualize lista somente após sucesso. Mostre motivo de proteção de histórico conforme política; não remova quiz apenas do DOM e não apague dependentes pelo frontend.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Cancelar não envia DELETE.
- sucesso remove da lista após persistência.
- conflito mantém item e explica ação.

**Testes necessários:**

Positivo: exclusão permitida. Negativo: cancelar, histórico protegido, 403/404/500. Regressão: editar outro quiz e catálogo autorizado.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 33 — ENTRADA PÚBLICA E INFORMAÇÕES DE PROJETOS PARA VISITANTE

**Identificador:** P33. **Prioridade:** P1.

**Objetivo:** Entrada pública e informações de projetos para visitante no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF02, RF42 (base pública), RNF02. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Entrar como visitante é href="#"; GET /projetos exige sessão e inclui dados pessoais.

**Arquivos relacionados:** login/login.html:25; mainPage/menuCadastro.html; mainPage/cadastro.js; server/index.js:689. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02, P07 e P08; D02 não bloqueia informações de projeto, mas bloqueia conteúdos educacionais.

**Instruções de implementação:**

Crie área pública com início, informações sobre o LabHist, lista/detalhe de informações públicas de projetos e acesso ao login. Use contrato público separado, sem membros/dados pessoais/documentos privados. Defina de forma explícita quais informações de projeto são públicas conforme ERS; se o responsável exigir seleção de visibilidade ainda não definida, registre decisão antes de expor. Preserve autenticação para ações restritas. Não implemente conteúdos ou editais pendentes/removidos; quizzes públicos são P34.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Link visitante abre área funcional sem sessão.
- informações públicas previstas são consultáveis.
- nenhuma rota pública lista dados pessoais ou arquivos privados.

**Testes necessários:**

Positivo: acesso sem cookie e entrada para login. Negativo: tentar CRUD/upload/resposta como visitante e inspecionar payload público. Regressão: login de todos os perfis.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 34 — CATÁLOGOS DE QUIZZES PARA ALUNO E VISITANTE

**Identificador:** P34. **Prioridade:** P1.

**Objetivo:** Catálogos de quizzes para aluno e visitante no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF37, RF42, RN03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há lista de quizzes nem resumos públicos.

**Arquivos relacionados:** API/módulo de quiz P27; mainPage/menuCadastro.html; mainPage/cadastro.js; login/login.html. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07, P27, P33; D03/D04 e tarefa futura de vínculo/publicação aprovada.

**Instruções de implementação:**

Implemente somente consulta/listagem e detalhe introdutório de quizzes disponíveis conforme vínculo/publicação já aprovados e implementados. Aluno vê o catálogo autorizado; visitante apenas dados explicitamente públicos. Separe resposta administrativa com gabarito da resposta pública/aluno. Não crie estados ou critérios de visibilidade enquanto D03/D04 estiverem abertos.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Aluno não vê quiz de projeto alheio.
- visitante vê somente introdução pública e não recebe gabarito nem pode responder.

**Testes necessários:**

Positivo: catálogo autorizado e resumo público aprovado. Negativo: quiz indisponível/alheio, gabarito na resposta e acesso anônimo ao envio. Regressão: navegação e sessão.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 35 — PERSISTIR RESPOSTAS E RESULTADOS COM IDENTIDADE DO ALUNO

**Identificador:** P35. **Prioridade:** P1.

**Objetivo:** Persistir respostas e resultados com identidade do aluno no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF39, RF49, RN11, RS04. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há respostas/tentativas/resultados; cálculo RF40 ainda é indefinido.

**Arquivos relacionados:** Módulo/API de quiz P27; server/sql/; sessão vinculada de P06. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01, P07, P06, P05, P27; D03/D04/D08 e futura tarefa de correção/publicação aprovada. BLOQUEADO até essas condições.

**Instruções de implementação:**

Implemente endpoint de submissão transacional que usa aluno da sessão, valida cada pergunta/alternativa pertencente ao quiz autorizado e persiste respostas. Grave resultado associado ao mesmo aluno consumindo contrato de correção já aprovado e implementado; não invente fórmula, pontuação ou tentativas. Só execute a etapa de resultado após resolver D08 e existir a correção correspondente. Reenvios seguem política aprovada, sem aceitar aluno_id ou nota calculada pelo navegador.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Respostas e resultado aprovado persistem juntos, sem autoria forjada.
- erro reverte o conjunto.
- visitante/professor e aluno sem vínculo não submetem.

**Testes necessários:**

Positivo: conjunto válido e resultado da correção conhecida. Negativo: alternativa de outro quiz, nota/aluno forjados, duplicação conforme política, quiz indisponível e falha parcial. Regressão: gabarito protegido e edição/histórico.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 36 — INTERFACE DO ALUNO PARA RESPONDER QUIZ

**Identificador:** P36. **Prioridade:** P1.

**Objetivo:** Interface do aluno para responder quiz no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF38, RN03, RN11. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Sem formulário de resposta; catálogo e submissão são P34/P35.

**Arquivos relacionados:** mainPage/menuCadastro.html; mainPage/cadastro.js; mainPage/menu.css; APIs P34/P35. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P34 e P35; decisões D03/D04/D08 resolvidas.

**Instruções de implementação:**

Exiba perguntas/alternativas sem gabarito e envie respostas no contrato aprovado, sem aluno_id nem pontuação do cliente. Trate campos pendentes conforme política de resposta aprovada e prevenção de submissões acidentais repetidas. Resultado apresentado deve vir do servidor após persistência. Nunca habilite resposta para visitante/professor.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Aluno autorizado responde e recebe confirmação/resultado persistido.
- visitante vê somente introdução.
- erro de envio conserva respostas para correção conforme política.

**Testes necessários:**

Positivo: quiz válido e resposta concluída. Negativo: indisponível, fora do vínculo, sessão expirada e repetição conforme política. Regressão: catálogo, histórico e gabarito não exposto.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 37 — TEXTO EXPLICATIVO INDEPENDENTE NA SUBMISSÃO DE ARQUIVO

**Identificador:** P37. **Prioridade:** P1.

**Objetivo:** Texto explicativo independente na submissão de arquivo no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF46, RF44, RF45. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Documento possui somente descrição; ERS §5.3 distingue descrição e texto explicativo.

**Arquivos relacionados:** server/sql/documentos.sql; server/index.js:814, :860; mainPage/menuCadastro.html:133; mainPage/cadastro.js:694. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07, P04, P09, P16; vínculo de atividade permanece bloqueado por D07.

**Instruções de implementação:**

Adicione campo separado de texto explicativo ao schema, API, formulário e leitura autorizada. Valide tipo/tamanho e preserve descrição existente; não interprete texto como HTML. Migre legados sem fabricar conteúdo. Não torne esse campo obrigatório ou associe atividade/subprojeto sem regra consolidada; a ERS diz que o aluno pode inserir o texto.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Novo texto é salvo e exibido sem substituir descrição.
- legados continuam legíveis.
- HTML é exibido como texto seguro.

**Testes necessários:**

Positivo: envio com descrição/texto distintos e leitura autorizada. Negativo: texto de tipo errado/excessivo e script. Regressão: envio legado sem novo campo e download.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 38 — HISTÓRICO DE DESEMPENHO DO PRÓPRIO ALUNO

**Identificador:** P38. **Prioridade:** P1.

**Objetivo:** Histórico de desempenho do próprio aluno no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF51, RF50 (infraestrutura compartilhada), RN11. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Não há resultados/histórico; ERS §5.7 prevê quiz, pontuação e percentual.

**Arquivos relacionados:** API de resultados P35; mainPage/menuCadastro.html; mainPage/cadastro.js. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P13, P14, P35; D08/correção resolvidos. Evolução RF52 continua aguardando D06.

**Instruções de implementação:**

Crie consulta e tela do aluno autenticado para resultados de quizzes, com identificação do quiz, data, pontuação e percentual já apurados pela correção aprovada. Filtre no servidor pela identidade da sessão e exponha apenas campos autorizados. Não crie gráfico de evolução, metas ou ranking. Trate vazio/erro/carregamento e navegação.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Aluno vê exclusivamente próprios resultados persistidos.
- valores coincidem com apuração e nenhum gabarito adicional é vazado.

**Testes necessários:**

Positivo: histórico com múltiplos resultados e vazio. Negativo: consultar aluno_id alheio, sessão inválida e API com falha. Regressão: resposta/resultado de quiz e logout.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 39 — CONSULTA DO PROFESSOR AOS RESULTADOS ACOMPANHADOS

**Identificador:** P39. **Prioridade:** P1.

**Objetivo:** Consulta do professor aos resultados acompanhados no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF41, RF50, RN07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Professor só tem lista de documentos, sem resultados de quiz.

**Arquivos relacionados:** API de resultados P35; mainPage/menuCadastro.html; mainPage/cadastro.js; vínculo projeto_professor. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07, P35, P38; D03/D06 definem acompanhamento; D08/correção implementada.

**Instruções de implementação:**

Crie consulta e tela de resultados somente das atividades/quizzes que o professor acompanha pela relação aprovada. Apresente aluno, quiz, data, pontuação, percentual de acertos e questões respondidas autorizadas conforme §6.5. Filtre no servidor e minimize dados pessoais. Não implemente gráfico de evolução ou ranking e não aceite professor_id do cliente como identidade.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Professor consulta resultados de seus alunos vinculados.
- outro professor não acessa por URL nem payload.
- valores coincidem com apuração persistida.

**Testes necessários:**

Positivo: atividade acompanhada com alunos/resultados e vazio. Negativo: projeto de outro professor, papel aluno/visitante e falha da API. Regressão: histórico próprio do aluno e documentos.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 40 — API DE RECUPERAÇÃO DE SENHA POR E-MAIL

**Identificador:** P40. **Prioridade:** P1.

**Objetivo:** API de recuperação de senha por e-mail no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF05, RS02, RS03, RS04. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Link sem ação; não existe token/contato de recuperação (E19).

**Arquivos relacionados:** server/index.js:423; server/sql/; server/package.json; login/login.html:21 (integração posterior P41). Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P01, P06, P04; D11: contato de recuperação e transporte.

**Instruções de implementação:**

Implemente solicitação e redefinição com token aleatório, armazenado de forma segura, expiração e uso único. Resposta de solicitação não deve revelar existência da conta. Envie instruções ao e-mail aprovado por transporte configurável e testável; não registre token/senha em logs. Redefina hash, invalide token e sessões conforme política documentada; limite abuso. Não envie e-mails reais nos testes.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Token válido permite definir nova senha.
- vencido/reutilizado não.
- solicitação retorna resposta uniforme e transporte falso recebe instrução correta.

**Testes necessários:**

Positivo: solicitação e redefinição em ambiente de teste. Negativo: conta desconhecida, token inválido/vencido/reusado, senha inválida e tentativas excessivas. Regressão: login/hash e sessão.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 41 — INTERFACE DE SOLICITAÇÃO E REDEFINIÇÃO DE SENHA

**Identificador:** P41. **Prioridade:** P1.

**Objetivo:** Interface de solicitação e redefinição de senha no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF05, RNF03. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Esqueceu sua senha é link inativo; backend ainda precisa ser criado em P40.

**Arquivos relacionados:** login/login.html:21; login/login.js; login/login.css; API de recuperação P40. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P40 e P14.

**Instruções de implementação:**

Conecte link a solicitação de recuperação e ofereça tela/formulário de redefinição com token recebido. Mostre mensagem uniforme de instruções encaminhadas sem confirmar se a conta existe; valide campos e trate token vencido/reutilizado. Nunca coloque token em logs/analytics nem persista senha no localStorage. Reuse visual de login.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Usuário solicita instruções, abre link de teste e define senha válida.
- erros orientam sem expor existência de conta.

**Testes necessários:**

Positivo: fluxo completo com transporte falso. Negativo: e-mail inválido, token ausente/vencido, senha inválida e API fora. Regressão: login/visitante e teclado.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 42 — REDUZIR CONSULTAS E CARGA DA LISTAGEM DE PROJETOS

**Identificador:** P42. **Prioridade:** P2.

**Objetivo:** Reduzir consultas e carga da listagem de projetos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RF16, RNF06, RNF07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Listagem faz ao menos 1+2N consultas e concatena membros na descricao (E18).

**Arquivos relacionados:** server/index.js:307, :328, :341, :689; mainPage/cadastro.js:368, :535. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P07 e P05; P14 para erros no frontend.

**Instruções de implementação:**

Busque projetos e membros de modo agrupado, já filtrados pelo usuário. Preserve descricao original e use campos próprios para resumos de membros. Evite consultas individuais por projeto e cargas repetidas; mantenha contrato ou ajuste frontend de forma compatível. Meça quantidade de consultas e tempo com fixture controlada; não prometa ganho percentual sem medição.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Aumentar N não gera duas consultas extras por item.
- lista contém só recursos autorizados.
- descrição persistida continua idêntica.

**Testes necessários:**

Positivo: vários projetos/membros e projeto sem membros legados. Negativo: acesso alheio e falha de consulta. Regressão: lista, edição, filtros e detalhe; comparar consulta/tempo antes/depois.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 43 — DISPONIBILIZAR VERIFICAÇÕES REPRODUZÍVEIS DE SEGURANÇA E PERSISTÊNCIA

**Identificador:** P43. **Prioridade:** P2.

**Objetivo:** Disponibilizar verificações reproduzíveis de segurança e persistência no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF08, RNF09, RS01, RS04, RS05, RS06, RS07. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** npm test é placeholder; auditoria executou ensaios efêmeros com mocks, sem MySQL real (E21).

**Arquivos relacionados:** server/package.json:6; server/index.js ou módulos extraídos; testes novos no projeto. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P02 e P04; ampliar casos conforme P07/P08/P09/P05 forem concluídos.

**Instruções de implementação:**

Substitua placeholder por testes de contratos críticos: autenticação, papéis, vínculo acadêmico, autoria e download. Use doubles para negações antes de SQL e banco descartável separado para transações, FKs e migrações. Nunca execute bootstrap/migração contra banco de desenvolvimento real por padrão. Documente comandos, fixtures e limitações; não converta teste com mock em alegação de E2E.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Comando documentado retorna zero para suíte válida e falha quando uma proteção é removida.
- banco real não é tocado.
- fixtures isoladas verificam persistência.

**Testes necessários:**

Positivo: execução limpa em ambiente descartável. Negativo: regressão intencional de autorização detectada e configuração que tenta usar banco real rejeitada. Regressão: sintaxe dos três scripts.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 44 — VERIFICAR E CORRIGIR INTERFACE EM DISPOSITIVOS E NAVEGADORES

**Identificador:** P44. **Prioridade:** P2.

**Objetivo:** Verificar e corrigir interface em dispositivos e navegadores no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF01, RNF04, RNF05, RNF06, RNF11, RC01, RC02, RC03, RC04, RC05. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** Há CSS responsivo; uso em Android/iOS/navegadores não foi validado; hover/rodapé/teclado trazem riscos (E20).

**Arquivos relacionados:** login/login.html; login/login.css; mainPage/menuCadastro.html; mainPage/menu.css:693, :740, :843, :921; mainPage/cadastro.js:961. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P03, P13, P12, P14; D12 define critérios; use banco de homologação.

**Instruções de implementação:**

Execute matriz acordada de dispositivos/resoluções, toque, teclado e browsers; comece com login, pessoas, projetos e upload. Registre baseline de latência e passos de tarefas, sem declarar RNF aprovado sem meta definida. Corrija apenas defeitos observados: overflow, ação invisível em toque/foco, rótulo e navegação. Garanta foco visível e controles operáveis; não redesenhe o produto por preferência.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Operações confirmadas funcionam na matriz registrada, sem recortes/ações inacessíveis.
- evidências distinguem dispositivo real de emulação e metas pendentes.

**Testes necessários:**

Positivo: tarefas ponta a ponta em resoluções escolhidas. Negativo: texto longo, erro de rede, teclado móvel e orientação. Regressão: desktop, sidebar/overlay e formulários.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 45 — SEPARAR MÓDULOS DO BACKEND PRESERVANDO CONTRATOS

**Identificador:** P45. **Prioridade:** P2.

**Objetivo:** Separar módulos do backend preservando contratos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF08, RNF09. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** index.js mistura bootstrap, DDL, sessão, rotas, SQL e arquivos (E23).

**Arquivos relacionados:** server/index.js; server/package.json; novos módulos dentro de server/. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P43: testes reproduzíveis; principais correções de segurança concluídas.

**Instruções de implementação:**

Extraia incrementalmente configuração, conexão, autenticação/autorização e rotas/serviços de pessoas/projetos/documentos para módulos coerentes. Reuse funções atuais; não troque framework/banco nem crie camada vazia por formalidade. Documente entrada e responsabilidades. Preserve contratos já corrigidos e rode testes em cada extração.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Servidor inicializa com mesmos contratos autorizados.
- dependências ficam explícitas.
- nenhuma regra desaparece na extração.

**Testes necessários:**

Positivo: smoke de rotas existentes. Negativo: sessão ausente, perfil negado e falha SQL. Regressão: suíte de segurança/persistência antes/depois.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.

## PROMPT 46 — SEPARAR MÓDULOS DO FRONTEND PRESERVANDO FLUXOS

**Identificador:** P46. **Prioridade:** P2.

**Objetivo:** Separar módulos do frontend preservando fluxos no sistema LABHIST. Implemente somente o comportamento descrito abaixo, após conferir o código atual do projeto em `C:\Users\deivi\OneDrive\Documentos\LABHIST`.

**Requisitos atendidos:** RNF08, RNF09. Esta tarefa contribui para esses requisitos; não declare um requisito inteiro concluído se depender de outra camada/decisão.

**Situação atual:** cadastro.js concentra navegação, API, pessoas, projetos, identidade e documentos.

**Arquivos relacionados:** mainPage/cadastro.js; mainPage/menuCadastro.html:369; login/login.js; módulos frontend novos. Se um arquivo tiver sido modularizado desde a auditoria, encontre seu equivalente antes de alterar.

**Dependências / condições para iniciar:** P13, P14 e P43; P44 para regressão de interface.

**Instruções de implementação:**

Extraia cliente de API/sessão, navegação, pessoas, projetos/subprojetos e documentos em módulos coerentes, mantendo carregamento compatível com HTML atual. Evite globals desnecessárias e preserve handlers/IDs usados até migrá-los explicitamente. Não introduza framework nem mude visual/contratos nesta tarefa. Documente dependências e ponto de entrada.

**Cuidados:**

- Não quebrar funcionalidades existentes; preservar contratos autorizados e dados legados.
- Reutilizar a arquitetura atual, sem duplicar código desnecessariamente ou alterar tecnologias sem necessidade.
- Não criar funcionalidades fora do escopo; não implementar editais removidos, conteúdos indefinidos nem decisões pendentes por presunção.
- Preservar integração com o banco; usar migrações explícitas e ambiente descartável para testar. Não apagar/modificar dados reais sem autorização específica.
- Manter autorização no servidor e não expor senhas, tokens ou segredos; registrar apenas evidências sanitizadas.

**Critérios de aceitação:**

- Fluxos confirmados funcionam após extração.
- nenhuma função inline fica indefinida.
- scripts carregam sem dependências circulares ou erros.

**Testes necessários:**

Positivo: login, CRUD, navegação, upload/download e sidebar. Negativo: API indisponível/sessão expirada. Regressão: comportamento/estados e mobile antes/depois.

**Entrega esperada:** Código funcional do objetivo autorizado, resumo dos arquivos alterados, comandos/testes realmente executados e seus resultados, migrações/contratos relevantes e possíveis limitações. Diferencie mock de persistência/navegador reais; registre o que ainda impede concluir os requisitos vinculados.
