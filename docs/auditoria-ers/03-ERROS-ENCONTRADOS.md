# Erros e riscos encontrados

Data: 15/10/2026. Leia junto da matriz e do relatório. Gravidade indica impacto potencial, não prova de exploração em ambiente real. “Comprovado por código” significa caminho e causa observáveis na fonte; “ensaio isolado” usa Express real e SQL simulado. Nenhum ensaio desta auditoria alterou banco ou gravou upload.

## Resumo

| ID | Gravidade | Natureza | Problema | Prompts |
|---|---|---|---|---|
| E01 | Crítica | COMPROVADO EM ENSAIO ISOLADO | Identidade de aluno/professor sem senha | P01, P06, P13 |
| E02 | Crítica | COMPROVADO EM ENSAIO ISOLADO | Escalada e operações administrativas por aluno | P02 |
| E03 | Crítica | COMPROVADO POR CÓDIGO | Senhas em texto puro e segredos fixos | P01 |
| E04 | Alta | COMPROVADO EM ENSAIO ISOLADO | Ausência de autorização por projeto e exposição de dados pessoais | P07 |
| E05 | Alta | COMPROVADO POR CÓDIGO | Arquivos acessíveis sem sessão por URL | P08 |
| E06 | Alta | COMPROVADO EM ENSAIO ISOLADO / CÓDIGO | Autoria com colisão de IDs e perfil incorreto | P09 |
| E07 | Alta | COMPROVADO EM ENSAIO ISOLADO | Cadastro/edição de pessoas ignora requisitos de validação | P11, P12 |
| E08 | Alta | RISCO TÉCNICO FUNDAMENTADO | Transações simultâneas compartilham conexão | P05 |
| E09 | Alta | COMPROVADO POR CÓDIGO; BANCO REAL NÃO VERIFICADO | Integridade das associações sem FKs/validação de existência | P10, P15 |
| E10 | Alta | COMPROVADO POR CÓDIGO; ESTADO INSTALADO NÃO VERIFICADO | Inicialização não garante o schema de documentos | P04, P09 |
| E11 | Alta | RISCO TÉCNICO FUNDAMENTADO | Upload sem limites de tamanho ou verificação de conteúdo | P16 |
| E12 | Média | COMPROVADO POR CÓDIGO / ENSAIO ISOLADO | Sessões e CORS inadequados para implantação | P01, P03 |
| E13 | Alta | COMPROVADO POR CÓDIGO | API aponta para localhost em ambos os frontends | P03 |
| E14 | Média | COMPROVADO POR CÓDIGO / ENSAIO ISOLADO | Leituras tratam objetos de erro como dados | P14 |
| E15 | Média | COMPROVADO EM ENSAIO ISOLADO / CÓDIGO | Sucesso em atualização/exclusão inexistente e erros HTTP genéricos | P15 |
| E16 | Média | COMPROVADO POR CÓDIGO | Arquivos ficam órfãos ao excluir projeto | P17 |
| E17 | Média | COMPROVADO POR CÓDIGO | Status do projeto e detalhes para participantes ausentes | P18, P19 |
| E18 | Média | COMPROVADO POR CÓDIGO | N+1, carga global e mistura de descrição com membros | P07, P42 |
| E19 | Média | COMPROVADO POR CÓDIGO | Links de recuperação/visitante e seleção de perfil incompletos | P13, P40, P33 |
| E20 | Média | DEPENDE DE TESTE MANUAL / RISCO DE LAYOUT | Ações em toque e navegação por teclado frágeis | P44 |
| E21 | Média | COMPROVADO EM EXECUÇÃO | Projeto sem suíte de testes/lint/build configurada | P02, P04, P44 |
| E22 | Baixa | COMPROVADO POR CÓDIGO | Rótulo e valor do curso divergentes da ERS | P11, P12 |
| E23 | Média | RISCO TÉCNICO FUNDAMENTADO | Inicialização altera schema e não recupera conexão | P04, P05 |

## E01 — Identidade de aluno/professor sem senha

- **Gravidade:** Crítica.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO.
- **Arquivo / localização / função:** server/index.js:471 /pessoas e :498 /sessao/pessoa; mainPage/cadastro.js:463.
- **Causa e evidência:** Consultar pessoas e selecionar um ID cria sessão sem prova de identidade. T02/T03 retornaram 200 com fixture.
- **Recomendação:** Exigir credencial real e vincular conta à pessoa; desativar seleção pública como autenticação.
- **Encaminhamento:** P01, P06, P13.

## E02 — Escalada e operações administrativas por aluno

- **Gravidade:** Crítica.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO.
- **Arquivo / localização / função:** server/index.js:390 /cadastro, :593/:625 /usuarios, :656 /cadastro-dashboard, :710/:755/:781 /projetos.
- **Causa e evidência:** Há requireAuth, sem requireAdmin. T04 corrigido criou conta com perfil administrador; T06 excluiu professor. O primeiro T04 deu 409 por fixture excessivamente ampla; o ensaio foi corrigido e repetido com consulta vazia.
- **Recomendação:** Aplicar autorização central por operação e lista fechada de perfis; testar negações antes de executar SQL.
- **Encaminhamento:** P02.

## E03 — Senhas em texto puro e segredos fixos

- **Gravidade:** Crítica.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** server/index.js:24 configuração de sessão, :125 ensureAdminPadrao, :163 connectDB, :411 INSERT usuarios e :445 login.
- **Causa e evidência:** Senhas são inseridas diretamente e comparadas por igualdade. Bootstrap cria credencial previsível; conexão e sessão têm configurações sensíveis fixas.
- **Recomendação:** Usar hash adaptativo com salt, migrar legados sem reproduzir segredos; configurar ambiente e bootstrap explícito fora da inicialização normal.
- **Encaminhamento:** P01.

## E04 — Ausência de autorização por projeto e exposição de dados pessoais

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO.
- **Arquivo / localização / função:** server/index.js:531 GET /usuarios, :689 GET /projetos, :736 detalhe, :827 e :860 documentos; mainPage/cadastro.js:535.
- **Causa e evidência:** Filtro de projeto ocorre depois que o navegador recebeu tudo. T07 retornou projeto não relacionado; consultas incluem e-mail, telefone e matrícula dos membros. Professor não precisa acompanhar o projeto para ler documentos.
- **Recomendação:** Filtrar por identidade e vínculo no servidor, minimizar dados e revalidar autorização em cada recurso.
- **Encaminhamento:** P07.

## E05 — Arquivos acessíveis sem sessão por URL

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** server/index.js:46 express.static('/uploads'); mainPage/cadastro.js:689 link de download.
- **Causa e evidência:** Middleware de arquivos está antes das rotas e não usa requireAuth; UUID dificulta adivinhação, mas não autoriza acesso.
- **Recomendação:** Remover publicação estática da pasta e fornecer download por ID após autenticação e autorização.
- **Encaminhamento:** P08.

## E06 — Autoria com colisão de IDs e perfil incorreto

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO / CÓDIGO.
- **Arquivo / localização / função:** server/index.js:849 SELECT documentos, :870 enviado_por_perfil; server/sql/documentos_remover_fk_enviado_por.sql:1.
- **Causa e evidência:** SELECT do aluno filtra só enviado_por, sem perfil. T08 confirmou SQL sem discriminador e retorno da fixture de professor com mesmo ID. No POST, todo perfil exceto professor vira aluno; conta administrativa pode ser atribuída a aluno de mesmo ID.
- **Recomendação:** Migrar autoria para referência única e manter origem legada auditável; não inventar correspondência de pessoas.
- **Encaminhamento:** P09.

## E07 — Cadastro/edição de pessoas ignora requisitos de validação

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO.
- **Arquivo / localização / função:** server/index.js:603 PUT e :663 POST; mainPage/cadastro.js:765 e :796; mainPage/menuCadastro.html:269.
- **Causa e evidência:** POST aceita aluno só com nome; PUT aceita nome vazio. type=email fica fora de um form submetido/validação explícita e não protege fetch. Matrícula, curso, turma e telefone não são exigidos.
- **Recomendação:** Validar contrato no servidor e campos na interface; máscara e enumeração coerentes com ERS.
- **Encaminhamento:** P11, P12.

## E08 — Transações simultâneas compartilham conexão

- **Gravidade:** Alta.
- **Classificação:** RISCO TÉCNICO FUNDAMENTADO.
- **Arquivo / localização / função:** server/index.js:48 connection; :164 mysql.createConnection; :636, :717, :762 e :785 transações.
- **Causa e evidência:** Uma única conexão global atende todas as requisições. Operações assíncronas podem intercalar comandos de transações diferentes. Não houve teste concorrente em MySQL real.
- **Recomendação:** Reservar conexão de pool por transação, fazer rollback e liberar em finally; testar concorrência em banco descartável.
- **Encaminhamento:** P05.

## E09 — Integridade das associações sem FKs/validação de existência

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO POR CÓDIGO; BANCO REAL NÃO VERIFICADO.
- **Arquivo / localização / função:** server/index.js:221/:231 DDL vínculos, :257 normalizeIds, :364 validarProjetoPayload e :755 PUT.
- **Causa e evidência:** UNIQUE impede par duplicado, mas não referência inexistente. normalizeIds descarta inválidos silenciosamente. UPDATE de projeto inexistente pode ser seguido de INSERT de vínculos órfãos.
- **Recomendação:** Validar IDs/existência e adicionar FKs após diagnóstico de legados; não apagar dados automaticamente.
- **Encaminhamento:** P10, P15.

## E10 — Inicialização não garante o schema de documentos

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO POR CÓDIGO; ESTADO INSTALADO NÃO VERIFICADO.
- **Arquivo / localização / função:** server/index.js:171–252 connectDB; server/sql/documentos.sql; demais duas migrações.
- **Causa e evidência:** connectDB cria seis tabelas, mas documentos depende de scripts externos. Aplicar somente documentos.sql mantém FK de autor incompatível e não cria enviado_por_perfil usado pela API. ensureColumn ignora toda exceção.
- **Recomendação:** Registrar sequência/versionamento das migrações e falhar com diagnóstico seguro; validar instalação vazia e atualização.
- **Encaminhamento:** P04, P09.

## E11 — Upload sem limites de tamanho ou verificação de conteúdo

- **Gravidade:** Alta.
- **Classificação:** RISCO TÉCNICO FUNDAMENTADO.
- **Arquivo / localização / função:** server/index.js:58 filtroExtensaoPermitida; :81 multer; :860 upload antes da validação de vínculo.
- **Causa e evidência:** Só a extensão é verificada; arquivo com conteúdo incompatível pode passar. Sem limits.fileSize/parts/fields; pode ocupar disco antes de validar recurso. Não foi enviado arquivo na auditoria.
- **Recomendação:** Limitar upload e multipart, validar assinatura compatível e autorização antes do armazenamento definitivo; limpar temporários em falha.
- **Encaminhamento:** P16.

## E12 — Sessões e CORS inadequados para implantação

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO / ENSAIO ISOLADO.
- **Arquivo / localização / função:** server/index.js:19 cors; :26 session; :449 e :523 criação de identidade.
- **Causa e evidência:** CORS reflete qualquer origem com credenciais (T11). Sem store persistente, regenerate ou expiração explícita; secure=false. A exploração cross-site também depende de SameSite/site/origem e não foi demonstrada. Login distingue usuário inexistente e senha incorreta, sem limitação de tentativas.
- **Recomendação:** Lista de origens permitidas; opções por ambiente; regenerar sessão e expirar; resposta uniforme e proteção contra tentativas repetidas. Avaliar CSRF conforme implantação.
- **Encaminhamento:** P01, P03.

## E13 — API aponta para localhost em ambos os frontends

- **Gravidade:** Alta.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** login/login.js:1; mainPage/cadastro.js:1.
- **Causa e evidência:** Em celular, localhost representa o próprio dispositivo. Em hospedagem HTTPS há conflito com API HTTP fixa; sessão cross-origin também depende de cookie/origem.
- **Recomendação:** Usar mesma origem por padrão ou configuração pública por ambiente sem segredos; validar cookies e HTTPS.
- **Encaminhamento:** P03.

## E14 — Leituras tratam objetos de erro como dados

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO / ENSAIO ISOLADO.
- **Arquivo / localização / função:** mainPage/cadastro.js:89 showForm; :449 carregarPessoasPorPerfil; :551 carregarMeusProjetos; :731 editUser; :855 editProjeto.
- **Causa e evidência:** Falta res.ok e validação de shape. Em 404/500, editUser/editProjeto podem abrir formulário vazio e fixar currentEditId; listagens tentam filter/forEach em objeto. apiFetch redireciona em 401 e continua retornando a resposta.
- **Recomendação:** Centralizar leitura JSON e erro tipado; interromper em 401; só atualizar estado após sucesso.
- **Encaminhamento:** P14.

## E15 — Sucesso em atualização/exclusão inexistente e erros HTTP genéricos

- **Gravidade:** Média.
- **Classificação:** COMPROVADO EM ENSAIO ISOLADO / CÓDIGO.
- **Arquivo / localização / função:** server/index.js:618, :648, :773, :791 e :925.
- **Causa e evidência:** Não verifica affectedRows/existência. T12 corrigido retornou 200 com DELETE simulado afetando zero linhas. Handler global transforma todo erro em 400 e pode revelar err.message técnico.
- **Recomendação:** 404 para ausência e status apropriados para validação, conflito e falha interna; mensagens públicas seguras e logs técnicos.
- **Encaminhamento:** P15.

## E16 — Arquivos ficam órfãos ao excluir projeto

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** server/index.js:781 DELETE /projetos; server/sql/documentos.sql:15; server/index.js:804 removerArquivoSeExistir.
- **Causa e evidência:** DELETE projeto depende de cascata que remove linhas de documentos, mas não os bytes em disco. unlink ignora falhas; caminhos de banco são usados sem confinamento explícito ao diretório.
- **Recomendação:** Limpeza coordenada e recuperável dos arquivos autorizados, com confinamento de caminho e registro de falhas; preservar consistência em rollback.
- **Encaminhamento:** P17.

## E17 — Status do projeto e detalhes para participantes ausentes

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** server/index.js:208 DDL projeto; :347 carregarProjetoCompleto; mainPage/cadastro.js:592 abrirDetalheProjeto; mainPage/menuCadastro.html:114.
- **Causa e evidência:** Não há status; datas existem no DDL, mas não no contrato. Detalhe do participante só mostra título e documentos, sem objetivo/descrição.
- **Recomendação:** Adicionar status previsto e exibir dados confirmados; manter período aguardando D05.
- **Encaminhamento:** P18, P19.

## E18 — N+1, carga global e mistura de descrição com membros

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** server/index.js:341 carregarProjetoCompleto; :696 Promise.all; :700 alteração de descricao.
- **Causa e evidência:** Para N projetos são executadas ao menos 1+2N consultas; fallback pode ampliar. Todos os vínculos são carregados e descricao da lista é reescrita. Não foi medido impacto em latência.
- **Recomendação:** Consulta agrupada/joins sem alterar descrição original; aplicar filtro no SQL e medir antes/depois.
- **Encaminhamento:** P07, P42.

## E19 — Links de recuperação/visitante e seleção de perfil incompletos

- **Gravidade:** Média.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** login/login.html:21 e :25; login/login.js:3.
- **Causa e evidência:** Ambos links usam #; não existe seletor de perfil no HTML apesar de CSS de radio group. Menus de módulos ausentes não são botões quebrados: são funcionalidades ainda não criadas.
- **Recomendação:** Implementar fluxos confirmados de recuperação e visitante; perfil visual deve ser coerente com a identidade real.
- **Encaminhamento:** P13, P40, P33.

## E20 — Ações em toque e navegação por teclado frágeis

- **Gravidade:** Média.
- **Classificação:** DEPENDE DE TESTE MANUAL / RISCO DE LAYOUT.
- **Arquivo / localização / função:** mainPage/menu.css:693 radio-option, :709 radios ocultos, :843 ação com opacity:0, :740 panel-foot; mainPage/menuCadastro.html:29 e :45.
- **Causa e evidência:** Ações aparecem só em hover; rádio display:none e divs clicáveis dificultam teclado; footer sem wrap pode ultrapassar painel estreito. Não houve navegador para confirmar o comportamento em dispositivo.
- **Recomendação:** Verificar foco, rótulos, toque e largura mínima; corrigir problemas demonstrados com evidência visual.
- **Encaminhamento:** P44.

## E21 — Projeto sem suíte de testes/lint/build configurada

- **Gravidade:** Média.
- **Classificação:** COMPROVADO EM EXECUÇÃO.
- **Arquivo / localização / função:** server/package.json:6.
- **Causa e evidência:** npm test é placeholder que termina com código 1; nenhum script de lint/build. JS passa node --check. Ausência de teste não significa ausência de funcionalidades.
- **Recomendação:** Criar testes dos contratos de segurança e persistência em ambiente isolado, como parte das correções; oferecer comando verificável.
- **Encaminhamento:** P02, P04, P44.

## E22 — Rótulo e valor do curso divergentes da ERS

- **Gravidade:** Baixa.
- **Classificação:** COMPROVADO POR CÓDIGO.
- **Arquivo / localização / função:** mainPage/menuCadastro.html:192 e :280; ERS p.6 §4.1.4.
- **Causa e evidência:** Código usa Programação de Jogos Digitais; ERS usa Desenvolvimento de Jogos Digitais. Outros cursos usam valores abreviados. Não há camada de normalização/migração.
- **Recomendação:** Alinhar rótulo da ERS e preservar compatibilidade com valores legados, sem duplicar cursos.
- **Encaminhamento:** P11, P12.

## E23 — Inicialização altera schema e não recupera conexão

- **Gravidade:** Média.
- **Classificação:** RISCO TÉCNICO FUNDAMENTADO.
- **Arquivo / localização / função:** server/index.js:88 ensureColumn; :163 connectDB; :931 main.
- **Causa e evidência:** Bootstrap executa DDL e semeia administrador. Falhas de ALTER são engolidas; perda posterior da conexão não tem estratégia explícita. Processo captura erro de início sem definir exit code de falha.
- **Recomendação:** Separar migrações/startup, falhar de modo observável e usar pool com política de recuperação testada.
- **Encaminhamento:** P04, P05.


## Verificações executadas

| Verificação | Resultado e alcance |
|---|---|
| node --check server/index.js | Passou; valida sintaxe, sem iniciar aplicação ou conexão. |
| node --check mainPage/cadastro.js | Passou; não valida DOM real ou layout. |
| node --check login/login.js | Passou; não valida login real. |
| npm.cmd --prefix server --logs-max=0 test | Falhou com exit 1 porque o script é o placeholder “Error: no test specified”. Não houve suíte de produto executada. |
| npm.cmd --prefix server --logs-max=0 ls --all | Árvore instalada resolvida sem dependência ausente/inválida reportada. Versões diretas: axios 1.15.0, cors 2.8.6, express 5.2.1, express-session 1.19.0, multer 2.2.0, mysql2 3.22.1. Isso não é auditoria de CVEs. |
| IDs de HTML × getElementById literal | Sem ID duplicado e sem referência literal ausente em menuCadastro.html/cadastro.js. IDs dinâmicos foram conferidos por leitura; o teste estático não verifica semântica de componentes. |
| submitAluno em VM com DOM mínimo | Com nome preenchido e os demais campos vazios, houve fetch para cadastro-dashboard com matrícula/curso/turma/e-mail/telefone vazios. A API do ensaio devolveu erro fictício; o dado relevante é que a chamada ocorreu. |

### Ensaios HTTP isolados

Procedimento: ler server/index.js em memória; substituir os imports por dependências locais reais (Express/CORS/session/Multer), neutralizar apenas mkdir e remoção de arquivos, retirar a chamada main() em memória e injetar conexão fictícia. Escutar em 127.0.0.1 numa porta efêmera e encerrar o servidor ao fim. Nenhuma alteração foi salva no código, nenhum MySQL foi aberto e nenhum arquivo foi submetido. IDs/nomes/senhas usados eram fixtures artificiais. As consultas SQL foram inspecionadas para não confundir retorno simulado com uma garantia do banco.

| ID | Pedido / fixture | Resultado observado |
|---|---|---|
| T01 | GET /usuarios sem cookie | 401 não autenticado. |
| T02 | GET /pessoas?perfil=aluno sem cookie; fixture retorna uma pessoa | 200 com id/nome. |
| T03 | POST /sessao/pessoa com perfil aluno e pessoa_id existente, sem senha | 200 e sessão criada. |
| T04 | Sessão de aluno → POST /cadastro com perfil administrador; consulta de nome retorna vazio | 200 e INSERT de conta alcançado. Primeiro ensaio devolveu 409 porque a fixture retornava usuário para qualquer nome; corrigido e repetido. Não foi criada conta em banco real. |
| T05 | Sessão de aluno → POST /cadastro-dashboard com somente nome/perfil aluno | 200 e INSERT com demais campos vazios. |
| T06 | Sessão de aluno → DELETE /usuarios/42?perfil=professor | 200, fluxo de exclusão alcançado. |
| T07 | Sessão de aluno → GET /projetos; fixture de projeto sem vínculo com o aluno | 200 com projeto alheio; SQL não contém filtro de vínculo. |
| T08 | GET /documentos?projeto_id=99 por aluno id 7; fixture de documento de professor id 7 | 200; SQL observado foi SELECT por projeto_id e enviado_por, sem enviado_por_perfil. O retorno da fixture ilustra a colisão; persistência real não testada. |
| T09 | Sessão de aluno → DELETE /documentos/3 | 403; proteção administrativa existe nesta rota. |
| T10 | /login com fixture de conta e senha incorreta | 401 e mensagem Senha incorreta. |
| T11 | Origem https://audit.invalid em GET /pessoas | Access-Control-Allow-Origin refletiu a origem e Allow-Credentials foi true. Não demonstrou exploração de cookies entre sites. |
| T12 | DELETE /usuarios/999999?perfil=aluno, fixture retornando affectedRows=0 | 200 com mensagem de remoção; teste repetido com zero linhas explícito para verificar o contrato. |

### O que não foi executado

Não iniciado node server/index.js: connectDB executa DDL e cria administrador padrão, contrariando a restrição de não modificar dados reais. Não houve MySQL descartável configurado. Não foram feitos login com credenciais reais, CRUD persistente, upload/download com arquivo real, migrações, concorrência real, testes de navegador/Android/iOS, benchmarks, teste de e-mail, varredura de CVEs ou pentest. Não foram instaladas dependências no projeto nem executados npm install/audit fix. O banco instalado pode diferir do DDL; isso permanece não verificado.

## Pontos revisados sem defeito comprovado

Consultas de valores usam placeholders; nomes de tabelas de pessoa passam por mapa fechado. Não foi comprovada injeção SQL nessas rotas. Nomes de uploads usam UUID e extensão permitida, com rejeição de extensão não listada. Saídas de texto da interface passam em geral por escHtml e nomes em selects usam textContent. A expressão de extensão e o escape existentes não resolvem autorização, validação de conteúdo ou todos os riscos de dados legados, mas não devem ser removidos nas correções. Static do backend/SQL foi restringido às pastas frontend; não foi afirmado que server/index.js está publicamente servido na versão atual.
