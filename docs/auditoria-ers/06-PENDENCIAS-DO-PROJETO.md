# Checklist de pendências confirmadas

Fotografia de 15/10/2026. **46 tarefas confirmadas**, vinculadas aos prompts do documento 05. Caixas vazias significam pendente; nenhuma implementação foi feita nesta auditoria. Consulte o plano e as dependências antes de iniciar. “Condicionado” indica que o objetivo é confirmado, mas depende de contrato/legado definido antes da execução.

**Atualização de19/10/2026:** **46/46 prompts concluídos no escopo autorizado.** Lote final P38/P39/P44/P46 encerrado; D06 e matriz/metas D12 aprovadas em07. Regressão integral comsaída0:1294/1294,46suítes,37arquivos; zero falhas/cancelamentos/ignorados/todo. Matriz local aprovada, evidências em10; Android/iOS físicos e produção sem homologação. Banco real preservado; seis alertas npm anteriores continuam pendentes. Detalhes em[08 — Controle](08-CONTROLE-DE-EXECUCAO.md).

## A — Contenção imediata

- [x] **P01 · P0** — Autenticação com senha e proteção das credenciais. **Concluído em 18/10/2026: 30 testes P01 + 375 regressões aprovados; conversão de senhas validada em MySQL descartável. Aplicação no banco real não executada.**
- [x] **P02 · P0** — Autorizar operações administrativas no servidor. **Concluído em 18/10/2026: 114/114 testes HTTP isolados; banco/arquivos simulados.**
- [x] **P03 · P0** — Configurar origem da API, CORS e cookies. **Concluído em 19/10/2026: 22/22 configuração/esquema, 8/8 UTC, 51/51 Chrome e 138/138 regressões; D12 operacional aprovada. P44 concluiu a matriz local aprovada; dispositivos físicos continuam sem homologação.**

## B — Banco, identidade e acesso

- [x] **P04 · P1** — Organizar instalação e migrações do banco. **Concluído em 18/10/2026: 14 testes MySQL descartável real + 405 regressões aprovados; sem DDL na partida normal e sem acesso ao banco real.**
- [x] **P05 · P1** — Isolar transações por conexão de pool. **Concluído em 18/10/2026: 20 testes P05 (13 MySQL real) + 419 regressões aprovados; pool, commit/rollback isolados e liberação/descarte validados.**
- [x] **P06 · P0** — Vincular credenciais a alunos e professores. **Concluído em 18/10/2026: 734/734 testes, incluindo 14 novos MySQL e 3 Chrome; migração 004 testada sem aplicação real.**
- [x] **P07 · P0** — Filtrar recursos acadêmicos por identidade e vínculo. **Concluído em 18/10/2026: 816/816 regressão e 23/23 específicos após revisão final; MySQL/HTTP/arquivos descartáveis.**
- [x] **P08 · P0** — Download autenticado dos documentos. **Concluído em 18/10/2026: 861/861 testes finais; 43 novos casos de download e 1 Chrome. URLs públicas fechadas, acesso por ID e caminho confinado.**
- [x] **P09 · P0** — Corrigir identidade do autor dos documentos. **Concluído em 19/10/2026: 103/103 API/MySQL/arquivos e 56/56 Chrome; conta/snapshot novos, legados pendentes e conta autora protegida.**
- [x] **P10 · P1** — Validar relações e integridade dos projetos. **Concluído em 18/10/2026: 142 testes P10 (24 MySQL real) + 439 regressões aprovados; validação de participantes e migração 003 não destrutiva testadas. Banco real não acessado.**

## C — Corrigir fluxos existentes

- [x] **P11 · P1** — Validar cadastro e edição de pessoas na API. **Concluído em 18/10/2026: 233 testes P11 e 114 regressões P02 aprovados; banco/arquivos simulados.**
- [x] **P12 · P1** — Validar formulário de aluno e aplicar máscara de telefone. **Concluído em 18/10/2026: 28 testes Chrome + 347 regressões API aprovados; colagem simulada, sem clipboard do SO ou dados reais.**
- [x] **P13 · P1** — Usar sessão do servidor como identidade na interface. **Concluído em 18/10/2026: 105/105 testes pertinentes; 19 novos HTTP/Chrome com DB simulado.**
- [x] **P14 · P1** — Tratar respostas HTTP antes de atualizar a interface. **Concluído em 18/10/2026: 122/122 testes pertinentes, incluindo 41 novos Chrome.**
- [x] **P15 · P1** — Respostas corretas para recursos ausentes e erros da API. **Concluído em 18/10/2026: 136 casos P15 (9 MySQL real, 31 Chrome) + 581 regressões aprovados; ausência, conflito, edição idêntica e sanitização validados.**
- [x] **P16 · P1** — Validar e limitar uploads de documentos. **Concluído em 18/10/2026: 203/203 testes pertinentes, 33 novos; limites operacionais e conteúdo compatível.**
- [x] **P17 · P1** — Coordenar exclusão de projeto e arquivos físicos. **Concluído em 18/10/2026: 53/53 específicos/download e239/239 regressões; fila006 recuperável.**

## D — Projetos e subprojetos

- [x] **P18 · P1** — Adicionar status do projeto. **Concluído em 18/10/2026: regra dos legados aprovada;38/38 confirmação e31/31 regressão Chrome.**
- [x] **P19 · P1** — Mostrar informações do projeto aos participantes. **Concluído em 18/10/2026:54/54 regressão inicial e14/14 Chrome final.**
- [x] **P20 · P1** — Modelo e API de cadastro de subprojeto. **Concluído em 18/10/2026: 31/31 HTTP/MySQL real descartável; versão007.**
- [x] **P21 · P1** — API de edição de subprojeto. **Concluído em 18/10/2026: 43/43 HTTP/MySQL; 12 novos de edição.**
- [x] **P22 · P1** — API de exclusão de subprojeto. **Concluído em 18/10/2026: 50/50 HTTP/MySQL; 7 novos de exclusão.**
- [x] **P23 · P1** — Lista e detalhe de subprojetos. **Concluído em 18/10/2026:73/73 Chrome/API/MySQL.**
- [x] **P24 · P1** — Formulário de criação de subprojeto. **Concluído em 18/10/2026:35/35 Chrome,12 novos; cadastro no pai correto e dados preservados em erro.**
- [x] **P25 · P1** — Formulário de edição de subprojeto. **Concluído em 18/10/2026:96/96 Chrome/API/MySQL,11 novos.**
- [x] **P26 · P1** — Confirmação de exclusão de subprojeto. **Concluído em 18/10/2026:105/105 pertinentes,93/93 regressões e 55/55 confirmação Chrome.**

## E — Núcleo de quizzes

- [x] **P27 · P1** — Núcleo e API administrativa de criação de quizzes. **Concluído em 18/10/2026:41/41 HTTP/MySQL/esquema; decisão D08 aprovada.** **Condicionado às decisões/pré-requisitos do plano.**
- [x] **P28 · P1** — Formulário administrativo de criação de quiz. **Concluído em 18/10/2026:69/69 Chrome,14 novos.** **Condicionado às decisões/pré-requisitos do plano.**
- [x] **P29 · P1** — API de edição administrativa de quiz. **Concluído em 18/10/2026:41/41 HTTP/MySQL; bloqueio integral com histórico.** **Condicionado às decisões/pré-requisitos do plano.**
- [x] **P30 · P1** — Formulário administrativo de edição de quiz. **Concluído em 18/10/2026: 26/26 Chrome na etapa e 34/34 na confirmação P30/P32; 12 casos de edição ao final, IDs e rascunho preservados.**
- [x] **P31 · P1** — API de exclusão administrativa de quiz. **Concluído em 18/10/2026: 54/54 HTTP/MySQL; 13 novos, exclusão bloqueada com histórico e rollback validado.**
- [x] **P32 · P1** — Confirmação de exclusão administrativa de quiz. **Concluído em 18/10/2026: 33/33 Chrome; 7 novos de confirmação/cancelamento e conflitos.**

## F — Integração e consultas

- [x] **P33 · P1** — Entrada pública e informações de projetos para visitante. **Concluído em 18/10/2026: 14/14, contrato público mínimo sem dados pessoais, 7 HTTP/MySQL e 7 Chrome controlados.**
- [x] **P34 · P1** — Catálogos de quizzes para aluno e visitante. **Condicionado às decisões/pré-requisitos do plano.** **Concluído em 19/10/2026: catálogo autorizado e introdução pública mínima; 10/10 HTTP/MySQL + 50/50 Chrome/regressão.**
- [x] **P35 · P1** — Persistir respostas e resultados com identidade do aluno. **Condicionado às decisões/pré-requisitos do plano.** **Concluído em 19/10/2026: 20/20 HTTP/MySQL; respostas/resultado atômicos, identidade e uma tentativa/reenvio seguro.**
- [x] **P36 · P1** — Interface do aluno para responder quiz. **Condicionado às decisões/pré-requisitos do plano.** **Concluído em19/10/2026:24 casos Chrome/HTTP/MySQL e regressão integral1262/1262; erros preservam escolhas e resultado vem do servidor.**
- [x] **P37 · P1** — Texto explicativo independente na submissão de arquivo. **Concluído em 19/10/2026: 63/63 API/arquivos, 101/101 Chrome; campo separado opcional, legados NULL e texto seguro.**
- [x] **P38 · P1** — Histórico de desempenho do próprio aluno. **Concluído em19/10/2026:7/7 API/MySQL e26/26 Chrome/regressão; resultados próprios persistidos, sem gabarito nem filtros de identidade.**
- [x] **P39 · P1** — Consulta do professor aos resultados acompanhados. **Concluído em19/10/2026: regra D06 aprovada,86/86 pertinentes; vínculos atuais, escolhas sem gabarito e revogação verificados.**

## G — Recuperação

- [x] **P40 · P1** — API de recuperação de senha por e-mail. **Concluído em 19/10/2026: 21/21 recuperação/operação, SMTP fictício, token único e revogação de sessões; contatos/SMTP reais dependem de configuração local.**
- [x] **P41 · P1** — Interface de solicitação e redefinição de senha. **Concluído em 19/10/2026: 9/9 integração local Chrome/HTTP/MySQL com SMTP falso; lote 1187/1187 em 38 suítes, saída 0.**

## H — Qualidade e manutenção

- [x] **P42 · P2** — Reduzir consultas e carga da listagem de projetos. **Concluído em 18/10/2026: 190/190 pertinentes +181/181 regressões; consultas constantes e descrição preservada.**
- [x] **P43 · P2** — Disponibilizar verificações reproduzíveis de segurança e persistência. **Concluído em 18/10/2026: npm test com 1145/1145, 33 suítes; configuração real recusada e mutação de autorização detectada em memória.**
- [x] **P44 · P2** — Verificar e corrigir interface em dispositivos e navegadores. **Concluído em19/10/2026 na matriz local aprovada:Chrome/Edge,10combinações,102/102 pertinentes; evidências/metas em10. Sem homologação física/produção.**
- [x] **P45 · P2** — Separar módulos do backend preservando contratos. **Concluído em 19/10/2026: módulos preservam 29 rotas; regressão 1187/1187, 38 suítes, saída 0.**
- [x] **P46 · P2** — Separar módulos do frontend preservando fluxos. **Concluído em19/10/2026:10módulos clássicos,110funções preservadas,handlers/matriz e regressão integral1294/1294 aprovados;saída0.**

## Como marcar uma tarefa

Confira os critérios do próprio prompt, registre resultados reais e só marque depois da entrega verificada. API pronta não fecha a tarefa de interface nem o requisito completo. Nenhuma caixa autoriza desenvolver o escopo indefinido; o resultado final de quiz de P35 exige cálculo posterior aprovado por D08.

As decisões D01–D12 estão no documento 07. Não há caixas de implementação para editais, conteúdo ainda a confirmar, período de projeto, estados de publicação, cálculo, evolução ou entidade Atividade. A ausência dessas caixas reflete o planejamento original. Vínculo/publicação e correção receberam aprovação e tarefas prévias documentadas em09, sem novos IDs; demais escopos indefinidos continuam exigindo decisão antes de ganhar tarefas.

## Alertas transversais de dependências — 19/10/2026

Crítico proxy-addr corrigido para o trust proxy de P03. Permanecem 6 alertas npm nas dependências existentes, com proposta de atualização e fontes em [server/DEPENDENCIAS.md](../../server/DEPENDENCIAS.md). Não altera os IDs dos 46 prompts nem equivale a auditoria limpa; correção ampla ainda pendente.
