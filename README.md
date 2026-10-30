# LABHIST

Sistema web para organização de projetos e pesquisas em História, com perfis de administrador, professor e aluno e área pública para visitantes.

## Funcionalidades

- Cadastro de alunos e professores e equipes de projetos.
- Professores criam projetos e adicionam subprojetos/núcleos aos projetos em que participam.
- Projetos, status e subprojetos/núcleos com seleção dos alunos envolvidos.
- Documentos e imagens vinculados aos projetos, com descrição, texto explicativo e download autenticado.
- Quizzes de escolha única, publicação, respostas, resultados e histórico do aluno.
- Professores cadastram quizzes dos seus projetos; a publicação no catálogo é feita pelo administrador.
- Quizzes do professor geram PIN para alunos e visitantes responderem, com correção no servidor e histórico separado para visitantes.
- Acompanhamento de resultados pelo professor, conforme os vínculos atuais do projeto.
- Sessões persistidas e recuperação de senha por e-mail quando o SMTP estiver configurado.
- Mensagens privadas entre professores e alunos com projetos em comum, histórico e confirmação de leitura.

## Tecnologias

HTML, CSS e JavaScript no frontend; Node.js 24+, Express 5 e MySQL 8 no backend. Frontend e API são servidos pela mesma aplicação.

## Executar localmente

Com o MySQL iniciado, crie um banco vazio para uma instalação nova ou utilize uma cópia protegida do banco existente. O banco e suas credenciais não acompanham este repositório.

Na pasta do projeto, pelo PowerShell:

~~~powershell
cd server
npm.cmd ci
Copy-Item .env.example .env
~~~

Se já existir um .env, preserve-o. Edite server/.env e preencha DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME e SESSION_SECRET. Para gerar uma chave de sessão aleatória, execute:

~~~powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

Salve o resultado apenas em SESSION_SECRET no arquivo local. Mantenha NODE_ENV=development para uso local. Depois, ainda em server:

~~~powershell
npm.cmd run db:migrate
npm.cmd run db:check
node --env-file=.env index.js
~~~

Acesse [Login](http://localhost:3000/login/login.html) ou [Área pública](http://localhost:3000/publico/index.html). Mantenha o terminal aberto durante o uso.

O esquema atual é a versão 019. Para atualizar um banco existente, faça backup e pare o servidor antes de aplicar migrações. As versões publicadas são preservadas e não há DDL automático na inicialização.

Não há conta nem senha padrão distribuída. Contas de instalações existentes permanecem no banco local; uma instalação vazia exige provisionamento administrativo explícito. Para contas legadas, veja [autenticação](server/AUTENTICACAO.md) e [identidade acadêmica](server/IDENTIDADE-ACADEMICA.md). O SMTP é opcional para iniciar o sistema, mas é necessário para enviar e-mails de recuperação.

## Testes

~~~powershell
npm.cmd --prefix server --logs-max=0 test
~~~

Os testes usam dados e instâncias descartáveis. A suíte completa exige MySQL Server local, Node 24+ e os navegadores da matriz de homologação (Chrome e Edge no Windows). Detalhes e grupos em [server/TESTES.md](server/TESTES.md). Não carregue o .env da aplicação ao executar os testes.

## Organização

- login/: acesso e recuperação de senha.
- publico/: páginas e consultas públicas.
- mainPage/: painel e módulos de interface.
- server/: API, autenticação, serviços e testes.
- server/banco/versoes/: migrações versionadas.
- docs/auditoria-ers/: requisitos, decisões e histórico de implementação.

Guias: [banco de dados](server/BANCO-DE-DADOS.md), [operação](server/OPERACAO.md), [subprojetos e alunos](server/SUBPROJETOS.md), [módulos do frontend](mainPage/MODULOS.md) e [módulos do backend](server/MODULOS.md).

## Dados locais

Permissões de criação acadêmica e procedimento de uso: [projetos pelo professor](server/CRIACAO-PROFESSOR.md).

Permissões, rotas e ativação do chat: [mensagens privadas](server/MENSAGENS.md).

Cadastro, autoria e ativação dos quizzes acadêmicos: [quizzes pelo professor](server/QUIZZES-PROFESSOR.md).

Participação de alunos/visitantes por código e migração019: [PIN do Quiz](server/QUIZ-PIN.md).

O Git ignora .env, node_modules, uploads, backups, logs e capturas locais de apresentação. O modelo server/.env.example é incluído sem segredos. Os certificados e a chave em server/test/fixtures são exclusivos dos ensaios HTTPS locais e não são credenciais de produção.

## Situação e limites

Os 46 prompts do planejamento original foram concluídos; mudanças posteriores e suas validações estão nos guias correspondentes. A homologação documentada é local, com emulação móvel; não comprova dispositivos físicos ou ambiente de produção. Os alertas de dependências previamente identificados estão em [server/DEPENDENCIAS.md](server/DEPENDENCIAS.md).
