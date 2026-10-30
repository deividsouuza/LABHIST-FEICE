# Verificações reproduzíveis do LabHist — P43

Execute da raiz do repositório, com Node.js 24 ou superior e as dependências já instaladas em server. Os comandos não instalam pacotes nem carregam .env.

```powershell
npm.cmd --prefix server test
npm.cmd --prefix server run test:seguranca
npm.cmd --prefix server run test:banco
npm.cmd --prefix server run test:navegador
```

Em terminais que resolvem npm normalmente, pode usar npm no lugar de npm.cmd. A suíte completa é o comando de referência. Ela executa primeiro segurança/banco com concorrência 2, espera todos os filhos e suas limpezas, depois executa navegador com concorrência 1. Isso separa os ensaios de migração/carga da navegação; as integrações P41 e de quizzes acadêmicos iniciam suas próprias instâncias MySQL descartáveis dentro da fase de navegador, sem outros ensaios de banco concorrentes. Falha em qualquer fase interrompe o comando com código diferente de zero; os relatórios de cada fase devem ser somados, sem contar subtestes canários como casos extras. Os timeouts dos testes não são aumentados. Os três grupos são disjuntos e cobrem todos os arquivos test/*.test.js; testes mistos com MySQL (como respostas-api e transacoes) ficam no grupo banco. A checagem do executor fica no grupo seguranca.

## Isolamento e pré-requisitos

A extensão de criação acadêmica possui regressão HTTP/MySQL/Chrome em `criacao-professor-interface.test.js`, incluída no grupo navegador. Contratos e cobertura em [Criação pelo professor](CRIACAO-PROFESSOR.md).

O chat possui `mensagens.test.js` no grupo banco e `mensagens-interface.test.js` no grupo navegador. A migração017 e os testes não dependem do `.env` real; ver [Mensagens](MENSAGENS.md).

`quizzes-professor-interface.test.js` integra o grupo navegador e usa MySQL/HTTP reais descartáveis, Chrome e a migração018. Contratos e isolamento por autoria/vínculo em [Quizzes pelo professor](QUIZZES-PROFESSOR.md).

O PIN usa `quiz-pin.test.js` (banco) e `quiz-pin-interface.test.js` (navegador), migração019, sem acessar `.env`/banco real. Convite, anonimato, correção e retenção em [PIN do Quiz](QUIZ-PIN.md). Resets dos testes removem as tabelas filhas antes de quizzes/perguntas, preservando FKs ativas.

- test:seguranca: HTTP Express real com sessões fictícias e doubles SQL, validações, configuração, conteúdo de uploads e arquivos temporários. Não requer serviço MySQL nem navegador.
- test:banco: executável local do MySQL Server; cria instâncias próprias em diretórios temporários, banco fixture_p01, portas efêmeras, sem my.ini (--no-defaults), sem serviço/dados/credenciais da aplicação. Inclui testes mistos com doubles. Não conecta ao banco de desenvolvimento.
- test:navegador: Chrome/Edge e MySQL locais; perfil temporário próprio, sem perfil/clipboard pessoal. Os testes anteriores usam API/DB controlados. P41 acrescenta nove casos com navegador/HTTP/MySQL reais e SMTP fictício, incluindo o fluxo completo de recuperação e login; essa integração local comprova esse percurso, sem SMTP de produção. A suíte quizzes-academico-interface acrescenta Chrome/HTTP/MySQL reais para configuração, catálogo e respostas/resultados; simula apenas as falhas de rede especificadas.
- npm test exige ambos MySQL e navegador. Pré-requisito ausente faz o executor falhar antes da suíte; execução direta de arquivos pode ignorar suítes com skip e não prova validação completa.

Caminhos padrão Windows: C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe e Chrome/Edge em Program Files. Somente MYSQLD_BIN e CHROME_BIN permitem escolher os executáveis. Não aceitamos host, porta, usuário, senha ou URL de banco externo. Para outra plataforma, forneça caminhos dos executáveis locais compatíveis; isso não equivale a homologação nessa plataforma.

O executor recusa variáveis DB_*, MYSQL_*, DATABASE_URL, SMTP_*, RECOVERY_*, LABHIST_TEST_DB*, SESSION_SECRET e NODE_OPTIONS preenchidas, sem imprimir valores. Não o execute com --env-file, preloads ou configurações de aplicação. Use um terminal dedicado sem essas variáveis; não altere o .env do projeto para testar. As fixtures também isolam o bootstrap em VM, substituem configuração por valores fictícios e recusam a conexão automática de produção. Imports reais de serviços, transações e migrações são exercitados com suas dependências explícitas.

Todo diretório removido pelos helpers é criado pela própria fixture e validado por caminho absoluto, pai temporário e prefixo antes da limpeza. MySQL termina por SHUTDOWN ou encerramento apenas do filho criado pelo helper; janelas de processos auxiliares ficam ocultas. Não limpar resíduos antigos manualmente como parte da suíte. Falha de hook/limpeza também torna o processo inválido, mesmo se o contador de casos tiver pass=total.

## Contratos protegidos

Autenticação por senha, papéis antes do SQL, identidade da sessão, vínculos acadêmicos, autoria confirmada do envio, legado ambíguo invisível ao aluno, downloads autorizados/confinados, integridade por FK, rollback/commit, migrações explícitas, uploads e fila de limpeza, projetos/subprojetos/quizzes administrativos e contrato público mínimo. Nenhum teste atribui autor a dados históricos por dedução. P09 agora cobre conta autora por FK e snapshots, preservação após alterações cadastrais e legados pendentes sem dedução; P37 cobre texto separado. P03 valida CORS/HTTPS/sessões persistentes e P40 tokens, contatos e revogação. Isso não conclui requisitos inteiros dependentes de outras decisões.

execucao-testes.test.js valida a recusa de configuração real e executa duas vezes o mesmo contrato de autorização em processo filho: original deve sair 0; cópia VM com requireAdmin desativado deve sair 1 (a operação proibida retorna 200 em vez de 403). O teste principal exige essa falha e verifica que os hashes de server/index.js e server/autenticacao.js permaneceram iguais. Não há mutação de arquivo ou banco da aplicação. A fixture canário não entra na seleção normal test/*.test.js e só é executada por esse teste negativo.

Saída 0 significa casos e hooks selecionados aprovados; saída diferente de zero indica falha de pré-requisito/configuração, asserção, execução ou limpeza. Não apresente testes ignorados como aprovados. Avisos experimentais de VM e depreciação do router na fixture podem aparecer; não substituem o código de saída.

Checagem rápida de sintaxe, da raiz:

```powershell
node --check server/index.js
node --check mainPage/cadastro.js
node --check login/login.js
node --check publico/publico.js
node --check login/recuperacao.js
node --check server/scripts/testes.js
```

Limitações: sem homologação física D12, matriz P44, serviços de produção, SMTP real, implantação ou banco real. SMTP/configuração do projeto são sempre isolados; o executor recusa variáveis SMTP/recuperação externas. Quizzes acadêmicos/publicação/pontuação continuam condicionados. Evidências e resultados de cada execução em docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md.

P45: o loader VM também carrega autenticacao.js, pessoas.js, pessoas-dados.js, projetos.js e documentos.js com os mesmos doubles explícitos de I/O. O teste canário altera somente a cópia de autenticacao.js em memória. Responsabilidades e injeção de dependências em MODULOS.md.

Quizzes acadêmicos (19/10/2026): catálogo, disponibilidade, correção e resultados têm suites próprias; testes de esquema incluem migrações014/015. A integração Chrome inclui clique duplo, Enter, erros SQL/rede, confirmação perdida, consulta/reenvio, sessão expirada, navegação concorrente, pontuação zero e texto longo/HTML literal. Emulação móvel é distinta de dispositivo físico. Todas as fixtures têm banco/arquivos próprios; histórico de respostas/resultados é removido antes dos pais somente nos bancos descartáveis.

P38/P39: historico-quizzes.test.js usa HTTP/MySQL reais descartáveis, contas com IDs diferentes das pessoas, isolamento e revogação dos vínculos. Quizzes acadêmicos incluem histórico/acompanhamento no Chrome. P44/P46: homologacao-interface.test.js exige as duas instalações Chrome e Edge do Windows (falha se ausentes), verifica a matriz local aprovada, toque/teclado/rotação, handlers inline,100projetos/100alunos/20quizzes e upload1MiB com I/O descartável. Exporta medições sanitizadas ao TEMP/labhist-p44-evidencias.json; baseline aprovado em docs/auditoria-ers/10-HOMOLOGACAO-LOCAL.md/json. Não é teste de aparelho físico/produção. Entradas/módulos do painel em mainPage/MODULOS.md.

Extensão20/10/2026 — alunos por núcleo: nucleos-interface.test.js (grupo navegador, exige MySQL/Chrome locais) exercita20 casos com instâncias/arquivos descartáveis; nunca usa .env/banco real. Migração016 e roteiro de ativação em SUBPROJETOS.md. A limpeza de fixtures inclui subprojeto_aluno antes dos pais, sem desligar FKs. Reset de sessão e troca de conta removem os nomes da equipe da interface. Confirmações e limites da regressão por grupos estão no mesmo guia.
