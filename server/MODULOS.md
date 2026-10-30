# Módulos do backend

Entrada: index.js (Node.js ES modules). Mantém a inicialização autorizada: configuração validada, middleware de origem/JSON/sessão, pastas públicas enumeradas, rotas, fallback JSON, conexão com verificação de esquema e listen. Conexão falha fecha pool e encerra com código de erro. Nenhuma migração automática no startup. Comandos de operação/migração em OPERACAO.md e BANCO-DE-DADOS.md.

| Módulo | Responsabilidade / entrada |
|---|---|
| configuracao.js; operacao.js | Configuração, origem/CORS/proxy/cookies e store de sessão. |
| banco/conexao.js; banco/transacao.js | Pool validado e transações dedicadas, sem replay. |
| autenticacao.js | criarAutorizacao fornece guards; registrarAutenticacao monta login/logout/sessão, contas e vínculo administrativo. Recebe obterPool e operacao. Mantém hash, rate limit, regeneração e invalidação de identidade. |
| pessoas-dados.js | Validação POST/PUT e mapeamento de pessoas, normalização de cursos/turmas legados. Sem I/O. |
| pessoas.js | registrarPessoas monta CRUD e leitura individual autorizada; credenciais opcionais são transacionais. Recebe obterPool e guards. |
| projetos.js | registrarProjetos monta consultas pública/privada, equipes agrupadas, criação/edição/exclusão transacionais. Recebe obterPool, guards e concluirLimpeza. |
| documentos.js | criarDocumentos configura upload privado e retorna registrar(app) e concluirLimpeza(ids). Recebe obterPool, diretorioServidor e guards. Rotas de autoria pendente, lista/download/envio/exclusão e fila de limpeza. |
| acesso-academico.js; identidades.js | Regras compartilhadas de vínculo/identidade atual; normalização de perfil. |
| upload-documentos.js; arquivos-documentos.js; limpeza-arquivos.js | Limites/conteúdo/staging, abertura confinada e limpeza durável pós-commit. |
| subprojetos.js; quizzes.js; recuperacao.js | Registradores de domínios já extraídos; preservam os contratos anteriores. |
| mensagens.js; banco/mensagens-esquema.js | Chat privado por vínculo acadêmico atual, envio/leitura transacionais, paginação/idempotência e verificação da migração017. Contratos em MENSAGENS.md. |
| quizzes-professor.js | Cadastro de rascunhos e consulta dos próprios quizzes por professor vinculado, com autoria018. Reutiliza validação/inserção/carregamento de quizzes.js, sem abrir o CRUD administrativo. |
| quiz-pin.js; banco/pin-esquema.js | Convites por PIN, participação autenticada/anônima, correção compartilhada, gestão por autor e verificação019. Contratos e ciclo de acesso em QUIZ-PIN.md. |

Os registradores recebem obterPool, função que consulta o pool atual quando a requisição chega. Não capturam um pool nulo antes da conexão nem abrem conexões próprias. Express, validações, SQL, códigos de resposta e ordem dos guards foram preservados; requireAuth e requireAdmin precedem validação/SQL das operações administrativas. Serviços importados mantêm transações e autorização no servidor. Documentos não importam projetos: a conclusão da limpeza é passada pelo bootstrap, evitando dependência circular. Não foi acrescentada versão de esquema em P45.

## Verificação

Os testes existentes exercitam os handlers reais em HTTP com sessão real; conforme a suíte, MySQL/arquivos são descartáveis reais ou doubles explícitos. O helper test/helpers/aplicacao.js carrega os módulos extraídos na mesma VM isolada, conserva substituições de banco, SMTP e filesystem e proíbe imports desconhecidos. Não há flags de teste no código do produto. O canário P43 modifica somente a cópia de autenticacao.js em memória e confere que os arquivos originais permanecem idênticos.

Regressão: npm.cmd --prefix server --logs-max=0 test. Baseline antes de P45: 1187/1187, documentado em auditoria-ers/08. Resultados por extração e regressão final ficam no mesmo controle. Esse teste não representa implantação, SMTP real ou homologação em dispositivos físicos.

Evolução posterior a P45, autorizada no mesmo lote: disponibilidade-quizzes.js fornece configuração administrativa/serviço de disponibilidade; catalogo-quizzes.js fornece projeções públicas e do aluno; correcao-quizzes.js é cálculo puro conforme D08; resultados-quizzes.js monta atividade sem gabarito e submissão transacional. Dependências são explícitas pelos mesmos guards/getter de pool. Esquema015 em migrações novas, sem alterar001–013 publicadas.
