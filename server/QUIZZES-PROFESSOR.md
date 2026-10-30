# Cadastro de quizzes pelo professor

O painel do professor possui **Meus quizzes → Criar quiz**. O professor escolhe um projeto em que está vinculado, opcionalmente um subprojeto desse projeto, preenche título/descrição e monta perguntas de escolha única com exatamente uma alternativa correta. A revisão e as validações reutilizam o formulário e o serviço existentes.

O quiz é criado como **rascunho no catálogo**, com autoria definida pelo servidor a partir da conta e da pessoa acadêmica autenticadas. A extensão019 gera automaticamente um PIN ativo para responder por convite, sem esperar publicação no catálogo; veja [PIN do Quiz](QUIZ-PIN.md). O professor pode listar e consultar a estrutura/gabarito somente dos quizzes que criou e enquanto mantiver vínculo atual com o projeto do quiz. Quizzes antigos sem autoria explícita permanecem sem atribuição; compartilhar um projeto com outro professor não concede acesso ao gabarito dele. A reassociação de uma conta para outra pessoa também não transfere os quizzes.

Publicação no catálogo, mudança de vínculo, edição e exclusão continuam com o administrador. O administrador pode publicar o rascunho para os alunos vinculados ao projeto; o catálogo/atividade do aluno continua omitindo o gabarito. O PIN é um convite separado para alunos/visitantes; o professor pode gerá-lo, renová-lo ou encerrá-lo nos próprios quizzes. As proteções de histórico contra edição/exclusão permanecem. O cadastro administrativo mantém o contrato anterior, inclusive a criação sem projeto até a configuração de publicação.

## Segurança e rotas

- `POST /professor/quizzes`: professor autenticado com identidade atual; corpo do quiz existente mais `projeto_id` obrigatório e `subprojeto_id` opcional/null. Campos de autoria, perfil, publicação e pontuação enviados pelo cliente são recusados. Conta/pessoa e vínculo são confirmados com locks na mesma transação que grava o quiz, as perguntas e as alternativas.
- `GET /professor/quizzes`: somente quizzes da combinação atual de conta/pessoa, com participação atual no projeto.
- `GET /professor/quizzes/:id`: consulta completa do próprio quiz com autorização atual. Quiz de terceiro/legado recebe404; perda de vínculo recebe403. Leituras usam `Cache-Control: no-store`.
- As rotas administrativas `/quizzes` e `/quizzes/:id/disponibilidade` continuam administrativas. O professor não recebe um CRUD geral nem pode editar/excluir/publicar por chamadas diretas.

IDs de conta e pessoa não são confundidos. SQL usa os parâmetros do driver; renderização usa os mesmos elementos/textContent e escape do módulo de quizzes. Respostas atrasadas são invalidadas por sequência e identidade. Falha de envio mantém o conteúdo e as seleções. Reconfirmar a mesma sessão preserva o rascunho do professor; trocar identidade limpa perguntas, gabarito e projetos carregados.

## Migração e ativação

A migração nova **018 — quizzes-professor** adiciona `quiz.autor_conta_id` e `quiz.autor_professor_id`, ambos opcionais para preservar os legados. As novas FKs RESTRICT preservam a autoria contra exclusão/reidentificação em cascata; o CHECK exige ambos preenchidos ou ambos NULL. Versões001–017 não são alteradas. A partida exige esquema018 e verifica essas restrições sem aplicar DDL automaticamente.

Não há dependências novas. Pare o servidor, faça backup do banco e execute em `server`, usando o `.env` local existente:

```powershell
npm.cmd run db:migrate
npm.cmd run db:check
node --env-file=.env index.js
```

Atualize o painel com Ctrl+F5. A implementação e os testes não alteram o banco real, senhas ou `.env`.

## Arquivos e testes

Novos: `server/quizzes-professor.js`, `server/banco/versoes/018-quizzes-professor.js`, `server/test/quizzes-professor-interface.test.js` e este guia.

Integrações: `server/index.js`, `quizzes.js` (exportação do serviço existente de inserção), `banco/esquema.js`, `banco/migracoes.js`, `banco/migrador.js`; `mainPage/menuCadastro.html`, `menu.css`, `modulos/quizzes.js`, `modulos/navegacao.js`, `modulos/sessao.js`; executor/helper de testes, expectativas de permissão no teste de interface anterior e manifesto dinâmico no teste de migração de mensagens; README e guias de módulos/testes.

A suíte nova usa HTTP, MySQL descartável e Chrome: migração17→18 e repetição; legados sem autoria; rascunho e gabarito; contas/pessoas com IDs distintos; projetos/subprojetos; campos forjados; proteção por perfil e autoria; revogação e reassociação; publicação pelo administrador seguida de atividade do aluno sem gabarito; rollback; FKs; interface e seleção; erro com rascunho preservado; celular emulado; limpeza de sessão e respostas atrasadas.

O arquivo integra `npm.cmd --prefix server run test:navegador`. As regressões afetadas cobrem quizzes administrativos, catálogo/atividade/publicação, esquema/migrações, mensagens e sessões. Testes não carregam o `.env` nem usam dados reais.

Validação desta entrega: 100/100 casos em `quizzes.test.js`, `esquema.test.js`, `disponibilidade-quizzes.test.js` e `mensagens.test.js`; 105/105 na execução final de `quizzes-professor-interface.test.js` (18 casos), `quizzes-interface.test.js`, `quizzes-academico-interface.test.js`, `sessao-interface.test.js` e `execucao-testes.test.js`. Total de205 casos distintos dos fluxos afetados, sem ignorados/cancelados; não é uma nova execução da suíte inteira. Logs locais em TEMP: `labhist-quizzes-professor-banco.log` e `labhist-quizzes-professor-final.log`. Sintaxe dos15 JS criados/alterados e `git diff --check` aprovados; as17 migrações anteriores foram conferidas contra HEAD sem diferenças. O banco real permanece sem alteração por esta implementação.
