# LABHIST — Controle de execução das implementações

**Criado em:** 17/10/2026, fuso America/Sao_Paulo. **Base documental:** auditoria de 15/10/2026. **Inicialização:** etapas 1, 2 e 3 do pedido de organização. **Atualização de execução:** P01, P02, P04, P05, P06, P07, P08, P10, P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22, P23, P24, P25, P26, P27, P28, P29, P30, P31, P32, P33, P42 e P43 autorizados e concluídos em 18/10/2026; Esse registro histórico refere-se às conclusões de 18/10/2026; o lote de 19/10/2026 está registrado abaixo.

**Revisão documental da inicialização (histórico):** 18/10/2026. Conferidos 46 registros únicos, todos inicialmente Pendentes, P02 como única tarefa liberada para seleção, datas de conclusão vazias e testes de implementação não executados. Os 28 arquivos preexistentes mantiveram seus hashes e tamanhos; somente este controle foi acrescentado. Esse registro descreve a inicialização, antes da implementação de P02.

## Situação atual — 19/10/2026 — 46/46 prompts concluídos

**Lote final:** P38 → P39 → P44 → P46 concluído, com D06 e matriz/metas D12 aprovadas explicitamente pelo usuário. Cada etapa foi implementada e validada antes de seu consumidor. Tarefas prévias aprovadas dos lotes anteriores não contam como prompts adicionais. Nenhum escopo novo iniciado.

**Totais atuais:** 0 Pendentes, 0 Bloqueados, 0 Em desenvolvimento, 0 Aguardando teste e **46 Concluídos de 46**. **Não faltam prompts da lista05.** Checklist06 e46 registros conferidos. Isso não declara toda a ERS homologada nem aprova escopos adicionais.

**Regressão final:** npm.cmd --prefix server --logs-max=0 test, saída0. **1294/1294 testes,46suítes,37arquivos**, zero falhas/cancelamentos/ignorados/todo. Segurança/banco1020/1020,33suítes,820351.2884ms; navegador274/274,13suítes,245351.9474ms. Fases sequenciais, concorrência2 e1. Log labhist-lote-p38-p39-p44-p46-final.log. Inclui nova consulta de histórico/acompanhamento, matriz local Chrome/Edge e regressão dos dez módulos clássicos. Não somar ensaios incrementais novamente.

**Última regressão integral (lote anterior):** npm.cmd --prefix server --logs-max=0 test, saída 0, **1262/1262 testes em 42 suítes**, zero falhas/cancelamentos/ignorados/todo. Fase segurança/banco: 1005/1005, 32 suítes, 394150.0482 ms; navegador: 257/257, 10 suítes, 87635.0642 ms. 35 arquivos em fases separadas, concorrência 2 e 1. Log labhist-lote-p45-p34-p35-p36-confirmacao.log. Primeira regressão encontrou 5 falhas P22; integração da FK composta corrigida, 62/62 pertinentes aprovados e suíte inteira repetida sem falhas. Histórico completo abaixo, sem contar o ensaio falho como aprovação.

**Evidências e limites:** HTTP/MySQL/arquivos/Chrome/Edge reais descartáveis para os testes novos; suítes antigas mantêm os doubles declarados em seus relatórios. Matriz local aprovada em07 e evidências/metas em10,10 combinações, toque/teclado/orientação emulados. Sem Android/iOS físicos, rede de produção ou SMTP real. Extração preservou110 funções, com entrada12linhas e10 módulos clássicos descritos em mainPage/MODULOS.md; scripts únicos, sintaxe conjunta e handlers inline conferidos. Grafo backend48 módulos locais, imports presentes e sem ciclos. Inventário do lote final32 arquivos abaixo.

**Banco/ambiente:** esquema esperado015, sem migração nova neste lote. Banco/.env/uploads reais preservados; nenhuma implantação, commit, e-mail real ou início do serviço real do projeto. Após saída0, consulta CIM confirmou zero mysqld de fixture e zero Chrome/Edge com perfil labhist-p12 remanescentes. Seis alertas npm anteriormente registrados continuam pendentes em server/DEPENDENCIAS.md, sem alteração de pacotes; não se declara auditoria de dependências limpa. Resíduo histórico P15 labhist-p10-Jk2vqy preservado, sem contorno da rejeição registrada.

**Próximo prompt:** nenhum da lista05. Restantes escopos/decisões da ERS, migrações/configuração reais, dependências e homologação física/produção não foram convertidos em tarefas extras por presunção.

## Seleção inicial (histórico)

**P02 — Autorizar operações administrativas no servidor · prioridade P0.**

O [P02 no arquivo 05](05-PROMPTS-DE-IMPLEMENTACAO.md) declara: “Preferencialmente P01 (autenticação com senha); pode corrigir a autorização central antes dela.” Portanto, P01 não é uma dependência obrigatória de P02. A execução de P02 está liberada para seleção, mas só começará quando o usuário solicitar **“Execute o próximo prompt”** ou autorizar explicitamente P02.

**P01 não está liberado como tarefa completa:** sua condição de início exige definir em D11 o procedimento de migração/redefinição das credenciais legadas. Essa resposta ainda está pendente no [arquivo 07](07-DUVIDAS-DA-ERS.md). A contenção da rota sem senha poderia ser feita isoladamente, porém isso seria somente uma parte de P01. Não dividir, implementar parcialmente ou marcar P01 como concluído sem autorização específica para essa divisão e sem os critérios completos atendidos.

A liberação acima é documental, não prova de que o código atual continue idêntico à auditoria. Antes de implementar P02, reler seu texto integral, inspecionar o backend relacionado e conferir alterações desde a auditoria. Se já estiver implementado corretamente, apresentar evidências e solicitar confirmação antes de registrá-lo como Concluído.

## Inicialização e significado dos estados

Conforme solicitado, **todos os 46 prompts começam com situação Pendente**, sem data de conclusão e sem testes de implementação atribuídos. O checklist atual tem 46 caixas vazias; nenhum prompt possui conclusão comprovada nesta organização. Não foi feita nova auditoria do código nem validação de funcionalidades para inferir tarefas concluídas.

**Pendente não significa liberado.** As dependências e decisões não resolvidas continuam impedindo execução. A coluna “Liberação atual” evita que a inicialização como Pendente seja interpretada como autorização. Inclusive P35, expressamente bloqueado no texto do prompt, permanece impedido, embora seu estado inicial de fila seja Pendente por determinação deste pedido.

| Estado permitido | Uso |
|---|---|
| Pendente | Tarefa ainda não iniciada. Pode ter impedimentos documentados; conferir liberação antes da seleção. |
| Bloqueado | Ao avaliar/selecionar a tarefa, constatou-se impedimento que exige dependência, decisão ou condição externa. Registrar causa, parte afetada e o que falta para liberar. |
| Em desenvolvimento | Uma única tarefa autorizada foi iniciada, com dependências e escopo verificados. |
| Aguardando teste | Implementação feita, mas faltam testes ou evidências necessários. Se houver teste manual, manter este estado até confirmação do usuário. |
| Concluído | Todos os critérios de aceitação foram atendidos e os testes pertinentes registrados. Se houve teste manual, sua confirmação foi registrada. Só então preencher data e marcar a caixa no arquivo 06. |

**Resumo inicial:** 46 Pendentes; 0 Bloqueados como estado de execução; 0 Em desenvolvimento; 0 Aguardando teste; 0 Concluídos. **Liberação documental:** 1 tarefa selecionável (P02); 45 não liberadas agora por dependência ou decisão. Esses totais não representam funcionalidades ausentes nem contradizem os status de requisitos da auditoria.

## Conferência do planejamento existente

Arquivos lidos integralmente: [04 — Plano](04-PLANO-DE-IMPLEMENTACAO.md), [05 — Prompts](05-PROMPTS-DE-IMPLEMENTACAO.md), [06 — Checklist](06-PENDENCIAS-DO-PROJETO.md) e [07 — Dúvidas](07-DUVIDAS-DA-ERS.md). Não foi necessário reler integralmente matriz/erros nem reanalisar os módulos do sistema para esta organização.

| Verificação | Resultado |
|---|---|
| Prompts de P01 a P46, sem repetição de ID ou lacuna | 46 encontrados, cada um uma vez, presentes também no plano e no checklist. |
| Objetivo e critérios de aceitação | Presentes nos 46 prompts. Também conferidos contexto, arquivos, dependências, instruções, cuidados, testes e entrega esperada. |
| Ordem formal e dependências | As dependências de tarefas identificadas não formam ciclos e precedem seus consumidores na numeração. Referências de exclusão/etapa futura não foram confundidas com pré-requisitos. Há ressalvas de liberação e integração em R01–R03 abaixo. |
| Segurança prioritária | P01/P02/P03 são P0; P06–P09 continuam prioritários, com P04/P05 como base estrutural necessária. Não pular essas dependências para implementar segurança por aparência. |
| Duplicação de tarefas | Não identificada duplicação integral de objetivo. API e formulário são entregas distintas; testes/regressões comuns não autorizam repetir ou ampliar a implementação. |
| Requisitos indefinidos | D01–D12 estão sem resposta registrada. D03/D04/D08 e contratos futuros bloqueiam o fluxo acadêmico de quizzes/resultados; os bloqueios foram preservados. |
| Funcionalidades removidas | Nenhum campo “Requisitos atendidos” dos prompts tem RF28–RF32 ou RN10 como alvo. Editais continuam fora da implementação; as menções são orientações para não criá-los. |
| Conteúdo/período/evolução ainda indefinidos | Sem implementação automática. Preservar exclusões de escopo e resolver a decisão antes de especificar a parte nova. |
| Evidência de conclusão | Nenhuma conclusão atribuída. Testes da auditoria não foram reutilizados como testes de implementação. |

### Propostas de ajuste — não aplicadas aos documentos existentes

Estas propostas são apresentadas **antes de qualquer alteração** em 04/05/06/07, conforme o pedido. Somente este novo controle foi criado. Não houve renumeração, reescrita de prompts, mudança de escopo ou preenchimento de decisões.

**R01 — Escolha inicial conforme dependências efetivas.** Começar pelo P02 enquanto D11 impedir concluir P01 integralmente. Isso já é permitido pela exceção explícita de P02 e pela regra do plano de executar a próxima tarefa liberada; não requer renumerar P01/P02 nem tratar uma parte de P01 como entrega completa. Resolver o procedimento de credenciais legadas com o responsável para liberar P01 posteriormente. A descrição do controle aplica a exceção já existente; não aprova decisão de migração.

**R02 — Antecipar P13 após P06, antes de restringir consultas em P07.** P13 fornece identidade de sessão à interface e remove o seletor antigo; P07 restringe recursos e cadastros globais que a interface auditada ainda consulta. Executar a integração de identidade antes da restrição reduz risco de regressão durante a sequência. É uma recomendação derivada dos próprios escopos dos prompts, não um defeito novo comprovado no código atual. Proposta: depois de P01/P02/P06 concluídos, executar P13 antes de P07; P14 pode então ser integrado antes das telas que dele dependem. **Atualização em 18/10/2026: sequência aprovada pelo usuário no lote P06 → P13 → P14 → P07 → P08. Nota aplicada a 04/05; IDs e escopos preservados.** Durante a implementação autorizada, se surgir acoplamento tecnicamente inseparável, informar e pedir autorização para combinar tarefas, sem fazê-lo automaticamente.

**R03 — Diferenciar começar P43 de concluir P43.** O plano admite antecipar P43 após P02/P04 e ampliar os casos conforme P05/P07/P08/P09 forem concluídos. Seus critérios completos incluem segurança e persistência; não basta criar infraestrutura ou testes com mocks se as proteções/fixtures necessárias não estiverem implementadas e validadas. Proposta: manter a antecipação como possibilidade explícita de preparação, se autorizada, mas só concluir o prompt quando cumprir todos os seus critérios e verificar as dependências efetivamente exercitadas. Se for desejada uma entrega autônoma de infraestrutura antes disso, aprovar primeiro a divisão do escopo, sem recriar o prompt inteiro nem encerrar P43 por antecipação.

**Contratos futuros de quiz:** P34/P35 e seus consumidores exigem implementação de vínculo/publicação/correção após D03/D04/D08. O plano já reconhece que esses prompts específicos ainda não existem. Não foram criados agora, pois as decisões permanecem abertas. Aprovar uma decisão não conclui sua implementação nem libera automaticamente catálogo, respostas ou desempenho.

## Registro dos 46 prompts

Nomes e prioridades foram preservados. A coluna “Dependências de tarefas” normaliza as referências operacionais do arquivo 05; as observações distinguem pré-requisito, integração, exclusão e evolução posterior. Para executar, o texto completo do prompt e suas condições prevalecem; dúvidas de dependência devem ser esclarecidas, não resolvidas ampliando escopo.

“Não executados” refere-se aos testes de cada implementação. As validações documentais desta organização constam no histórico, sem serem creditadas a P01–P46. Arquivos de aplicação/testes alterados após a inicialização e seus resultados são discriminados no histórico de cada execução.

| Prompt / tarefa | Prioridade | Dependências de tarefas | Decisões e observações | Situação | Liberação atual | Data de conclusão | Testes realizados |
|---|---|---|---|---|---|---|---|
| **P01 — Autenticação com senha e proteção das credenciais** | P0 | Nenhuma obrigatória | D11 parcialmente resolvida pelo usuário: opção 1, preservar senhas e migrar para hashes. Migração real não executada. Detalhes no histórico. | Concluído | Encerrado | 18/10/2026 | 30/30 P01 (6 MySQL real) + 375/375 regressões; sintaxe OK. |
| **P02 — Autorizar operações administrativas no servidor** | P0 | Nenhuma obrigatória | Autorizado pelo usuário em 18/10/2026. Sete rotas protegidas; allowlist de perfis aplicada; escopo e limitações registrados no histórico. | Concluído | Encerrado | 18/10/2026 | 114/114 testes HTTP; sintaxe e dependências OK. Banco/arquivos simulados. |
| **P03 — Configurar origem da API, CORS e cookies** | P0 | P01 | D12 operacional aprovada em 07; matriz P44 ainda pendente | Concluído | Validado em HTTP/HTTPS e MySQL descartável | 19/10/2026 | 22/22 configuração/esquema, 8/8 UTC, 51/51 Chrome, 138/138 regressão |
| **P04 — Organizar instalação e migrações do banco** | P1 | P01 | Autorizado por “proximo” em 18/10/2026. Migrações 001/002, adoção de legado compatível e verificação sem DDL na partida. Banco real não acessado; P09/P10 não antecipados. | Concluído | Encerrado | 18/10/2026 | 14/14 P04 MySQL real + 405/405 regressões; sintaxe OK. |
| **P05 — Isolar transações por conexão de pool** | P1 | P04 | Autorizado por “proximo” em 18/10/2026. Pool e conexão dedicada por transação; descarte em falha insegura, sem retry/reconexão da operação. | Concluído | Encerrado | 18/10/2026 | 20/20 P05 (13 MySQL real) + 419/419 regressões; sintaxe OK. |
| **P06 — Vincular credenciais a alunos e professores** | P0 | P01, P04, P05 | D10/D11 resolvidas para este escopo pelo usuário: usuário único, vínculo explícito por IDs e contas acadêmicas sem vínculo bloqueadas. Sem associação por nome nem execução real. | Concluído | Encerrado; regra aprovada em 07 | 18/10/2026 | 734/734, incluindo 14 novos MySQL e 3 novos Chrome |
| **P07 — Filtrar recursos acadêmicos por identidade e vínculo** | P0 | P01, P06, P02 | Regras de vínculo preservadas (D09); R02 aprovada e P13/P14 integrados antes das restrições. Não há autoinscrição. | Concluído | Encerrado | 18/10/2026 | 816/816 regressão; 23/23 específicos após revisão final |
| **P08 — Download autenticado dos documentos** | P0 | P07 | Nenhuma decisão adicional de escopo. P09 é evolução posterior do formato de autoria, não pré-requisito declarado. Validar colisão de IDs legados; não liberar bytes ao autor errado. | Concluído | Encerrado | 18/10/2026 | 861/861 finais; 43 novos de download + 1 Chrome |
| **P09 — Corrigir identidade do autor dos documentos** | P0 | P06, P04 | D07/D10 aprovadas; snapshots novos, legados sem dedução e conta autora RESTRICT | Concluído | Validado; sem saneamento real de legados | 19/10/2026 | 103/103 API/MySQL/arquivos, 56/56 Chrome |
| **P10 — Validar relações e integridade dos projetos** | P1 | P04, P05 | Autorizado por “proximo prompt” em 18/10/2026. IDs/existência validados, FKs e UNIQUE na versão 003 com diagnóstico de legados sem limpeza automática. Regras de equipe preservadas. | Concluído | Encerrado | 18/10/2026 | 142/142 P10 (24 MySQL real) + 439/439 regressões; sintaxe OK. |
| **P11 — Validar cadastro e edição de pessoas na API** | P1 | P02 | Autorizado por “proximo” em 18/10/2026. Validação central de POST/PUT e normalização compatível de cursos/turmas. Professor mantém só nome obrigatório; D10 continua pendente. | Concluído | Encerrado | 18/10/2026 | 233/233 testes P11 + 114/114 P02; sintaxe/dependências OK. Banco/arquivos simulados. |
| **P12 — Validar formulário de aluno e aplicar máscara de telefone** | P1 | P11 | Autorizado por “proximo prompt” em 18/10/2026. Validação anterior ao fetch, máscara com cursor/seleção/exclusão e rótulo da ERS compatível com legados. | Concluído | Encerrado | 18/10/2026 | 28/28 testes Chrome + 347/347 regressões API; sintaxe OK. Banco/arquivos simulados. |
| **P13 — Usar sessão do servidor como identidade na interface** | P1 | P01, P02, P06 | Identidade autenticada vinculada definida por P06. R02 aprovada pelo usuário no lote; menus usam a sessão do servidor. | Concluído | Encerrado | 18/10/2026 | 105/105 pertinentes; 19 novos (10 HTTP, 9 Chrome) |
| **P14 — Tratar respostas HTTP antes de atualizar a interface** | P1 | P13 | Nenhuma decisão adicional. Preparação com mocks antes de P13 não equivale à conclusão do prompt completo. | Concluído | Encerrado | 18/10/2026 | 122/122 pertinentes; 41 novos Chrome |
| **P15 — Respostas corretas para recursos ausentes e erros da API** | P1 | P02, P05 | Autorizado por “proximo prompt” em 18/10/2026. Ausência 404, edição idêntica 200, conflitos 409 e falhas internas 500 sanitizadas; rollback preservado. Interface testada sem implementar P14. | Concluído | Encerrado | 18/10/2026 | 136/136 P15 (9 MySQL real, 31 Chrome) + 581/581 regressões; sintaxe OK. |
| **P16 — Validar e limitar uploads de documentos** | P1 | P07, P08, P04 | Definir/documentar limite operacional de upload na tarefa. Não tratar limite técnico escolhido como requisito novo da ERS; testar sem dados reais. | Concluído | Encerrado | 18/10/2026 | 203/203 pertinentes; 33 novos de upload |
| **P17 — Coordenar exclusão de projeto e arquivos físicos** | P1 | P02, P08, P04, P05 | Nenhuma decisão adicional fixa. Validar limpeza após commit e preservação de arquivos em rollback; não apagar arquivos externos. | Concluído | Encerrado | 18/10/2026 | 53/53 limpeza/download + 239/239 regressões |
| **P18 — Adicionar status do projeto** | P1 | P02, P04, P10 | Regra aprovada pelo usuário em 07: legados NULL/Não informado, novos com estado válido e classificação administrativa. D05 fora do escopo. | Concluído | Encerrado; regra aprovada em 07 | 18/10/2026 | 38/38 confirmação API/esquema/Chrome +31/31 regressão Chrome |
| **P19 — Mostrar informações do projeto aos participantes** | P1 | P07, P13, P18 | D09 somente se ampliar participação além do vínculo administrativo. Exibir informações autorizadas; não criar autoinscrição. | Concluído | Encerrado | 18/10/2026 | 54/54 regressão +14/14 Chrome final (8 P19) |
| **P20 — Modelo e API de cadastro de subprojeto** | P1 | P02, P07, P04, P10 | Somente campos confirmados de subprojeto. Não criar conteúdo educacional, quiz ou atividade ainda indefinidos. | Concluído | Encerrado | 18/10/2026 | 31/31 HTTP/MySQL real descartável |
| **P21 — API de edição de subprojeto** | P1 | P20, P15 | Sem transferência de projeto pai não aprovada. Reutilizar validação e autorização de P20. | Concluído | Encerrado | 18/10/2026 | 43/43 HTTP/MySQL; 12 novos de edição |
| **P22 — API de exclusão de subprojeto** | P1 | P20, P21, P05, P15 | D07 se já existirem envios/dependentes cujo descarte precise de política. Sem dependentes novos, não inventar cascatas de conteúdo/quiz/arquivo. | Concluído | Encerrado | 18/10/2026 | 50/50 HTTP/MySQL; 7 novos de exclusão |
| **P23 — Lista e detalhe de subprojetos** | P1 | P19, P20, P14 | Contrato de leitura segura de P20. Somente navegação/lista/detalhe; escrita pertence a P24–P26. | Concluído | Encerrado | 18/10/2026 | 73/73 Chrome e MySQL descartável |
| **P24 — Formulário de criação de subprojeto** | P1 | P20, P23, P14 | Contrato administrativo de P20. Cadastro visual; não duplicar API/modelagem. | Concluído | Encerrado | 18/10/2026 | 35/35 Chrome (12 novos P24); API P20 preservada |
| **P25 — Formulário de edição de subprojeto** | P1 | P21, P23, P24, P14 | Contrato administrativo de P21. Edição visual; preservar identidade e projeto pai. | Concluído | Encerrado | 18/10/2026 | 96/96 Chrome e HTTP/MySQL;11 novos de edição visual |
| **P26 — Confirmação de exclusão de subprojeto** | P1 | P22, P23, P24, P14 | Política de dependentes já aplicada por P22. Exclusão visual com confirmação; não apagar somente do DOM. | Concluído | Encerrado | 18/10/2026 | 105/105 pertinentes + 93/93 regressões;55/55 Chrome final |
| **P27 — Núcleo e API administrativa de criação de quizzes** | P1 | P02, P04, P05 | D08 parcial aprovada em 07: escolha única, mínimo2 alternativas e1 correta. D03/D04/RF40 fora do núcleo; sem exposição acadêmica. | Concluído | Encerrado; D08 parcial aprovada em 07 | 18/10/2026 | 41/41 HTTP/MySQL/esquema;27 novos de quiz |
| **P28 — Formulário administrativo de criação de quiz** | P1 | P27, P13, P14 | Tipo aprovado em 07. Formulário administrativo do núcleo, sem vínculo/publicação/pontuação. | Concluído | Encerrado | 18/10/2026 | 69/69 Chrome;14 novos de quiz |
| **P29 — API de edição administrativa de quiz** | P1 | P27, P05, P15 | D08 parcial aprovada em 07: bloquear integralmente edição se houver respostas/resultados. Sem presumir política de exclusão. | Concluído | Encerrado; D08 parcial aprovada em 07 | 18/10/2026 | 41/41 HTTP/MySQL;14 novos de edição |
| **P30 — Formulário administrativo de edição de quiz** | P1 | P29, P28, P14 | Política de edição de P29/D08. Edição visual do núcleo; preservar IDs e respostas existentes. | Concluído | Validado; P29/P28/P14 atendidos | 18/10/2026 | 26/26 Chrome com API controlada, incluindo 11 novos P30 |
| **P31 — API de exclusão administrativa de quiz** | P1 | P27, P05, P15 | D08: retenção de respostas/resultados na exclusão. Não apagar histórico para simplificar a implementação. | Concluído | Retenção aprovada em 07; dependências atendidas | 18/10/2026 | 54/54 HTTP/MySQL descartável, 13 novos P31 |
| **P32 — Confirmação de exclusão administrativa de quiz** | P1 | P31, P28, P14 | Política de exclusão de P31/D08. Confirmação visual; manter item quando API negar exclusão. | Concluído | P31/P28/P14 e retenção aprovada | 18/10/2026 | 33/33 Chrome, 7 novos P32 |
| **P33 — Entrada pública e informações de projetos para visitante** | P1 | P02, P07, P08 | Confirmar contrato público mínimo antes de expor dados. D02 não bloqueia informações públicas de projetos; conteúdos/editais continuam fora. | Concluído | Contrato mínimo registrado e validado | 18/10/2026 | 14/14: 7 HTTP/MySQL e 7 Chrome controlados |
| **P34 — Catálogos de quizzes para aluno e visitante** | P1 | P07, P27, P33 | D03/D04 aprovadas em 19/10 e tarefa prévia de vínculo/publicação implementada/testada; ver09. | Concluído | Dependência de vínculo/publicação e catálogos validados | 19/10/2026 | 10/10 HTTP/MySQL + 50/50 Chrome/regressão |
| **P35 — Persistir respostas e resultados com identidade do aluno** | P1 | P01, P07, P06, P05, P27 | D03/D04/D08 aprovadas em19/10; tarefas prévias de disponibilidade/correção concluídas antes deP35, conforme09. | Concluído | Correção/disponibilidade aprovadas e implementadas | 19/10/2026 | 20/20 HTTP/MySQL transações, concorrência/histórico; correção9/9 |
| **P36 — Interface do aluno para responder quiz** | P1 | P34, P35 | D03/D04/D08 resolvidas e contratos implementados. Formulário de resposta do aluno; nunca calcular pontuação no navegador. | Concluído | Fluxo integrado e regressão completa aprovados | 19/10/2026 | 1262/1262 no lote;24 Chrome/HTTP/MySQL específicos |
| **P37 — Texto explicativo independente na submissão de arquivo** | P1 | P07, P04, P09, P16 | D07 não cria vínculo novo; texto opcional separado e legados NULL | Concluído | Validado | 19/10/2026 | 63/63 API/arquivos, 101/101 Chrome |
| **P38 — Histórico de desempenho do próprio aluno** | P1 | P13, P14, P35 | Correção aprovada de D08 implementada e resultado persistido. Evolução RF52/D06 fica fora; histórico mínimo não autoriza gráficos/indicadores novos. | Concluído | API e interface validadas | 19/10/2026 | 7/7 HTTP/MySQL e 26/26 Chrome/regressão, saída0 |
| **P39 — Consulta do professor aos resultados acompanhados** | P1 | P07, P35, P38 | D06 aprovada em07; ambos vínculos atuais ao projeto. | Concluído | API/interface e regressões validadas | 19/10/2026 | 86/86,4suítes,saída0; HTTP/MySQL/Chrome/arquivos descartáveis |
| **P40 — API de recuperação de senha por e-mail** | P1 | P01, P06, P04 | D11 aprovada; contato separado confirmado por admin, SMTP, token 30min/uso único e sessões revogadas | Concluído | Validado com SMTP fictício e MySQL real descartável | 19/10/2026 | 21/21 recuperação/operação; SMTP real não acionado |
| **P41 — Interface de solicitação e redefinição de senha** | P1 | P40, P14 | D11 aprovada; teclado, token em memória/fragmento removido e erros seguros | Concluído | Integração local e regressão final aprovadas | 19/10/2026 | 9/9 Chrome/HTTP/MySQL com SMTP falso; lote 1187/1187 |
| **P42 — Reduzir consultas e carga da listagem de projetos** | P2 | P07, P05, P14 | Nenhuma decisão nova para remover N+1. P14 é integração frontend mencionada pelo prompt. Medir antes/depois, sem ganho inventado. | Concluído | Encerrado | 18/10/2026 | 190/190 pertinentes +181/181 regressões, em duas execuções |
| **P43 — Disponibilizar verificações reproduzíveis de segurança e persistência** | P2 | P02, P04 | R03 atendida: contratos atuais, persistência isolada, mutação negativa e configuração real recusada. P09 continua pendente; ampliar cobertura quando sua estrutura for implementada. | Concluído | Executor e critérios completos validados pelo npm | 18/10/2026 | 1145/1145 em 33 suítes; 5 casos do executor; zero falhas/ignorados |
| **P44 — Verificar e corrigir interface em dispositivos e navegadores** | P2 | P03, P13, P12, P14 | Matriz/metas locais aprovadas em07; evidência em10 | Concluído | Chrome/Edge,10 combinações e regressão validados | 19/10/2026 | 102/102,5suítes,saída0; sem homologação física/produção |
| **P45 — Separar módulos do backend preservando contratos** | P2 | P43 | Marco P01/P02/P03/P05/P06/P07/P08/P09/P10 revisado e regressado; dependências npm permanecem registradas separadamente | Concluído | Extrações e regressão integral aprovadas | 19/10/2026 | 1187/1187, 38 suítes; sintaxe, 29 rotas e imports sem ciclos |
| **P46 — Separar módulos do frontend preservando fluxos** | P2 | P13, P14, P43, P44 | P44 concluído; módulos em mainPage/MODULOS.md; métricas em10 | Concluído | Extrações, handlers, matriz e regressão integral aprovados | 19/10/2026 | 1294/1294,46suítes,37arquivos,saída0;110 funções preservadas |

## Como selecionar o próximo prompt

1. Aguardar o pedido do usuário. Nunca iniciar implementação só porque este arquivo foi criado, porque a tarefa anterior terminou ou porque um impedimento foi resolvido.
2. Ler novamente este controle e considerar tarefas Pendente ou reavaliar Bloqueado. Não executar tarefa Em desenvolvimento/Aguardando teste diferente sem tratar o estado anterior. Se a tarefa anterior espera teste manual, informar a pendência e pedir a confirmação necessária antes de declará-la concluída.
3. Conferir dependências obrigatórias Concluídas, decisões registradas e contratos existentes; Aguardando teste não satisfaz uma dependência que exige validação. Exceções explícitas, como P02 antes de P01, não devem virar bloqueio artificial.
4. Entre tarefas liberadas, priorizar segurança e usar a menor numeração aplicável. Executados P02, P11, P12, P01, P04, P05, P10 e P15 com autorizações individuais. P03 depende de D12, P06 de D10/D11 e P18 do acordo sobre status legados. Nenhum próximo prompt integralmente liberado. P43 admite somente preparação autorizada com ressalvas de R03. Não iniciar tarefa parcial nem presumir decisão pendente.
5. Reler o prompt integral no arquivo 05 e os trechos necessários da matriz/erros. Inspecionar só os módulos relacionados, comparar com a fotografia da auditoria e conferir código atual.
6. Se já estiver implementado corretamente, apresentar arquivos/funções e resultados de verificação; solicitar confirmação antes de marcar Concluído, conforme o pedido. Não tratar ausência de teste como ausência de código.
7. Executar exclusivamente a tarefa autorizada, com testes pertinentes e seguros, sem operações destrutivas no banco. Se encontrar erro crítico fora dela, informar imediatamente e propor correção separada.
8. Registrar alterações/testes/erros/limitações no histórico; atualizar situação, data quando cabível e a caixa correspondente de 06. Se houver teste manual pendente, deixar Aguardando teste até o usuário confirmar.
9. Apresentar relatório e indicar o próximo prompt liberado. **Parar; nunca executá-lo automaticamente.**

## Histórico de organização e execução

### 17/10/2026 — Inicialização do controle (etapas 1, 2 e 3)

- **Prompt executado:** nenhum.
- **Alteração autorizada:** criação de `docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md` com P01–P46 e protocolo de seleção/atualização.
- **Arquivos existentes alterados:** nenhum; 04/05/06/07 preservados, assim como aplicação, configurações, dependências e SQL.
- **Verificações documentais:** 46 IDs únicos; 46 objetivos; 46 conjuntos de critérios de aceitação; campos obrigatórios presentes; correspondência dos 46 IDs com plano/checklist; nenhuma caixa marcada como concluída; 12 decisões sem resposta; nenhuma dependência de tarefa inexistente/cíclica no conjunto normalizado; nenhum alvo de implementação de edital removido.
- **Testes do sistema:** não executados nesta etapa. Não foi iniciado servidor, aberto banco, instalado pacote, enviado arquivo/e-mail ou implementada funcionalidade.
- **Conclusões de prompts:** nenhuma; datas mantidas vazias.
- **Pendências relevantes:** D11 para P01 completo; propostas R02/R03 de melhoria do sequenciamento/encerramento ainda não aplicadas aos documentos originais.
- **Próximo prompt liberado para seleção:** P02 — Autorizar operações administrativas no servidor.
- **Parada:** aguardar autorização do usuário para implementar uma única tarefa.

### 18/10/2026 — P02: autorização das operações administrativas

- **Autorização:** o usuário respondeu “autorizado.” à proposta de executar exclusivamente P02. P01 é preferência, não dependência obrigatória deste prompt; nenhuma decisão de negócio adicional foi necessária.
- **Código atual conferido:** antes de editar, server/index.js tinha SHA-256 `8222e455fdebf656731436381eb9116318421e529c5bb74d46d3ba0517537981`, igual à auditoria. A falha não estava corrigida; não foi necessário pedir confirmação de implementação preexistente.
- **Alterações:** exigir requireAdmin depois de requireAuth em POST /cadastro, POST /cadastro-dashboard, PUT/DELETE /usuarios/:id e POST/PUT/DELETE /projetos. Em projetos, a autorização precede validarProjetoPayload. DELETE /documentos/:id preserva sua proteção anterior. Leituras acadêmicas não receberam restrição administrativa adicional.
- **Perfis de conta:** lista fechada administrador/professor/aluno, normalizada com trim/lowercase. Visitante, perfil desconhecido, chaves de protótipo, valores vazios e tipos inválidos são recusados antes de SQL. O perfil padrão administrador permanece somente quando o campo é omitido por uma sessão administrativa, preservando o contrato anterior; aluno/professor não alcançam esse cadastro.
- **Arquivos de produção alterados:** `server/index.js`, somente middleware/allowlist/comentário correspondente. Não foram alterados frontend, schema, queries dos CRUDs, configuração, dependências ou bootstrap.
- **Arquivo de testes criado:** `server/test/autorizacao.test.js`. Nenhum export ou interface de teste foi acrescentado ao código de produção. A suíte carrega o módulo em VM isolada com Express/session reais; MySQL e fs são substituídos por doubles antes do bootstrap. O MySQL simulado rejeita a conexão de inicialização; a aplicação original não escuta a porta 3000, não cria tabelas/conta padrão e não grava/remove arquivos reais.
- **Documentação atualizada:** este controle e `06-PENDENCIAS-DO-PROJETO.md`. Plano, prompts, decisões e matriz mantidos como fotografia da auditoria.
- **Comando de teste:** `node --experimental-vm-modules --test --test-reporter=spec server/test/autorizacao.test.js`, executado na raiz do projeto. Requer o suporte de VM modules do Node disponível nesta execução; não foi instalada dependência.
- **Antes da correção:** 114 testes executados, 53 passaram e 61 falharam (exit 1), reproduzindo a ausência de autorização/allowlist. Não eram erros de preparação do teste.
- **Depois da correção:** 114 testes executados, 114 passaram, 0 falhas/cancelados/ignorados (exit 0).
- **Cobertura:** 66 negações (11 variantes de mutação × anônimo/aluno/professor/visitante/perfil desconhecido/sem perfil), incluindo perfil forjado por query/body/header; 11 autorizações administrativas com passagem ao SQL existente; 4 perfis válidos/normalização; 1 omissão de perfil para administrador; 10 perfis inválidos; 1 negação antes da validação de projeto mesmo sem banco; 21 leituras autenticadas preservadas (administrador/professor/aluno × 7 endpoints). Toda negação verifica zero consultas/transações e zero remoções de arquivos.
- **Sintaxe/imports/dependências:** `node --check` passou em server/index.js, server/test/autorizacao.test.js, mainPage/cadastro.js e login/login.js. `npm.cmd --prefix server --logs-max=0 ls --depth=0` terminou com exit 0; dependências diretas resolvidas. O carregamento de imports e os handlers reais do backend foram exercitados na suíte isolada.
- **Revisão de escopo:** revertendo apenas as mudanças de P02 em memória, o conteúdo reconstruído coincide com o SHA-256 original da auditoria. Isso confirma que queries, bootstrap e regras fora do objetivo permaneceram intactos; nada foi revertido no arquivo real.
- **Limitações:** nenhum MySQL real, migração, navegador, dispositivo móvel, envio de arquivo/e-mail ou persistência real foi executado. O script npm test continua sendo o placeholder preexistente; a suíte de P02 é executada pelo comando específico acima, sem antecipar P43.
- **Erros corrigidos:** bypass de perfil nas sete rotas de escrita e aceitação de perfis arbitrários no cadastro de contas. O achado E02 recebeu esta correção; isso não encerra todos os requisitos RF/RS que dependem de outros prompts.
- **Erros críticos fora do escopo:** seleção de identidade sem senha, credenciais inseguras/conta padrão (P01), ausência de filtro de vínculo (P07) e download público (P08) continuam conforme auditoria. Informados ao usuário; não foram corrigidos sob autorização de P02.
- **Teste manual necessário para P02:** não identificado; a decisão de autorização e a ordem antes de SQL foram verificadas via HTTP. Persistência real e usabilidade dos CRUDs continuam sem homologação e não são declaradas aprovadas.
- **Status:** Concluído em 18/10/2026 para o escopo P02. Checklist de P02 marcado; demais caixas preservadas.
- **Seleção seguinte:** P01 passa a Bloqueado por D11; P11 fica Pendente e liberado para seleção, sem execução. Aguardar nova autorização; não iniciar outra tarefa.

### 18/10/2026 — P11: validação do cadastro e edição de pessoas na API

- **Autorização:** o usuário pediu “proximo”, após a indicação explícita de P11. Somente P11 foi executado. P02 estava Concluído e é a dependência obrigatória deste escopo.
- **Estado antes da edição:** server/index.js mantinha SHA-256 `be732fab7d5ef631ffed8c27c8d6e4e74b42dce2956c0c65ee75d7b3d4a40fe1`, igual à entrega P02. POST exigia apenas nome e PUT aceitava vazios; a validação completa não estava implementada.
- **Contrato comum:** requireAuth → requireAdmin → validarPessoaPayload → handler/SQL em POST /cadastro-dashboard e PUT /usuarios/:id?perfil=aluno ou professor. Corpo precisa ser objeto JSON; perfil precisa pertencer explicitamente a aluno/professor. Chaves de protótipo não são aceitas como perfil.
- **Erros:** HTTP 400 com `{ erro: mensagemDoPrimeiroCampo, campos: { nomeDoCampo: mensagem, ... } }`. Todos os campos inválidos são informados em campos, sem consulta/transação/escrita parcial. A propriedade erro permanece uma string que o frontend atual consegue apresentar; P12 pode consumir os erros por campo.
- **Nome:** texto após trim, obrigatório nos dois perfis, até 255 caracteres; acentos/apóstrofos preservados. Caracteres de controle são recusados.
- **Matrícula:** obrigatória para aluno, opcional para professor; string de dígitos sem sinal/fração ou número inteiro não negativo seguro convertido para string. Limite 100 caracteres. Zeros à esquerda de entrada textual são preservados; não houve nova regra de unicidade nem identificador de login.
- **E-mail:** obrigatório para aluno e opcional para professor; até 255 caracteres, trim, validação de endereço simples local@domínio com rótulos válidos, sem espaços/controles ou pontos locais consecutivos. Não exige domínio institucional; valor/capitalização não foram alterados além de trim. Endereços com sintaxe especial de local-part entre aspas/Unicode ou domínios Unicode literais não fazem parte deste validador simples; futuras necessidades devem ser avaliadas no contrato, sem alegar validação universal de e-mail ou entrega de mensagem.
- **Telefone:** obrigatório para aluno e opcional para professor; texto de até 50 caracteres na entrada, aceitando 11 dígitos ou a apresentação (99) 99999-9999, com espaço após parêntese opcional. Persistência normalizada para (99) 99999-9999. Verifica formato; não verifica atribuição real de DDD/linha e não adiciona suporte a prefixo internacional. A máscara de digitação continua sendo P12.
- **Curso:** obrigatório somente para aluno. São aceitos os quatro cursos da ERS, com ou sem “Integrado em”. “Desenvolvimento de Jogos Digitais” e o legado “Programação de Jogos Digitais” são aliases do mesmo curso. O valor técnico de integração permanece “Programação de Jogos Digitais”, como usam atualmente radios/filtros; demais valores são “Energias Renováveis”, “Edificações” e “Eletrotécnica”. Comparação usa trim/NFC/case, sem acrescentar cursos novos. P12 pode corrigir o rótulo visual mantendo esse contrato compatível.
- **Turma:** obrigatória somente para aluno; 1º/2º/3º ano da ERS e a grafia legada 1°/2°/3° Ano são aceitas e retornam o valor de integração atual (por exemplo, 1° Ano). Limites de entrada curso 255 e turma 100 caracteres.
- **Professor / D10:** só nome é obrigatório; matrícula/e-mail/telefone opcionais são validados quando preenchidos. Opcionais omitidos/nulos/vazios continuam virando string vazia no POST/PUT, preservando a semântica integral existente do PUT. Curso/turma não são campos persistidos de professor. Não foi decidido identificador de conta, unicidade global ou novo obrigatório do professor.
- **Legados:** mapAlunoRow normaliza aliases conhecidos apenas no retorno, sem UPDATE de saneamento. Curso/turma desconhecidos são preservados na leitura para revisão; envio de novo cadastro/edição precisa usar opção válida. Não foram apagados, migrados nem visitados registros reais.
- **Arquivos de produção alterados:** `server/index.js` (validação central, normalizadores de curso/turma e consumo do payload validado nas duas rotas). As 43 literais SQL encontradas antes/depois permanecem iguais; as mudanças são validação/normalização dos parâmetros. Schema, permissões P02, credenciais, bootstrap, dependências e frontend não foram alterados.
- **Arquivos de teste:** criado `server/test/validacao-pessoas.test.js` (233 casos). Extraído `server/test/helpers/aplicacao.js` para compartilhar isolamento/fixtures HTTP com P02, evitando duplicação. `server/test/autorizacao.test.js` passou a importar o suporte; a tabela de casos e os testes P02 foram preservados integralmente.
- **Comando de testes:** `node --experimental-vm-modules --test --test-reporter=spec server/test/autorizacao.test.js server/test/validacao-pessoas.test.js`, na raiz. Bootstrap MySQL e operações de fs continuam substituídos por doubles; nenhum teste acessa banco ou arquivo de usuário.
- **Antes da implementação:** 347 casos executados, 119 aprovados e 228 falharam (exit 1), reproduzindo ausência de validação, mensagens por campo e normalização. P02 continuava aprovado.
- **Ajuste dos testes:** na execução intermediária, 339 passaram e 8 comparações de arrays falharam porque parâmetros vinham do contexto VM, com protótipos diferentes apesar de valores iguais. As asserções passaram a converter a coleção com Array.from antes de deepEqual, preservando a comparação estrita dos valores; não se alterou a API para contornar o teste.
- **Resultado final:** 347 testes, 2 suítes, 347 aprovados, 0 falhas/cancelados/ignorados (exit 0). Inclui erros simultâneos sem persistência parcial, formatos/tipos/limites em POST e PUT, perfil inválido, opcionais de professor, aliases da ERS e legados, matrícula com zeros, nomes acentuados e leituras sem saneamento destrutivo.
- **Outras verificações:** node --check passou no backend, teste de autorização, teste de validação, helper de testes, cadastro.js e login.js; npm --prefix server --logs-max=0 ls --depth=0 terminou com exit 0. Não houve instalação ou alteração de pacote.
- **Documentação atualizada:** controle e checklist. Matriz, erros e plano permanecem como fotografia da auditoria; conclusão de P11 não encerra integralmente todos os RF/RS vinculados.
- **Limitações e pendências:** MySQL real, persistência real, navegador/Android/iOS e máscara de formulário não testados nesta tarefa. D10 continua aberto para novos obrigatórios/identificador do professor. Riscos conhecidos de P01/P07/P08 não foram incluídos nesta implementação. npm test continua placeholder; usar o comando específico até a tarefa de suíte P43.
- **Status:** Concluído em 18/10/2026 no escopo de validação da API P11. Não foi identificado teste manual necessário para esses critérios; não se declara homologação da interface nem de dados reais.
- **Próximo prompt:** P12 — Validar formulário de aluno e aplicar máscara de telefone, Pendente e liberado para seleção. Nenhuma alteração de frontend ou execução de P12 foi feita; aguardar nova autorização.

### 18/10/2026 — P12: formulário de aluno e máscara de telefone

- **Autorização:** o usuário pediu “proximo prompt” após a indicação de P12. P11 estava Concluído; somente P12 foi implementado.
- **Estado conferido:** cadastro.js mantinha o SHA-256 original da auditoria (`55876b2eb7d2579acc94d80df8f0b9b891140d69282d898088a4b58dff165ad9`). submitAluno validava só nome e os telefones não tinham máscara. O contrato central de P11 foi usado como referência.
- **Validação anterior ao envio:** validarFormularioPessoa é usado por cadastro/edição de aluno e professor. Aluno precisa de nome, matrícula inteira não negativa em dígitos, e-mail válido, telefone completo, curso e turma válidos. Tipos de controle/limites são verificados antes de fetch; matrícula textual preserva zeros. Há alert e foco no campo/grupo que precisa de correção. Dados inválidos não são enviados nem limpos.
- **Professor:** somente nome continua obrigatório; opcionais preenchidos seguem os formatos da API P11. Nenhum identificador ou obrigatório novo de D10 foi criado.
- **Máscara:** formatarTelefonePessoa e configurarMascaraTelefone operam em aluno/professor. Formatação progressiva (99) 99999-9999, com posição do cursor baseada nos dígitos, seleção/substituição, Backspace/Delete que atravessam a pontuação e limpeza completa. editUser formata também o telefone legado ao carregar a edição. ClearForm continua funcionando com máscara sem estado adicional.
- **Entradas inválidas:** dígitos excedentes e caracteres inesperados não são truncados/removidos para fabricar outro número válido. Permanecem visíveis e bloqueiam o envio. Telefone incompleto é rejeitado. Nenhum acesso ao clipboard do usuário foi implementado.
- **HTML:** inputmode numérico para matrícula/telefone, type=tel, limites coerentes com a API, indicação dos obrigatórios e labels associados; grupos de curso/turma podem receber foco para apontar erro. O formato atual de valor das opções foi preservado.
- **Curso:** rótulo visual “Integrado em Desenvolvimento de Jogos Digitais”; listagem e texto de curso na seleção de alunos usam o mesmo nome de exibição. Valor técnico “Programação de Jogos Digitais” continua em radios, filtro e payload, compatível com P11 e registros legados. Não houve migração ou alteração de dados para renomear curso.
- **Arquivos de produção alterados:** `mainPage/cadastro.js` e `mainPage/menuCadastro.html`. Backend, SQL, CSS, dependências, autenticação e navegação geral permaneceram intactos. Não foram antecipados P03/P13/P14/P44.
- **Arquivos de teste criados:** `server/test/formulario-pessoas.test.js` e `server/test/helpers/navegador.js`. DevTools nativo com Node e Chrome/Edge local, sem biblioteca instalada. Usa perfil temporário exclusivo, navegação headless e fechamento somente do processo criado pelo teste. A limpeza recursiva verifica caminho absoluto, diretório temporário pai e prefixo gerado antes de remover somente esse perfil de testes.
- **Isolamento:** o frontend HTML/JS real é servido pelo Express isolado; chamadas ao endereço fixo localhost:3000 são interceptadas pelo DevTools e encaminhadas à instância de teste em porta efêmera com sessão administrativa fictícia. Nenhuma requisição é enviada ao possível servidor real da porta 3000. Fontes externas são neutralizadas no teste. Banco e fs são doubles; os handlers/validação de P11 são reais. O proxy é exclusivo do teste, sem mudar API/CORS da aplicação.
- **Comando de navegador:** `node --experimental-vm-modules --test --test-reporter=spec server/test/formulario-pessoas.test.js`. Chrome/155.0.8059.80, viewport desktop 1280×900; **28 testes, 28 aprovados, 0 falhas/ignorados** (exit 0). O teste requer Chrome/Edge instalado ou CHROME_BIN e Node com WebSocket/VM modules; se não houver navegador, a suíte é explicitamente ignorada, o que não comprova aprovação.
- **Cobertura no navegador:** 14 entradas inválidas sem requisição de escrita; POST válido; GET/edição e PUT válidos; digitação dígito a dígito; cursor no meio; Backspace/Delete em pontuação; seleção/inserção em bloco e limpeza; bloqueio de excesso/caracteres inesperados; rótulo/filtro de curso legado; limpar/voltar; professor com telefone opcional e edição. Edição inválida de aluno preserva os dados e só envia PUT após correção. Exceções JavaScript e erros do proxy/DevTools foram monitorados e não ocorreram.
- **Colagem simulada:** Input.insertText insere blocos na seleção real do campo e aciona os eventos nativos de edição/input; a máscara lê valor e seleção, sem depender de clipboardData. Não houve leitura/escrita do clipboard do sistema operacional nem alegação de teste manual de copiar/colar do usuário.
- **Regressões:** `node --experimental-vm-modules --test --test-reporter=spec server/test/autorizacao.test.js server/test/validacao-pessoas.test.js`: **347 testes, 347 aprovados**, 0 falhas/ignorados (exit 0). Total desta entrega: **375 testes aprovados** em comandos separados. Não foram criados testes com dados reais.
- **Outras verificações:** node --check passou em cadastro.js e nos dois arquivos novos de teste. A versão final do script também foi carregada/executada no Chrome sem exceções. Conferência de IDs: nenhum duplicado e nenhuma referência literal getElementById ausente. Os imports novos são módulos nativos/helpers já exercitados; nenhum pacote/lockfile foi alterado.
- **Limitações:** sem MySQL real, persistência real, Android/iOS, clipboard do SO ou teste manual humano. Usabilidade/compatibilidade geral continuam em P44/D12. Os critérios funcionais de P12 foram exercitados por automação em navegador; não se declara homologação do sistema inteiro.
- **Documentação atualizada:** este controle e a caixa de P12 no checklist. Plano, prompts, decisões, erros e matriz preservados como fotografia da auditoria.
- **Status:** Concluído em 18/10/2026 no escopo P12. Não há teste manual obrigatório identificado para os critérios automatizados acima; nenhuma confirmação humana de testes foi presumida.
- **Próximo prompt:** nenhum integralmente liberado. P01 permanece Bloqueado por D11; antes de executá-lo, definir o procedimento de migração/redefinição de credenciais legadas e obter nova autorização. Não avançar para P13 nem implementar contenção parcial de P01 por conta própria.

### Modelo para registrar cada execução futura

Copiar este modelo somente quando houver uma execução autorizada. Não preencher com resultados esperados ou com testes históricos da auditoria.

```text
Data: DD/MM/AAAA
PROMPT EXECUTADO: PXX — Nome
Autorização e escopo: pedido do usuário que iniciou a tarefa
Dependências conferidas: tarefas concluídas, decisões e evidências
Código atual: mudanças relevantes em relação à auditoria
ALTERAÇÕES: comportamento implementado
ARQUIVOS MODIFICADOS: caminhos e finalidade das alterações
TESTES: comandos, ambiente, fixtures, resultados efetivos
ERROS: corrigidos, encontrados, pendentes e regressões
Teste manual: não necessário / pendente / confirmação do usuário e data
STATUS: Bloqueado / Em desenvolvimento / Aguardando teste / Concluído
Critérios não atendidos e impedimentos: descrição e condição para liberar
Data de conclusão: preencher apenas se Concluído
Checklist 06 atualizado: caixa da tarefa, somente se Concluído
PRÓXIMO PROMPT: código e nome da próxima tarefa liberada ou impedimento
Parada: aguardar nova autorização; não iniciar outra tarefa
```

### 18/10/2026 — P01: autenticação e proteção das credenciais

- **Autorização e decisão:** em continuidade ao pedido “proximo”, o usuário escolheu “1”: preservar as senhas atuais convertendo seu armazenamento para hashes. D11 foi registrada como parcialmente respondida em 07; contatos de recuperação, transporte e correspondência conta/pessoa não foram definidos. Executado somente P01; documentos 04/05 e a ERS não foram reescritos.
- **Análise relacionada:** o código ainda comparava texto puro, criava conta previsível, continha segredos e aceitava identidade por seleção. Nenhuma evidência de implementação prévia integral de P01. Corrigidos esses comportamentos exclusivamente neste escopo.
- **Mudanças:** módulos locais de configuração e credenciais, scrypt versionado com salt exclusivo e comparação segura; sem fallback de texto puro; cadastro grava hash; login uniforme em falhas, regenera/salva sessão; sessão anterior invalidada; limite por usuário/IP com política documentada. /pessoas e /sessao/pessoa retornam 410 sem enumeração, SQL ou sessão. Sessões antigas de origem pessoa são recusadas. Bootstrap previsível removido; configuração obrigatória por ambiente; erros de autenticação/SQL/configuração não expõem valores. Rotação das antigas credenciais no ambiente real não executada.
- **Migração:** CLI separado, padrão dry-run, --apply explícito; transação InnoDB e SELECT FOR UPDATE; preserva hashes já convertidos, nomes, perfis e as mesmas senhas; rollback integral em erro ou credencial incompatível. Sem DDL, redefinição ou migração automática no início. Não altera pessoas, projetos ou autoria. Procedimento de parada, backup protegido, simulação, aplicação e retorno operacional em server/AUTENTICACAO.md.
- **Arquivos alterados/criados:** .gitignore; server/index.js; server/configuracao.js; server/credenciais.js; server/migracao-credenciais.js; server/scripts/migrar-credenciais.js; server/.env.example; server/AUTENTICACAO.md; server/test/helpers/aplicacao.js; server/test/helpers/mysql-temporario.js; server/test/autenticacao.test.js; server/test/migracao-credenciais.test.js; docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md; 07-DUVIDAS-DA-ERS.md; este controle. Sem alteração de dependências, HTML/JS do frontend ou regras acadêmicas.
- **Testes realmente executados:** node --experimental-vm-modules --test --test-reporter=spec server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js — 405 aprovados, 0 falhas/cancelamentos/ignorados. 24 novos testes de autenticação/configuração; 6 de MySQL real; 347 regressões HTTP; 28 Chrome. node --check dos cinco arquivos de execução novos/alterados aprovado.
- **Evidências de persistência:** MySQL 8.0.46 local, em instância filha descartável com --no-defaults, porta/diretório próprios; simulação sem alterações, conversão e repetição idempotente, preservação de senha com espaços/Unicode e perfis, rollback após erro SQL, aborto por hash inválido, rejeição de MyISAM e login HTTP de conta migrada. O servidor temporário foi encerrado e somente seu diretório validado removido. Não foi acessado o serviço ou diretório de dados do projeto. Express/sessões e Chrome reais; demais regressões usam DB/arquivos simulados.
- **Erros encontrados e corrigidos:** uma edição inicial duplicou parte do backend por incompatibilidade de encoding no pipe do PowerShell; node --check identificou declaração duplicada. A duplicação foi removida, o pipe passou a UTF-8 e toda a suíte final foi aprovada. Os avisos de VM experimental e thenables entre contextos dos testes não são falhas da aplicação; permanecem limitações do isolamento de testes.
- **Limitações:** o banco real ainda exige aplicação explícita da migração e configuração local antes de usar este backend. Nenhuma implantação foi realizada. A seleção sem senha deixa de funcionar intencionalmente; integração da identidade/vínculos na interface é P06/P13, não antecipada. Limites e sessões em memória são por processo, documentados; produção/CORS/HTTPS/store continuam P03/D12. Download público e ausência de filtros de vínculo seguem P07/P08. Não declarar RF01/RS04 inteiros atendidos sem essas camadas. npm test permanece placeholder de P43.
- **Status:** Concluído no escopo de P01; sem teste manual indispensável aos critérios exercitados. Isso não significa migração do banco real nem homologação de produção.
- **Próximo prompt:** P04 — Organizar instalação e migrações do banco, liberado para seleção porque P03 depende de D12. Nenhum outro prompt executado; aguardar nova autorização.

### 18/10/2026 — P04: instalação e migrações do banco

- **Autorização:** pedido “proximo” após a conclusão de P01. Prompt P04 integralmente lido e pré-requisito P01 confirmado. Nenhuma decisão de autoria/integridade inferida; P03 continua impedido por D12. Executado somente P04.
- **Constatação relacionada:** connectDB ainda criava seis tabelas em cada inicialização e ensureColumn ocultava toda falha; documentos dependia de scripts separados, inclusive um que atribuía aluno aos legados. Não havia histórico de esquema. P04 não estava previamente implementado.
- **Implementação:** schema base e documentos em versões 001/002 imutáveis com manifesto/checksum SHA-256, histórico contínuo, lock por banco e validação de estrutura. Instalação vazia e adoção explícita de legado compatível, com somente as adições opcionais conhecidas. Migração é comando separado; partida apenas verifica histórico/versão/colunas/engine e fecha conexão em erro. Diagnósticos sanitizados e código 1 em falhas. Scripts db:migrate/db:check acrescentados; npm test permanece placeholder, sem concluir P43.
- **Preservação:** sem migração automática ou acesso ao banco real. Sem alteração de senhas, pessoas, projetos ou arquivos existentes. Perfil ausente de autor legado recebe NULL, sem presumir aluno; IDs, valores e FKs existentes preservados. A FK antiga de autoria não é removida. P09/P10 e demais regras acadêmicas não antecipados. Scripts SQL antigos mantidos como referência histórica, fora do fluxo recomendado.
- **Arquivos alterados/criados:** server/index.js; server/package.json; server/banco/esquema.js; server/banco/migracoes.js; server/banco/migrador.js; server/banco/conexao.js; server/banco/versoes/001-base.js; server/banco/versoes/002-documentos.js; server/scripts/banco.js; server/BANCO-DE-DADOS.md; server/AUTENTICACAO.md; server/test/esquema.test.js; server/test/helpers/aplicacao.js; server/test/helpers/mysql-temporario.js; docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md e este controle. Sem dependências novas, alteração de ERS/04/05/07 ou frontend.
- **Comando final executado:** node --experimental-vm-modules --test --test-reporter=spec server/test/esquema.test.js server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js — 419 aprovados, 0 falhas/cancelamentos/ignorados. Sintaxe de index.js, esquema.js, migracoes.js, migrador.js, conexao.js e scripts/banco.js aprovada.
- **Evidências P04:** 14 testes em instância MySQL 8.0.46 descartável real: instalação vazia sem conta padrão, documentos no contrato da API, segunda execução sem duplicação, versão 1→2 com dados preservados, adoção de legado sem histórico e preservação de autoria desconhecida/FK, coluna/engine/checksum/histórico incompatíveis, permissão negada real, verificação de partida e reinício com conta sem DDL, fechamento da conexão em falha, interrupção parcial e retomada, lock concorrente e CLI com saída sanitizada/código 1. Instância inicializada com --no-defaults, porta própria, conta de teste própria e diretório temporário validado antes da remoção. Nenhum processo filho MySQL das suítes permaneceu ativo ao concluir.
- **Regressões:** 405 casos anteriores aprovados, incluindo 6 de persistência de senhas em outra instância descartável e 28 de Chrome. Os demais testes HTTP mantêm DB/arquivos simulados. Não chamar esse conjunto de homologação E2E em produção.
- **Erros encontrados/corrigidos:** a primeira verificação confundia DATETIME com DATE pela ordem das alternativas da expressão de tipo. Nove testes revelaram a falha; corrigida a ordem, os 14 casos P04 e a suíte final passaram. A chave do lock foi limitada por hash, e o contrato é verificado antes de registrar a última versão. Nenhum erro pendente nos critérios exercitados.
- **Limitações operacionais:** DDL MySQL tem commit implícito; falha pode deixar passos parciais sem marcar a versão. A retomada é revalidada/idempotente, sem promessa de rollback DDL. Aplicação e gravadores externos devem estar parados; backup/restauração e comandos estão em server/BANCO-DE-DADOS.md. Não há downgrade/reparo destrutivo automático. Estruturas legadas incompatíveis exigem análise explícita. Aplicação real do esquema, migração das senhas e configuração de implantação não foram realizadas. A partida foi verificada pela função real de conexão, sem executar o processo HTTP na porta 3000.
- **Status:** Concluído no escopo P04. Nenhum teste manual indispensável identificado; não representa implantação nem torna RF44/RF47 integralmente atendidos.
- **Próximo prompt:** P05 — Isolar transações por conexão de pool, Pendente e liberado para seleção. Não iniciado; aguardar nova autorização.

### 18/10/2026 — P05: isolamento transacional por conexão de pool

- **Autorização:** pedido “proximo” após P04. Prompt P05 integralmente lido; esquema versionado e ambiente MySQL descartável confirmados. Executado exclusivamente P05. D10/D11 não foram preenchidos por presunção e P06 não foi implementado.
- **Constatação relacionada:** index.js ainda usava uma única conexão global para todas as consultas e BEGIN/COMMIT/ROLLBACK das quatro operações. A transação poderia intercalar comandos de outra requisição; P05 não estava implementado.
- **Alterações:** pool mysql2 na aplicação, limite operacional de 10 conexões e fila de 100; aquisição única por transação; conexão passada explicitamente às sincronizações de professores/alunos. POST/PUT/DELETE de projeto e DELETE de pessoa usam o mesmo executor. Queries de leitura e instruções únicas seguem pool.query com aquisição automática. Verificação P04 na partida usa conexão adquirida/devolvida; migrações continuam com conexão dedicada, sem alterar versões publicadas.
- **Falhas e recursos:** BEGIN/COMMIT/ROLLBACK e liberação centralizados; finally devolve a conexão saudável ou destrói a insegura em perda de conexão, BEGIN/COMMIT incerto ou rollback malsucedido. Sem reconexão/repetição da transação. Erros transacionais mantêm contratos HTTP e logs genéricos, sem SQL/parâmetros. Tratamento de commit incerto e substituição de conexão somente para operações futuras documentados em server/TRANSACOES.md.
- **Correção adicional necessária ao cenário concorrente:** teste simultâneo revelou ER_LOCK_DEADLOCK nos DELETEs de faixas vazias de vínculos antes da criação. Em projeto recém-inserido, as sincronizações agora apenas inserem participantes, evitando esses DELETEs redundantes; na edição a substituição continua igual. Não foram alteradas regras de equipe/participação, tipos/IDs ou integridade de P10. Uma barreira reproduziu o deadlock antes da correção; a regressão final exige duas criações abertas simultâneas com sucesso.
- **Arquivos alterados/criados:** server/index.js; server/banco/conexao.js; server/banco/transacao.js; server/TRANSACOES.md; server/BANCO-DE-DADOS.md; server/test/transacoes.test.js; server/test/helpers/aplicacao.js; server/test/helpers/mysql-temporario.js; docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md e este controle. Sem mudança de dependências, schema/versionamento, senha, frontend, 04/05/07 ou ERS.
- **Comando final executado:** node --experimental-vm-modules --test --test-reporter=spec server/test/transacoes.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js — 439 aprovados, 0 falhas/cancelamentos/ignorados. node --check de index.js, banco/conexao.js, banco/transacao.js e test/transacoes.test.js aprovado.
- **Novos testes:** 7 testes com doubles para sucesso e falhas de aquisição, BEGIN, operação, COMMIT, ROLLBACK e perda de conexão; 13 em MySQL 8.0.46 descartável real. Duas requisições usam IDs distintos; enquanto A fica aberta, B confirma/reverte sem tornar A visível nem desfazer seus dados. Triggers reais provocam falhas intermediárias e confirmam rollback de projeto/participantes/pessoa. CRUD real de projeto e dos dois perfis de pessoa aprovado. KILL CONNECTION na própria instância confirma remoção da conexão, ausência de gravação parcial, ausência de retry e sucesso da requisição seguinte. Pool encerrado e partida inválida falham de forma controlada; conta somente leitura verifica o esquema sem DDL.
- **Evidência de devolução:** após cada caso real, todas as dez conexões são adquiridas simultaneamente e devolvidas, sem conexões reservadas indevidamente. Suítes P01/P04/P05 usam instâncias separadas com --no-defaults, portas próprias e diretórios temporários com prefixo validado. Pools e processos filhos encerrados; não foi usado banco/serviço/conta real do projeto. Os demais testes HTTP continuam com mocks; Chrome e 33 testes totais de persistência usam os recursos reais indicados.
- **Erros e limites:** falha inicial intermitente de criação simultânea foi isolada com barreira e diagnosticada como deadlock; corrigida sem retry. A suíte final inteira passou. Deadlock/timeout por disputa legítima de mesmos dados pode ainda exigir nova operação após verificar estado; não há garantia de sucesso de toda transação concorrente. Falha no COMMIT pode ter resultado incerto e não é reproduzida automaticamente. npm test permanece placeholder de P43. Não houve implantação, migração ou consulta no banco do projeto.
- **Status:** Concluído no escopo de P05, sem teste manual indispensável identificado. Não declarar requisitos acadêmicos completos nem antecipar identidade/integridade/download de outras tarefas.
- **Próximo prompt:** P10 — Validar relações e integridade dos projetos, Pendente e liberado para seleção. P06 passa a Bloqueado por D10/D11. Nenhuma outra tarefa iniciada; aguardar nova autorização.

### 18/10/2026 — P10: relações e integridade dos projetos

- **Autorização:** pedido “proximo prompt” após P05. Prompt P10 integralmente lido; P04/P05 e ambiente descartável confirmados. Regras atuais de equipe mantidas: pelo menos um professor/aluno em POST/PUT e inclusão administrativa, sem decidir D09. Executado somente P10; identidade P06/D10/D11 não antecipada.
- **Constatação relacionada:** normalização convertia valores com Number e descartava entradas inválidas; faltava checar existência de todos os membros e as tabelas de vínculo/responsável não possuíam FKs. P10 não estava previamente implementado.
- **API:** módulo compartilhado valida cada ID como inteiro positivo no intervalo INT, aceitando número ou texto decimal; rejeita tipos inválidos, zero/negativo/decimal, exponencial/hex em texto, valores fora de faixa, listas inválidas e duplicatas após normalização. Nada é filtrado silenciosamente. Fallback singular professor_id preservado; quando enviado com lista, deve corresponder ao primeiro professor, como na interface atual. PUT valida o ID, confirma/bloqueia o projeto e só então confirma membros. Existência de professores/alunos é consultada com FOR SHARE em ordem estável na mesma conexão da transação, antes das gravações; erros controlados provocam rollback sem SQL de mutação. Edição mantém participantes fornecidos sem perdas parciais.
- **Banco:** versão 003 acrescentada sem reescrever 001/002. Cinco FKs RESTRICT para os pares projeto/professor/aluno e projeto.professor_id, além da verificação/adição de UNIQUE dos pares quando ausente. NULL do responsável preservado; nenhuma nova cascata. Restrições equivalentes sob outros nomes preservadas; FKs compostas/divergentes ou para outro schema recusadas para revisão. A verificação de partida inspeciona FKs/índices, não apenas o histórico. As rotas existentes de exclusão continuam anulando/removendo referências em transação.
- **Legados:** db:diagnose acrescentado, com somente SELECT e contagens por relação/grupo duplicado, sem IDs/linhas/segredos. Antes dos ALTERs da versão 003, todas as relações são diagnosticadas e todas as restrições existentes conferidas. Órfãos/duplicatas ou FK divergente interrompem sem marcar 003 e sem apagar, deduplicar ou reatribuir dados. DDL parcial é retomável por inspeção de restrições já aplicadas. Não houve consulta, diagnóstico ou migração no banco do projeto.
- **Arquivos alterados/criados:** server/index.js; server/projetos-validacao.js; server/banco/integridade-projetos.js; server/banco/migracoes.js; server/banco/migrador.js; server/banco/versoes/003-integridade-projetos.js; server/scripts/banco.js; server/package.json; server/INTEGRIDADE-PROJETOS.md; server/BANCO-DE-DADOS.md; server/test/integridade-projetos.test.js; server/test/esquema.test.js; server/test/helpers/aplicacao.js; server/test/helpers/mysql-temporario.js; docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md e este controle. Sem alteração de frontend, dependências, versões 001/002, 04/05/07 ou ERS. Testes P04 adaptados à nova versão esperada 003, mantendo os cenários de instalação/atualização e preservação.
- **Comando final executado:** node --experimental-vm-modules --test --test-reporter=spec server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js — 581 aprovados, 0 falhas/cancelamentos/ignorados. node --check de index.js, projetos-validacao.js, banco/integridade-projetos.js, banco/migrador.js, banco/migracoes.js, banco/versoes/003-integridade-projetos.js e scripts/banco.js aprovado.
- **Testes novos:** 118 casos HTTP/Express/sessão real com DB simulado para formatos/duplicatas/ausências, fallback legado, responsável contraditório, corpo e ID de edição inválidos e rollback sem gravação quando membro não existe. 24 casos em duas instâncias MySQL 8.0.46 descartáveis reais: múltiplos membros, preservação da equipe na edição, referências inexistentes, falha intermediária real por trigger, SQL órfão/duplicado recusado, exclusão consistente, FK removida detectada, migração 002→003/idempotência com snapshots preservados, cinco categorias de órfãos legados, duplicatas, índice ausente, FK divergente/equivalente, retomada parcial e CLI de diagnóstico com usuário somente leitura.
- **Regressões:** 439 casos anteriores aprovados, incluindo concorrência/isolamento P05, persistência de senhas P01, migração/partida P04, autorização P02, validação P11 e 28 testes Chrome P12. Total de persistência real 57. As instâncias foram iniciadas com --no-defaults, portas/diretórios próprios e fixtures; nenhum processo MySQL filho das suítes permaneceu ativo após concluir. Nenhuma evidência com mock foi descrita como persistência real.
- **Erros encontrados/corrigidos:** na primeira execução, o tratamento genérico de passos com coluna confundia FKs com adições de coluna e pulava seus ALTERs; o verificador detectou a restrição ausente e impediu registrar a versão 003. O executor passou a distinguir os tipos de passo; os testes reais e a suíte final inteira passaram. O alias de metadados também foi tornado explícito. Nenhum erro pendente nos critérios exercitados.
- **Limitações e operação:** o backend exige esquema 003; o banco real permanece sem aplicação desta migração. Diagnóstico em cópia, backup, parada de gravadores e comandos estão em server/INTEGRIDADE-PROJETOS.md. DDL não tem rollback transacional; falha parcial deixa 003 pendente e admite retomada, sem remoção automática de restrições. Corrigir legados inconsistentes exige análise/proposta/autorização, nunca limpeza presumida. FKs validam referências existentes, sem resolver identidade de credenciais, autoria, download ou participação ainda pendentes. npm test permanece placeholder de P43.
- **Status:** Concluído no escopo P10, sem teste manual indispensável identificado. Isso não representa aplicação/homologação do banco real nem encerramento integral de requisitos que dependem das demais camadas.
- **Próximo prompt:** P15 — Respostas corretas para recursos ausentes e erros da API, Pendente e liberado para seleção. P03/P06 seguem Bloqueados; nenhum outro prompt iniciado. Aguardar nova autorização.

### 18/10/2026 — P15: recursos ausentes e erros da API

- **Autorização e análise:** pedido “proximo prompt” após P10; texto P15 integralmente lido, P02/P05 confirmados. PUT/DELETE de pessoa e DELETE de projeto ainda respondiam sucesso sem registro; DELETE de documento não conferia affectedRows. Handler geral devolvia 400 para qualquer falha. P10 já cobria ausência na edição de projeto, mas P15 completo não estava implementado. Executado somente P15; P14 é integração, não revisão de frontend autorizada neste escopo.
- **Existência/rollback:** IDs de pessoa/projeto/documento validados após as mesmas guardas de permissão, antes de SQL. PUT de pessoa confirma/bloqueia o registro em transação e mantém sucesso com valores iguais/affectedRows zero. DELETE de pessoa/projeto confirma antes de mutações e confere affectedRows da exclusão final. Documento usa conexão dedicada, bloqueio/conferência e solicita remoção física somente após commit; ausência, rollback ou commit incerto não removem arquivo. Consulta de documentos confirma o projeto. Recursos ausentes e rotas desconhecidas retornam 404 JSON. Perfis de pessoa são parâmetros fechados, sem refazer filtros de autorização.
- **Erros:** módulo compartilhado distingue validação 400, conflitos SQL 409 e erro interno 500, sem refletir mensagem/stack/SQL originais. Preservados 401/403/410/429 e estados existentes da autenticação. Parser/Multer e URI inválida recebem estados seguros específicos; IO desconhecido é interno. Logs internos contêm evento/operação fixos, sem objetos do driver, corpo ou parâmetros. Após cabeçalhos, novo erro sanitizado é encaminhado ao Express para fechar conexão sem nova resposta. Logout não anuncia sucesso se a destruição de sessão falhar.
- **Arquivos alterados/criados:** server/index.js; server/erros-api.js; server/RESPOSTAS-API.md; server/test/respostas-api.test.js; server/test/respostas-api-navegador.test.js; server/test/helpers/aplicacao.js; server/test/helpers/mysql-temporario.js; server/test/autenticacao.test.js; server/test/validacao-pessoas.test.js; docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md e este controle. Sem mudança de frontend, dependências, esquema/migrações, 04/05/07 ou ERS. Testes antigos preservam cenários: P11 conta mutações em vez de limitar consultas após verificação de existência; rota de fixture P01 é montada antes do fallback 404 somente na cópia em memória dos testes.
- **Comando final executado:** node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js — 717 aprovados, 0 falhas/cancelamentos/ignorados, 15 suítes. Sintaxe de index.js, erros-api.js e dos dois novos arquivos de teste verificada. O log redirecionado pelo PowerShell foi lido como UTF-16LE para conferir os contadores antes de atualizar o controle.
- **Casos P15:** 96 HTTP/Express/sessão real com DB/arquivos simulados para ausência, IDs malformados, edição idêntica/affectedRows zero, exclusão zero, conflito de unicidade/FK/deadlock/timeout, SQL/commit/rollback, registro sanitizado, erro após resposta iniciada, parser/Multer/IO, URI inválida e desconhecidos. 9 casos com MySQL 8.0.46 descartável real/esquema 003: edição real/idêntica/ausente dos dois perfis e projeto, exclusão/repetição de pessoa/projeto/documento, conflito por FK sem remoção parcial e trigger de erro preservando pessoa. Remoções físicas permanecem doubles mesmo nessa suíte real.
- **Interface/regressões:** 31 Chrome reais com HTML/JS originais e respostas controladas por DevTools. 400/403/404/409/500 preservam campos/equipe, avisam erro e não atualizam exclusão como sucesso; 401 redireciona ao login. Exclusões mantêm mensagem genérica existente. Nenhum HTML/JS alterado, P13/P14 não antecipados. Os 581 cenários anteriores passaram. Total 66 persistência real e 59 Chrome, sem alegação de E2E navegador/MySQL real.
- **Infraestrutura corrigida:** execução irrestrita sobrecarregou DevTools e cancelou casos de navegador; isoladamente eles passavam. Limitada concorrência entre arquivos a 2, preservando concorrência dentro de P05. Outra execução deixou processo auxiliar MySQL Windows com diretório bloqueado (EBUSY), cancelando 12 casos P10. Helper passou a usar --no-monitor --console e prontidão até 60s para controlar diretamente o servidor. A execução final inteira passou com esses ajustes; nenhuma falha funcional pendente nos critérios exercitados.
- **Revisão automática/limpeza:** comando combinado para encerrar/remover a instância temporária defeituosa foi rejeitado como bloqueado pela política, sem detalhamento. Alternativa mais restrita confirmou PID 17708, porta 56777 e diretório labhist-p10-Jk2vqy antes de encerrar somente esse processo com Stop-Process. O diretório antigo em TEMP foi preservado; não se tentou contornar a rejeição por outro método de exclusão. Instâncias da execução final encerradas e diretórios próprios limpos normalmente. Nenhum processo MySQL das suítes permaneceu ativo; nenhum serviço/banco/dado real do projeto foi acessado.
- **Limites:** coordenação geral de arquivos/falhas de unlink permanece P17. Esquema 003 e aplicação real continuam separados; sem migração nesta tarefa. Não foram implementados identidade, filtro de vínculo, download, P14 ou homologação Android/iOS/produção. npm test permanece placeholder de P43. Guia operacional em server/RESPOSTAS-API.md.
- **Status:** Concluído no escopo P15, sem teste manual indispensável identificado. Resíduo temporário preservado conforme a rejeição documentada não é dado de produção nem impedimento funcional.
- **Próximo prompt:** nenhum integralmente liberado. P18 passa a Bloqueado até acordar tratamento dos status legados, conforme seu próprio texto. P03/P06 e demais decisões continuam pendentes; P43 não deve ser concluído pela infraestrutura destas tarefas. Nenhum outro prompt iniciado.

### 18/10/2026 — P06: contas vinculadas às pessoas

**PROMPT EXECUTADO:** P06 — Vincular credenciais a alunos e professores.

**ALTERAÇÕES:** usuário único; conta/pessoa/vínculo transacionais; vínculo explícito e relatório administrativo; CLI de mapa revisado (dry-run por rollback, --apply explícito); login acadêmico sem vínculo recusado; conta preservada e bloqueada ao remover pessoa; edição conserva vínculo; campos opcionais de acesso nos formulários. Migração 004 acrescenta UNIQUE/FKs/CHECK; 001–003 imutáveis.

**ARQUIVOS MODIFICADOS:** server/index.js, identidades.js, banco/migracoes.js, banco/migrador.js, banco/identidade-esquema.js, banco/versoes/004-identidade.js, scripts/vincular-contas.js, IDENTIDADE-ACADEMICA.md; mainPage/cadastro.js e menuCadastro.html; testes de identidade, formulário, autenticação, autorização, esquema, integridade e helpers; documentos 04/05 (somente nota da sequência aprovada), 06/07/08.

**TESTES:** 734/734 aprovados, 16 suítes, zero falhas/cancelamentos/ignorados; comando: node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec seguido dos onze arquivos server/test/{identidades,formulario-pessoas,esquema,autenticacao,autorizacao,validacao-pessoas,integridade-projetos,transacoes,respostas-api,respostas-api-navegador,migracao-credenciais}.test.js. 80 casos MySQL descartável e 62 Chrome no conjunto; novos 14 MySQL + 3 Chrome. Sintaxe verificada. Log final temporário labhist-p06-final.log.

**ERROS:** normalização da CHECK_CLAUSE corrigida; remoção de vínculo inicialmente colocada na edição foi detectada/corrigida e recebeu regressão explícita (editar conserva, excluir desabilita); asserção antiga adaptada aos eventos de transação. Testes antigos agora exigem pessoa_id em contas acadêmicas; papéis inválidos são injetados somente na fixture adversarial, sem autenticação de produção. A execução anterior teve 661/663 e não foi considerada aprovação.

**STATUS:** Concluído no escopo P06. Sem MySQL/dados/arquivos do projeto nem migração real. Persistência real refere-se somente à instância descartável; navegador usa DB doubles. E-mail/recuperação e autoria legada P09 continuam pendentes.

**PRÓXIMO PROMPT:** P13 — sessão na interface, iniciado sob autorização do lote.

### 18/10/2026 — P13: identidade da sessão na interface

**PROMPT EXECUTADO:** P13 — Usar sessão do servidor como identidade na interface.

**ALTERAÇÕES:** GET /sessao com dados mínimos/no-store e revalidação de conta/pessoa; interface oculta até confirmar identidade, sem perfil administrativo padrão/storage ou seletor de pessoa; seleção visual de perfil precisa corresponder à conta; logout confirmado e estado limpo, 401 interrompido e cache de navegação revalidado. Enumeração global de autores removida da interface.

**ARQUIVOS MODIFICADOS:** server/index.js, identidades.js, SESSAO-INTERFACE.md; mainPage/cadastro.js, menuCadastro.html, menu.css; login/login.html, login.js, login.css; testes sessao-interface, autenticação, identidade e fixtures/esperas dos testes Chrome anteriores; documentos 06/08.

**TESTES:** 105/105, 6 suítes, zero falhas/cancelamentos/ignorados. Comando node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/sessao-interface.test.js server/test/formulario-pessoas.test.js server/test/respostas-api-navegador.test.js server/test/autenticacao.test.js. Novos: 10 HTTP e 9 Chrome; Express/cookies/páginas reais e DB simulado. Log labhist-p13-final.log. Não equivale a MySQL E2E nem matriz D12 homologada.

**ERROS:** primeira execução 103/105 por timeout de navegação inicial do Chrome; fontes externas passaram a ser bloqueadas diretamente na fixture, sem alterar produto; confirmação isolada 19/19 e conjunta 105/105. Seleção incompatível agora é recusada explicitamente; caso antigo que antes ignorava perfil foi atualizado e ganhou testes negativos nos três papéis.

**STATUS:** Concluído em 18/10/2026 no escopo P13. Sem implantação/alteração no banco real; P03 e P07/P08 continuam separados.

**PRÓXIMO PROMPT:** P14 — Tratar respostas HTTP antes de atualizar a interface, iniciado no lote.

### 18/10/2026 — P14: erros antes de alterar a interface

**PROMPT EXECUTADO:** P14 — Tratar respostas HTTP antes de atualizar a interface.

**ALTERAÇÕES:** assets/api.js compartilhado entre login/painel, credentials, status e JSON centralizados; 401 interrompe/limpa/redireciona; falhas 5xx têm mensagem segura; validação de objetos/listas e confirmação de mutações; listas/formulários/IDs preservados nas falhas; edição de projeto só atualiza campos e equipe após validar todas as consultas. Tentativa posterior disponível pelo fluxo existente.

**ARQUIVOS MODIFICADOS:** assets/api.js; mainPage/cadastro.js, menuCadastro.html; login/login.js, login.html; testes erros-interface e respostas-api-navegador; documentos 06/08.

**TESTES:** 122/122, cinco suítes, zero falhas/cancelamentos/ignorados: node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/erros-interface.test.js server/test/sessao-interface.test.js server/test/formulario-pessoas.test.js server/test/respostas-api-navegador.test.js. 41 novos Chrome, cobrindo 403/404/500, JSON inválido, formato inválido, falha de rede nos detalhes/listas dos três tipos, falha de participantes sem edição parcial, caminho positivo, multipart, resposta 200 inválida e interrupção 401. Casos anteriores cobrem validação400, conflito409 e busca/filtro/retorno. DB e respostas controlados; nenhum MySQL real nestes casos. Log labhist-p14.log.

**ERROS:** corrigidos fluxo posterior ao 401, edição com objeto de erro, listas com formato inválido/TypeError, perda de equipe em carregamento parcial e detalhes técnicos de 500 exibidos. Sintaxe verificada.

**STATUS:** Concluído em 18/10/2026 no escopo P14. Não equivale a homologação D12 nem implantação.

**PRÓXIMO PROMPT:** P07 — Filtrar recursos acadêmicos por identidade e vínculo, iniciado sob autorização do lote.

### 18/10/2026 — P07: autorização por identidade e participação

**PROMPT EXECUTADO:** P07 — Filtrar recursos acadêmicos por identidade e vínculo.

**ALTERAÇÕES:** listas/detalhes/metadados limitados pelas relações acadêmicas; identidade/pessoa revalidadas; consulta de pessoa só própria, listagem global só administrativa; nomes/IDs necessários sem contatos/matrículas de colegas; alunos só acessam seus documentos de perfil aluno com autoria confirmada. Migração 005 acrescenta marcador de contenção, default0, preservando a incerteza de todos os legados. Não migra autoria nem decide D07/P09. Upload com projeto na URL autoriza antes do Multer; compatibilidade antiga usa staging privado; promoção e INSERT exigem conta/vínculo/equipe protegidos na transação. Confirmação perdida de COMMIT preserva o arquivo e sinaliza conciliação, sem replay.

**ARQUIVOS MODIFICADOS:** server/index.js, acesso-academico.js, identidades.js, banco/transacao.js, esquema.js, migrador.js, migracoes.js, versoes/005-acesso-documentos.js, ACESSO-ACADEMICO.md; mainPage/cadastro.js; helpers e testes de acesso/versão/autorização; documentos 06/08. ERROS-INTERFACE.md também acrescentado para registrar P14.

**TESTES:** 816/816, 20 suítes, zero falhas/cancelamentos/ignorados na regressão completa dos 14 arquivos de teste (com --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec). Após acrescentar locks de conta/pessoa dentro do upload e validar default0 do marcador, suíte específica repetida: 23/23 (MySQL/HTTP/multipart/arquivos reais descartáveis), zero falhas. Novo caso impede promoção quando a conta é desvinculada durante o recebimento; caso de participação removida também passa. Logs labhist-p07-final.log e labhist-p07-confirmacao.log. Até aqui: 817 casos no conjunto final; não afirmar que 817 rodaram juntos nesta etapa.

**ERROS:** primeiro ensaio específico 21/22: fixture reutilizava cookie administrativo ao autenticar os demais e invalidava essa sessão pela regeneração correta de P01. Logins da fixture agora são independentes. Sem mudança no produto para contornar a falha. Detectada/corrigida limpeza de staging em falha de rename; regressão final do lote validará conjunto atualizado.

**STATUS:** Concluído em 18/10/2026 no escopo P07. Nenhum dado/banco/upload real do projeto acessado. FK antiga de autor para usuarios ainda pode causar409 em novos envios; não falsificar identidade para satisfazê-la (P09). Limites/conteúdo P16 e exclusão física P17 permanecem.

**PRÓXIMO PROMPT:** P08 — Download autenticado dos documentos, iniciado no lote.

### 18/10/2026 — P08: download autenticado e encerramento do lote

**PROMPT EXECUTADO:** P08 — Download autenticado dos documentos.

**ALTERAÇÕES:** endpoint GET /documentos/:id/download com a mesma autorização dos metadados; nenhuma leitura de arquivo antes da permissão; uploads estáticos fechados; metadados sem caminho físico e links por ID; confinamento por basename/caminho canônico, recusa de traversal/ADS/dispositivos/symlinks/junction na raiz; descritor conferido por dispositivo/inode antes de consumir bytes e fechado no sucesso/erro/aborto; attachment com nome sanitizado e filename* UTF-8 explícito, octet-stream/nosniff/private-no-store.

**ARQUIVOS MODIFICADOS:** server/index.js, arquivos-documentos.js, DOWNLOAD-AUTENTICADO.md, test/download-documentos.test.js, test/helpers/aplicacao.js; mainPage/cadastro.js e regressão Chrome em erros-interface.test.js. Guias BANCO-DE-DADOS.md/AUTENTICACAO.md/IDENTIDADE-ACADEMICA.md atualizados para contratos integrados, versão005 e limitações; controle/checklist atualizados.

**TESTES:** conjunto final **861/861**, 22 suítes, zero falhas/cancelamentos/ignorados. 43 novos casos no arquivo download-documentos (19 de caminho/descritor e 24 HTTP+MySQL+filesystem descartáveis reais) e um Chrome do link. A junction de diretório é real; link de arquivo e troca entre lstat/open são simulações explícitas. Negações verificam zero entrada no helper de arquivo; positivos verificam bytes/nome acentuado/headers; aborto real verifica fechamento do descritor. Logs finais e execução detalhados abaixo.

**ERROS:** primeiro ensaio 42/43 porque o formatter HTTP não emitia filename* para caracteres já representáveis em Latin-1. Emissão UTF-8 explícita acrescentada sem duplicar header existente; confirmação pelo conjunto final 861/861. Arquivo ausente e caminho inseguro retornam 404 sem localização. Campos mínimos da resposta de sessão também exigem IDs positivos. Sintaxe e npm ls --depth=0 aprovados, sem instalar dependências.

**STATUS:** Concluído em 18/10/2026 no escopo P08. Os cinco prompts autorizados foram concluídos. 13/46 concluídos; 33 restantes (31 pendentes + 2 bloqueados). Nenhuma migração/banco/upload real, envio de mensagem/e-mail, implantação, commit ou publicação executados. Autoria histórica P09/D07, parâmetros P03/D12, limites/conteúdo P16 e exclusão coordenada P17 permanecem.

**PRÓXIMO PROMPT:** P16 — Validar e limitar uploads de documentos. Liberado para seleção; não iniciado, aguardando nova solicitação fora deste lote.

Comando final, executado na raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/acesso-academico.test.js server/test/download-documentos.test.js server/test/identidades.test.js server/test/formulario-pessoas.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js server/test/migracao-credenciais.test.js server/test/sessao-interface.test.js server/test/erros-interface.test.js
```

Validação de sintaxe: node --check em server/index.js, identidades.js, acesso-academico.js, arquivos-documentos.js, banco/identidade-esquema.js, scripts/vincular-contas.js, assets/api.js, mainPage/cadastro.js e login/login.js. As importações/testes dos 15 arquivos e seus módulos foram exercitadas na execução final. npm.cmd --prefix server --logs-max=0 ls --depth=0 retornou 0. O script npm test permanece o placeholder até P43; este comando específico é reproduzível e não fecha essa tarefa por antecipação.

### Novo lote autorizado — P16/P17/P20/P21/P22

O usuário solicitou os próximos cinco prompts. Seleção por dependências: P16 → P17 → P20 → P21 → P22. P18/P19 aguardam decisão dos status legados; P09/D07 e P03/D12 continuam impedidos. P20 cria apenas subprojetos com campos confirmados; sem envios/conteúdo/quizzes associados, P22 não exige presumir a política D07. Cada etapa será validada antes da seguinte, sem implantação ou banco real.

### 18/10/2026 — P16: limites e conteúdo dos uploads

**PROMPT EXECUTADO:** P16 — Validar e limitar uploads de documentos.

**ALTERAÇÕES:** limites configuráveis de arquivo/total multipart/campos/expansão; contagem também em chunked; descrição texto1–255 após trim; extensão/conteúdo compatíveis nos seis sufixos existentes; armazenamento UUID/UTF-8 e fechamento/limpeza de staging. Política operacional documentada, sem transformá-la em regra da ERS.

**ARQUIVOS MODIFICADOS:** server/upload-documentos.js, index.js, erros-api.js, .env.example, UPLOADS.md; mainPage/cadastro.js e menuCadastro.html; testes uploads, fixtures-documentos, helper aplicação e fixture PDF de acesso-academico; docs06/08.

**TESTES:** 203/203, seis suítes, zero falhas/cancelamentos/ignorados: uploads.test.js, acesso-academico.test.js, erros-interface.test.js, respostas-api.test.js com node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec. 33 novos testes; regressão MySQL real descartável preservada. Log labhist-p16-final.log. DOC/DOCX são fixtures estruturais sintéticas; não afirmar abertura Office ou validação completa/renderização.

**ERROS:** antiga fixture PDF sem cabeçalho/EOF foi substituída por estrutura compatível mantendo o marcador esperado; primeiro ensaio de regressão falhou em duas asserções de conteúdo da fixture e não foi contado como aprovado. Sem alteração dos critérios de autorização.

**STATUS:** Concluído no escopo P16. Sem banco/uploads reais, instalação de pacote ou implantação. Confirmação incerta do COMMIT preserva conciliação de P07, sem replay.

**PRÓXIMO PROMPT:** P17 — Coordenar exclusão de projeto e arquivos físicos, iniciado no lote.

### 18/10/2026 — P17: exclusão e fila persistente de limpeza

**PROMPT EXECUTADO:** P17 — Coordenar exclusão de projeto e arquivos físicos.

**ALTERAÇÕES:** migração006/fila durável na mesma transação de exclusão; arquivos só após commit confirmado; confinamento P08 reutilizado; referência por outro documento preserva bytes; ausentes idempotentes; falhas e caminhos bloqueados rastreáveis; consulta/repetição administrativa por IDs; resposta202 e mensagem de pendência. Documento individual reutiliza a mesma proteção para remover unlink sem diagnóstico.

**ARQUIVOS MODIFICADOS:** server/index.js, arquivos-documentos.js, limpeza-arquivos.js, banco/versoes/006-limpeza-arquivos.js, banco/migracoes.js e esquema.js; LIMPEZA-ARQUIVOS.md; mainPage/cadastro.js; testes limpeza-arquivos e helpers, expectativas de versão/cascata em testes existentes; docs06/08.

**TESTES:** 53/53 (10 novos MySQL/arquivos e43 download) e239/239 regressões (respostas-api, transacoes, autorizacao), em duas execuções distintas, zero falhas/cancelamentos/ignorados. Logs labhist-p17.log e labhist-p17-regressao.log; Node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec. Caminho externo, rollback, sharedfile, unlink negado/retry, COMMIT perdido, falha após unlink e documento individual cobertos.

**ERROS:** limpeza silenciosa e remoção sem coordenação corrigidas; worker mantém fila quando não pode confirmar seu avanço. Critérios antigos de cascata ajustados para esperar limpeza de documento de projeto, preservando verificação de rollback/ausência.

**STATUS:** Concluído no escopo P17, sem dados/banco/arquivos reais ou migração real. Filas não são publicadas antes do commit.

**PRÓXIMO PROMPT:** P20 — Modelo e API de cadastro de subprojeto, iniciado no lote; P18/P19 continuam dependentes da decisão de status.

### 18/10/2026 — P20: modelo e cadastro de subprojetos

**PROMPT EXECUTADO:** P20 — Modelo e API de cadastro de subprojeto.

**ALTERAÇÕES:** migração007 com relação1:N e FK RESTRICT; título/objetivo/descrição/temas; cadastro administrativo e lista/detalhe limitados ao vínculo acadêmico. Validação de título e bytes UTF-8, projeto existente e imutabilidade das versões anteriores. Sem frontend ou relações de conteúdo/quiz/envio.

**ARQUIVOS MODIFICADOS:** server/subprojetos.js, index.js, banco/versoes/007-subprojetos.js, migracoes.js, esquema.js, migrador.js; testes subprojetos, helper aplicação e expectativas de versões/drop de fixtures; docs06/08.

**TESTES:** 31/31 HTTP/MySQL/filesystem descartáveis reais, uma suíte, zero falhas/cancelamentos/ignorados. node --experimental-vm-modules --test --test-reporter=spec server/test/subprojetos.test.js; log labhist-p20.log. Cadastro múltiplo, Unicode/tipos/limites, autorização, FK, rollback do pai, upgrade006→007 e falha SQL verificados.

**ERROS:** nenhum na execução específica. Pai com subprojeto retorna409 na exclusão e preserva documentos/fila/arquivos pela transação.

**STATUS:** Concluído no escopo P20. Não encerra a camada visual RF19/RF20. Versão007 preparada, sem migração real.

**PRÓXIMO PROMPT:** P21 — API de edição de subprojeto, iniciado no lote.

### 18/10/2026 — P21: edição de subprojeto

**PROMPT EXECUTADO:** P21 — API de edição de subprojeto.

**ALTERAÇÕES:** PUT administrativo reutiliza validação P20, leitura do registro com lock, 404 para ausência, atualização dos quatro campos e sucesso ao salvar valores iguais. ID e projeto pai preservados; tentativa de transferência recusada400. Leitura para edição usa GET seguro de P20.

**ARQUIVOS MODIFICADOS:** server/subprojetos.js, test/subprojetos.test.js; docs06/08. Sem alteração de esquema.

**TESTES:** 43/43 HTTP/MySQL descartáveis reais, incluindo12 novos de edição; uma suíte, zero falhas/cancelamentos/ignorados. node --experimental-vm-modules --test --test-reporter=spec server/test/subprojetos.test.js; log labhist-p21.log. Cada campo, mesmo valor, tipos, ID/ausência, perfil forjado, tentativa de transferência, preservação do irmão e falha SQL cobertos.

**ERROS:** nenhum na execução. UPDATE com valores iguais não é interpretado como registro ausente.

**STATUS:** Concluído no escopo P21; formulário visual permanece P25. Nenhum banco real acessado.

**PRÓXIMO PROMPT:** P22 — API de exclusão de subprojeto, último do lote autorizado.

### 18/10/2026 — P22: exclusão de subprojeto

**PROMPT EXECUTADO:** P22 — API de exclusão de subprojeto.

**ALTERAÇÕES:** DELETE administrativo com ID válido, existência/lock e transação; remove apenas o alvo. Consulta FKs reais e bloqueia dependentes com 409, inclusive ações CASCADE/SET NULL, sem presumir descarte de dados. Não foram criados vínculos de envio/conteúdo/quiz nem acionada limpeza de arquivo.

**ARQUIVOS MODIFICADOS:** server/subprojetos.js, test/subprojetos.test.js; docs06/08. Guia SUBPROJETOS.md reúne contratos P20–P22.

**TESTES:** 50/50 HTTP/MySQL/filesystem descartáveis reais, incluindo7 novos de exclusão; uma suíte, zero falhas/cancelamentos/ignorados. node --experimental-vm-modules --test --test-reporter=spec server/test/subprojetos.test.js; log labhist-p22.log. Sem dependentes, RESTRICT/CASCADE/SET NULL com dados, ausente, ID inválido, perfis/forja, falha SQL e preservação de pai/irmãos/documento/arquivo verificados.

**ERROS:** nenhum na execução específica. Falhas SQL sanitizadas e rollback confirmado.

**STATUS:** Concluído no escopo P22. Camada visual continua P26; D07 permanece pendente para relações futuras. Regressão completa aprovada no fechamento abaixo.

**PRÓXIMO PROMPT:** após regressão, selecionar apenas tarefa com dependências cumpridas; P23 não está liberado por depender de P19/P18. Não iniciar sexto prompt neste lote.

### 18/10/2026 — Fechamento do lote P16/P17/P20/P21/P22

Os cinco prompts foram implementados e testados separadamente. A regressão final integrada passou **954/954**, 26 suítes, zero falhas/cancelamentos/ignorados, em 192061.3445ms. São 93 casos adicionais sobre 861 do lote anterior: 33 uploads, 10 limpeza, 31 cadastro/consulta, 12 edição e 7 exclusão de subprojetos. Não somar novamente as execuções parciais sobrepostas.

Comando executado na raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/acesso-academico.test.js server/test/download-documentos.test.js server/test/identidades.test.js server/test/formulario-pessoas.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js server/test/migracao-credenciais.test.js server/test/sessao-interface.test.js server/test/erros-interface.test.js server/test/uploads.test.js server/test/limpeza-arquivos.test.js server/test/subprojetos.test.js
```

Log labhist-lote-cinco-2-final.log no temporário. Node --check aprovado para index.js, subprojetos.js, upload-documentos.js, limpeza-arquivos.js, arquivos-documentos.js, banco/migrador.js, versões006/007 e mainPage/cadastro.js; imports dos 18 testes exercitados. npm.cmd --prefix server --logs-max=0 ls --depth=0 retornou 0, sem instalar pacotes. npm test continua placeholder de P43, que não foi concluído por antecipação. Avisos experimentais de VM/depreciação do router da fixture não causaram falha.

Guias UPLOADS.md, LIMPEZA-ARQUIVOS.md, SUBPROJETOS.md, BANCO-DE-DADOS.md, ACESSO-ACADEMICO.md e DOWNLOAD-AUTENTICADO.md refletem a integração. Versões001–005 não foram reescritas;006/007 foram preparadas e exercitadas apenas nas fixtures. Banco, .env e uploads reais não foram utilizados. Nenhuma implantação, migração real, redefinição de senha, mensagem/e-mail, commit ou publicação executados. Encerramento das fixtures confirmado: zero mysqld de fixture remanescente; resíduo histórico P15 preservado.

**STATUS FINAL:** 18/46 Concluídos; faltam 28 (26 Pendentes + 2 Bloqueados). Nenhuma tarefa Em desenvolvimento/Aguardando teste. Camada visual de subprojetos permanece P23–P26 e não foi declarada concluída; P18/P19 continuam impedidos pela decisão dos status legados.

**PRÓXIMO PROMPT:** **P42 — Reduzir consultas e carga da listagem de projetos**, selecionável por P07/P05/P14 concluídos; não iniciado. P33 exige contrato público mínimo; P37 depende de P09; os demais impedimentos do controle permanecem. O lote termina aqui, sem executar sexto prompt.

### Novo lote solicitado — P42 e dependências dos próximos quatro

P42 iniciado após leitura integral e conferência das dependências. Solicitada ao usuário a decisão exigida por P18: preservar legados com NULL/Não informado, exigir estado válido em novos projetos e permitir classificação administrativa. Resposta ainda pendente; nenhum trabalho dependente dessa decisão será iniciado antes de recebê-la. Se aceita, a sequência proposta é P42 → P18 → P19 → P23 → P24 (cinco tarefas). Sem banco real ou migração real.

### 18/10/2026 — P42: listagem agrupada e pausa por decisão do lote

**PROMPT EXECUTADO:** P42 — Reduzir consultas e carga da listagem de projetos.

**ALTERAÇÕES:** projetos filtrados pela sessão antes de buscar membros em lote, duas consultas para todos os IDs autorizados; fallback administrativo legado agrupado em consulta adicional apenas quando necessário. Mapeador compartilhado com detalhe; descricao/objetivo preservados; resumos em campos próprios e linhas escapadas na lista administrativa. Sem cache de identidade nem ampliação de acesso.

**ARQUIVOS MODIFICADOS:** server/index.js; mainPage/cadastro.js; server/test/helpers/aplicacao.js, mysql-temporario.js e fixture-projetos.js; server/test/listagem-projetos.test.js, erros-interface.test.js; server/LISTAGEM-PROJETOS.md; docs06/08. Sem migração ou mudança de esquema.

**TESTES:** 190/190 (listagem-projetos, acesso-academico, erros-interface, autorizacao), quatro suítes, zero falhas/cancelamentos/ignorados, duração 25465.3379ms; depois 181/181 (integridade-projetos, transacoes, sessao-interface), sete suítes, zero falhas/cancelamentos/ignorados, duração 51947.1523ms. Dez novos HTTP/MySQL e um Chrome. Node --check aprovado em index.js, cadastro.js e helpers/teste novos. Mesma fixture para medição antes/depois em MySQL descartável real: N=0/1/12/40, consultas1/3/25/81→1/3/3/3; leituras HTTP únicas, sem promessa de ganho percentual de latência. Valores/limitações no guia. Chrome usa respostas controladas.

**ERROS:** nenhum teste falhou. Uma tentativa de simplificação textual do helper com node -e foi recusada pelo parser do PowerShell antes de executar; correção aplicada via patch e sintaxe verificada, sem alterar a semântica já testada. Código anterior concatenava nomes à descrição e fazia N+1; corrigidos.

**STATUS:** Concluído no escopo P42, sem banco/.env/uploads reais, migração, pacote, implantação, commit ou publicação. **19/46 concluídos; faltam 27.** Não completar P43 por antecipação. O lote de cinco tem 1 concluído e 4 não iniciados por decisão pendente; não declarar o lote inteiro concluído.

**PRÓXIMO PROMPT:** P18 — Adicionar status do projeto, ainda Bloqueado. A condição literal em 05 é “classificação inicial dos legados deve ser acordada na execução”. Pergunta enviada: manter legados com NULL/Não informado, exigir finalizado/em andamento/cancelado em novos e permitir classificação administrativa? Nenhuma resposta recebida até este registro. Isso liberaria a sequência restante P18 → P19 → P23 → P24, após validação individual. Não houve nova solicitação de permissão para trabalho já autorizado; falta decisão de negócio explícita.

Comandos, na raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/listagem-projetos.test.js server/test/acesso-academico.test.js server/test/erros-interface.test.js server/test/autorizacao.test.js
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/sessao-interface.test.js
```

Verificação final P42: zero instâncias mysqld de fixture remanescentes; controle e checklist consistentes (46 IDs,19 concluídos,25 pendentes,2 bloqueados). O resíduo histórico de P15 permanece preservado.

### Retomada do lote — decisão P18 recebida

Usuário confirmou a proposta de status legados; decisão registrada em 07. Autorização dos quatro restantes permanece: P18 → P19 → P23 → P24. P18 iniciado, sem migração no banco real.

### 18/10/2026 — P18: status e legados preservados

**PROMPT EXECUTADO:** P18 — Adicionar status do projeto.

**ALTERAÇÕES:** decisão registrada em 07, migração008 nullable/default NULL/CHECK, sem classificação automática. POST exige estado; PUT preserva omissão/NULL legado, recusa apagar estado definido. Contratos/lista/detalhe e seletor administrativo integrados. Período D05 fora do escopo.

**ARQUIVOS MODIFICADOS:** server/index.js, projetos-validacao.js, banco/esquema.js, migracoes.js, migrador.js e versoes/008-status-projetos.js; mainPage/menuCadastro.html e cadastro.js; novos status-projetos.test.js/projetos-interface.test.js, helpers e expectativas de versões/payloads nas regressões; STATUS-PROJETOS.md/BANCO-DE-DADOS.md; docs06/07/08.

**TESTES:** confirmação final38/38 em três suítes (18 HTTP/MySQL,14 esquema MySQL,6 Chrome), zero falhas/cancelamentos/ignorados, duração75751.1417ms. Comando node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/status-projetos.test.js server/test/esquema.test.js server/test/projetos-interface.test.js; log labhist-p18-confirmacao.log. Regressão P15 Chrome31/31 em labhist-p18-p15.log. Sintaxe verificada.

**ERROS:** primeiro API/P10:159/160, snapshot antigo não previa a nova coluna NULL; corrigido mantendo todos os valores anteriores. Segundo API/P10/esquema:173/174, expectativa remanescente de versão7; corrigida e esquema14/14 confirmado. P10 passou integralmente nesse segundo ensaio. Chrome inicial: preflight incompleto na nova fixture e timeout Page.navigate; fixture corrigida, repetição sequencial final6/6 sem mudar timeout ou produto para contornar erro. Execuções com falha/cancelamento não foram contadas como aprovação.

**STATUS:** Concluído;20/46 concluídos. Sem migração/banco/.env/uploads reais ou implantação. Versões001–007 preservadas. Navegador usa respostas controladas, sem alegação E2E MySQL.

**PRÓXIMO PROMPT:** P19 — Mostrar informações do projeto aos participantes, iniciado no lote.

### 18/10/2026 — P19: detalhe acadêmico seguro

**PROMPT EXECUTADO:** P19 — Mostrar informações do projeto aos participantes.

**ALTERAÇÕES:** consulta GET segura antes de mostrar detalhe/envio; descrição, objetivo, status, nomes permitidos e indicação de vínculo. Documentos preservam autor/perfil e download; falhas limpam contexto anterior e impedem envio. Respostas atrasadas de detalhe/documentos descartadas ao mudar de tela/projeto. Não há autoinscrição nem autorização baseada na lista local.

**ARQUIVOS MODIFICADOS:** mainPage/cadastro.js, menuCadastro.html e menu.css; server/test/projetos-interface.test.js; docs06/08. Sem mudança de API ou esquema.

**TESTES:**54/54 no conjunto inicial (interface, acesso-academico MySQL e sessao-interface), quatro suítes, zero falhas/cancelamentos/ignorados; log labhist-p19.log. Após acrescentar autores/documentos e401, confirmação14/14 Chrome (6 P18 +8 P19), zero falhas/cancelamentos/ignorados; log labhist-p19-final.log. Não afirmar que56 rodaram juntos. Comando de confirmação: node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js. Positivos aluno/professor, XSS, vazio,403/404/500, autores,401, voltar/menu móvel. Chrome com respostas controladas, sem E2E navegador+MySQL.

**ERROS:** todos os14 casos passaram na primeira confirmação ampliada, mas o hook de encerramento ainda tinha request da página de login; teste agora aguarda carregamento completo do destino antes de fechar. Nova execução passou também no hook, sem ignorar exceções.

**STATUS:** Concluído;21/46 concluídos, sem dados/banco/uploads reais.

**PRÓXIMO PROMPT:** P23 — Lista e detalhe de subprojetos, iniciado no lote.

### 18/10/2026 — P23: leitura de subprojetos

**PROMPT EXECUTADO:** P23 — Lista e detalhe de subprojetos.

**ALTERAÇÕES:** entradas no projeto administrativo/detalhe acadêmico, lista filtrada por pai e detalhe seguro com quatro textos, carregando/vazio/erro/retorno ao pai. Validação de IDs/pai, escape por textContent e descarte de respostas antigas; sem escrita. Retorno administrativo só muda a tela após carregar/validar dados de edição do pai.

**ARQUIVOS MODIFICADOS:** mainPage/cadastro.js, menuCadastro.html, menu.css; server/test/projetos-interface.test.js; docs06/08. Sem DDL/API nova.

**TESTES:**73/73, duas suítes, zero falhas/cancelamentos/ignorados, duração24723.8633ms.23 Chrome (9 novos P23) com respostas controladas e50 HTTP/MySQL reais descartáveis das APIs P20–P22. node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js server/test/subprojetos.test.js; log labhist-p23.log. Administrador/aluno/professor, vários/vazio, pai divergente,401/403/404/500, textos com HTML e retorno correto cobertos.

**ERROS:** nenhum na execução; validação de membros do detalhe também protege elementos NULL sem TypeError.

**STATUS:** Concluído;22/46 concluídos. Sem dados/banco/uploads reais ou migração.

**PRÓXIMO PROMPT:** P24 — Formulário de criação de subprojeto, último do lote autorizado.

### 18/10/2026 — P24: cadastro visual de subprojeto

**PROMPT EXECUTADO:** P24 — Formulário de criação de subprojeto.

**ALTERAÇÕES:** formulário somente administrativo no contexto validado do projeto; título/objetivo/descrição/temas, limites de caracteres/UTF-8 compatíveis com API, retorno/lista do mesmo pai. Erros preservam campos/contexto, botão bloqueado durante envio impede duplicidade, resposta tardia não troca contexto. Sem entidade conteúdo, quiz ou atividade.

**ARQUIVOS MODIFICADOS:** mainPage/cadastro.js, menuCadastro.html; server/test/projetos-interface.test.js; guias/controle/checklist. Sem nova migração/API.

**TESTES:**35/35 Chrome com respostas controladas (12 novos P24), uma suíte, zero falhas/cancelamentos/ignorados; log labhist-p24.log. node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js. Dois pais, título vazio/espaços/longo, TEXT UTF-8,403/404/500, perfil aluno/professor, clique duplo, voltar e pai ausente. APIs persistentes P20–P22 passaram50/50 na etapa anterior; regressão completa aprovada no fechamento abaixo.

**ERROS:** nenhum no ensaio específico. Status de sucesso requer mensagem e ID válido antes de limpar o formulário.

**STATUS:** Concluído no escopo P24;23/46 concluídos, faltam 23. Cinco tarefas do lote concluídas individualmente, sem migração/banco/.env/uploads reais ou implantação. Regressão final aprovada no fechamento abaixo.

**PRÓXIMO PROMPT:** P25 — Formulário de edição de subprojeto, com dependências cumpridas após este lote; não iniciado.

### 18/10/2026 — Fechamento do lote P42/P18/P19/P23/P24

Os cinco prompts foram implementados e validados individualmente. A resposta do usuário ao P18 foi incorporada antes de iniciar a implementação dependente, conforme registro em 07. Regressão integrada final: **1018/1018**, 29 suítes, zero falhas/cancelamentos/ignorados, duração 452212.7021ms, código de saída 0. São 64 testes adicionais sobre 954 do lote anterior: 10 MySQL e 1 Chrome P42, 18 MySQL de status e 35 Chrome de P18/P19/P23/P24 (6/8/9/12). Não somar execuções parciais sobrepostas.

Comando executado na raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/acesso-academico.test.js server/test/download-documentos.test.js server/test/identidades.test.js server/test/formulario-pessoas.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js server/test/migracao-credenciais.test.js server/test/sessao-interface.test.js server/test/erros-interface.test.js server/test/uploads.test.js server/test/limpeza-arquivos.test.js server/test/subprojetos.test.js server/test/listagem-projetos.test.js server/test/status-projetos.test.js server/test/projetos-interface.test.js
```

Log no temporário:labhist-lote-p42-p18-p19-p23-p24-final.log. Node --check aprovado para index.js, projetos-validacao.js, banco/migrador.js, banco/migracoes.js, versoes/008-status-projetos.js, mainPage/cadastro.js e projetos-interface.test.js; imports dos 21 testes/módulos exercitados. npm.cmd --prefix server --logs-max=0 ls --depth=0 retornou 0. Nenhuma instalação de pacote. Execução sequencial usada após timeouts de arranque do Chrome nos ensaios paralelos; timeout da infraestrutura não foi aumentado e nenhum teste foi ignorado. Avisos VM/router de fixtures não causaram falha. npm test permanece placeholder até P43.

Guia LISTAGEM-PROJETOS.md registra medições reais de consultas/tempo; STATUS-PROJETOS.md e PROJETOS-INTERFACE.md registram contratos e limites. SUBPROJETOS.md/BANCO-DE-DADOS.md atualizados. Versão esperada008; versões001–007 imutáveis. Migração preparada e testada em bancos descartáveis, **não aplicada ao banco real**. Banco, .env e uploads reais não usados; nenhuma implantação, publicação, commit, redefinição de senha ou envio de mensagem/e-mail. Fixtures encerradas/limpas; zero mysqld de fixture remanescente. Resíduo histórico P15 preservado.

**STATUS FINAL:** 23/46 Concluídos; faltam 23 (22 Pendentes + 1 Bloqueado: P03/D12), zero Em desenvolvimento/Aguardando teste. Sem declaração de compatibilidade móvel real ou encerramento antecipado de requisitos/decisões abertas.

**PRÓXIMO PROMPT:** **P25 — Formulário de edição de subprojeto**, dependências P21/P23/P24/P14 cumpridas; não iniciado. P26 também tem pré-requisitos cumpridos e continua pendente. O lote de cinco termina aqui.

### Novo lote solicitado — P25/P26 e decisões D08

Usuário solicitou os próximos cinco prompts. P25 iniciado; P26 será validado em seguida. Perguntas D08 enviadas para liberar P27/P28/P29: escolha única ou múltipla com ao menos duas alternativas; política de edição com respostas/resultados. Respostas pendentes, sem implementar parte dependente antes delas. Proposta de sequência: P25 → P26 → P27 → P28 → P29. Sem migração/banco/.env/uploads reais.

### 18/10/2026 — P25: edição visual de subprojeto

**PROMPT EXECUTADO:** P25 — Formulário de edição de subprojeto.

**ALTERAÇÕES:** ação administrativa no detalhe; GET confirmado antes do formulário, quatro campos preenchidos/validados, ID e pai preservados. PUT reutiliza formulário P24, preserva rascunho em falha e atualiza lista/detalhe após sucesso. Estado de edição limpo ao trocar de tela/sessão ou criar outro registro.

**ARQUIVOS MODIFICADOS:** mainPage/cadastro.js e menuCadastro.html; server/test/projetos-interface.test.js; docs06/08. Sem esquema ou API nova.

**TESTES:**96/96 em duas suítes, zero falhas/cancelamentos/ignorados, duração23733.0982ms:46 Chrome com respostas controladas (11 novos P25) e50 HTTP/MySQL descartáveis reais das APIs. Comando node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js server/test/subprojetos.test.js; log labhist-p25.log. Todos os campos, mesmo valor, pai/irmão, GET/PUT403/404/500, validação, perfis e retorno cobertos.

**ERROS:** nenhum no ensaio. Não existe transferência de pai.

**STATUS:** Concluído;24/46 concluídos,22 restantes. Sem banco/.env/uploads reais ou migração.

**PRÓXIMO PROMPT:** P26 — Confirmação de exclusão de subprojeto, iniciado. D08 ainda pendente para os três seguintes propostos.

### 18/10/2026 — P26: exclusão confirmada de subprojeto

**PROMPT EXECUTADO:** P26 — Confirmação de exclusão de subprojeto.

**ALTERAÇÕES:** ação administrativa no detalhe confirmado, título na confirmação, cancelamento sem DELETE e botão bloqueado durante envio. Lista e seleções só atualizadas após sucesso; erro preserva item/pai e sinaliza conflito/dependentes protegidos sem apagar dados no cliente. Resposta antiga não troca contexto.

**ARQUIVOS MODIFICADOS:** mainPage/cadastro.js e menuCadastro.html; server/test/projetos-interface.test.js; PROJETOS-INTERFACE.md/SUBPROJETOS.md; docs06/08. Nenhuma alteração de esquema ou API.

**TESTES:**105/105 em duas suítes, zero falhas/cancelamentos/ignorados, duração24893.4753ms (55 Chrome,9 novos P26 +50 HTTP/MySQL reais descartáveis); log labhist-p26.log. Comando node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js server/test/subprojetos.test.js. Regressões separadas93/93 (erros-interface, respostas-api-navegador, sessao-interface), quatro suítes, duração8674.9ms; log labhist-p25-p26-regressao.log. Confirmação55/55 Chrome após mensagem de conflito, log labhist-p25-p26-final.log. Cancelar, dependência409,403/404/500, perfis, clique duplo, irmãos/pai/documentos cobertos.

**ERROS:** nenhum teste falhou. Mensagem409 contempla também conflito, evitando afirmar que todo409 prova dependência. Uma atualização de progresso citou94 regressões por engano; contagem correta93 conferida no log e corrigida ao usuário.

**STATUS:** Concluído;25/46 concluídos,21 restantes. Lote solicitado tem2/5 concluídos; três dependem de decisão, sem migração/banco/.env/uploads reais, instalação, envio de mensagens/e-mail, implantação, commit ou publicação.

**PRÓXIMO PROMPT:** P27 — Núcleo e API administrativa de criação de quizzes, Bloqueado por D08. Pergunta pendente sobre escolha única ou múltipla (mínimo duas alternativas; uma correta ou uma ou mais corretas), mais política P29 de bloqueio total ou edição só de título/descrição quando houver respostas/resultados. Não presumir vínculo, publicação, pontuação ou novas entidades de resposta. Respostas ainda não recebidas.

Conferência final P25/P26: zero mysqld de fixture remanescente; sintaxe aprovada; controle/checklist consistentes (46 registros,25 concluídos,19 pendentes,2 bloqueados). Resíduo histórico P15 preservado. Nenhuma resposta D08 recebida até este fechamento parcial do lote.

### Retomada do lote — D08 parcial aprovada

Usuário definiu escolha única (mínimo duas alternativas, uma correta) e bloqueio integral de edição com respostas/resultados. Registro em 07. P27 iniciado; depois P28/P29, os três restantes do lote. Pontuação/publicação/vínculos e exclusão com histórico continuam fora deste aceite. Sem migração no banco real.

### 18/10/2026 — P27: núcleo administrativo de quizzes

**PROMPT EXECUTADO:** P27 — Núcleo e API administrativa de criação de quizzes.

**ALTERAÇÕES:** migração009 com quiz/perguntas/alternativas, ordem/FKs RESTRICT/CHECK; criação transacional e lista/detalhe apenas administrativos, gabarito protegido. Validação aplica escolha única aprovada, mínimos 2 alternativas/1 correta, limites operacionais e recusa de campos fora do escopo.

**ARQUIVOS MODIFICADOS:** server/quizzes.js e index.js; banco/esquema.js, migracoes.js, migrador.js e versoes/009-nucleo-quizzes.js; helper aplicação, novo quizzes.test.js e expectativas de versões/drop nas fixtures existentes; QUIZZES.md; docs06/07/08.

**TESTES:**41/41 HTTP/MySQL descartáveis reais, duas suítes, zero falhas/cancelamentos/ignorados;27 novos de quiz e14 esquema. node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/quizzes.test.js server/test/esquema.test.js; log labhist-p27.log; duração72100.2535ms. Persistência, ordem, tipos/limites,0/2 corretas, papéis, rollback na alternativa, FKs/CHECK, upgrade008→009 e drift cobertos.

**ERROS:** nenhum no ensaio. Versões001–008 preservadas; nenhuma reclassificação ou migração real.

**STATUS:** Concluído;26/46 concluídos. Sem dados/banco/.env/uploads reais. Não há publicação, vínculo, pontuação ou exposição acadêmica do núcleo.

**PRÓXIMO PROMPT:** P28 — Formulário administrativo de criação de quiz, iniciado no lote.

### 18/10/2026 — P28: formulário administrativo de quiz

**PROMPT EXECUTADO:** P28 — Formulário administrativo de criação de quiz.

**ALTERAÇÕES:** navegação administrativa, composição de perguntas/alternativas, escolha única por grupo, revisão textual segura, validação/erros por campo e persistência pela API. Falha preserva rascunho e reabilita campos; confirmação limpa e atualiza lista, com consulta administrativa da estrutura. Sem publicação, vínculo ou pontuação.

**ARQUIVOS MODIFICADOS:** mainPage/menuCadastro.html, cadastro.js e menu.css; novo quizzes-interface.test.js e guarda de DOM pronto no helper local de projetos-interface.test.js; docs06/08 e QUIZZES.md.

**TESTES:**69/69 Chrome em duas suítes, zero falhas/cancelamentos/ignorados;14 novos de quiz +55 de projetos/subprojetos. node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/quizzes-interface.test.js server/test/projetos-interface.test.js; log labhist-p28-final.log. Estrutura múltipla, revisão/XSS, campos/correta,400/403/500, perfis, recomposição,404 e clique duplo. Respostas controladas; persistência real coberta por P27 em suíte separada, sem alegação E2E navegador+MySQL.

**ERROS:** primeiro ensaio falhou por seletor de botão na fixture e consulta de document.body antes do novo DOM estar pronto. Seletor por rótulo e guarda explícita de prontidão corrigidos, sem ampliar timeout nem ignorar exceções. Confirmação final passou.

**STATUS:** Concluído;27/46 concluídos. Sem banco/.env/uploads reais ou migração real.

**PRÓXIMO PROMPT:** P29 — API de edição administrativa de quiz, último do lote, com bloqueio integral quando houver respostas/resultados.

### 18/10/2026 — P29: edição de núcleo e proteção de histórico

**PROMPT EXECUTADO:** P29 — API de edição administrativa de quiz.

**ALTERAÇÕES:** PUT administrativo transacional, locks do quiz/perguntas/alternativas, IDs retidos preservados e pertencimento validado antes da escrita; inclusão/remoção/reordenação de itens sem histórico. Política aprovada: qualquer histórico/dependente externo ligado ao núcleo bloqueia toda edição409, inclusive título; nenhuma cascata presumida. GET administrativo de P27 serve leitura para edição.

**ARQUIVOS MODIFICADOS:** server/quizzes.js, test/quizzes.test.js, QUIZZES.md; docs06/08. Sem migração adicional à009.

**TESTES:**41/41 HTTP/MySQL descartáveis reais, uma suíte, zero falhas/cancelamentos/ignorados, duração43002.352ms;14 novos P29 além dos27 P27. Comando node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/quizzes.test.js; log labhist-p29.log. Textos/corretas/ordem, IDs/irmão/outro quiz, itens novos/removidos, perfis, ausência, histórico ligado às três entidades, CASCADE, histórico alheio e rollback em alternativa cobertos.

**ERROS:** nenhum no ensaio específico. Respostas/resultados de fixture são tabelas descartáveis de teste, não novos módulos do produto. Relações futuras de histórico precisam de FKs para o núcleo; autorização/correção/resposta permanecem nos prompts dependentes.

**STATUS:** Concluído;28/46 concluídos,18 restantes. Os cinco do lote foram validados individualmente; regressão integrada aprovada no fechamento abaixo. Sem migração/banco/.env/uploads reais.

**PRÓXIMO PROMPT:** P30 — Formulário administrativo de edição de quiz, selecionável após este lote, não iniciado. P31 ainda exige política de exclusão/retencão: decisão de bloquear edição não aprova descarte de histórico.

### 18/10/2026 — Fechamento do lote P25/P26/P27/P28/P29

Os cinco prompts foram implementados e validados individualmente. D08 parcial foi respondida pelo usuário antes da implementação dependente: escolha única, mínimo duas alternativas, exatamente uma correta, e bloqueio de toda edição quando houver respostas/resultados. Não estende esse aceite a cálculo, tentativas, publicação, vínculo ou exclusão com histórico.

**Regressão integrada final:** **1094/1094**,31 suítes,zero falhas/cancelamentos/ignorados,duração231729.6502ms,código de saída0. São76 casos adicionais sobre1018 da execução completa anterior:11 Chrome P25,9 Chrome P26,27 HTTP/MySQL P27,14 HTTP/MySQL P29 e15 Chrome P28 (inclui reconfirmação de sessão/troca de perfil). Conjuntos parciais sobrepostos não foram somados.

Comando executado na raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/acesso-academico.test.js server/test/download-documentos.test.js server/test/identidades.test.js server/test/formulario-pessoas.test.js server/test/esquema.test.js server/test/autenticacao.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/integridade-projetos.test.js server/test/transacoes.test.js server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js server/test/migracao-credenciais.test.js server/test/sessao-interface.test.js server/test/erros-interface.test.js server/test/uploads.test.js server/test/limpeza-arquivos.test.js server/test/subprojetos.test.js server/test/listagem-projetos.test.js server/test/status-projetos.test.js server/test/projetos-interface.test.js server/test/quizzes.test.js server/test/quizzes-interface.test.js
```

Log temporário:labhist-lote-p25-p29-confirmacao-completa.log. Primeiro ensaio completo (labhist-lote-p25-p29-final.log) teve1093 casos aprovados, mas saiu1 por hook do Chrome em erros-interface: “Navegador de teste encerrado.” O teste de401 fechava ao mudar a URL antes de a página de login terminar de carregar. Espera explícita por readyState complete corrigida; confirmação43/43 em labhist-p29-fixture-confirmacao.log, sem ignorar exceções/aumentar timeout. Acrescentado caso real de interface para limpar gabarito/rascunho em reconfirmação com perfil não administrativo/troca de conta. Repetição integrada final1094/1094 saiu0 e não teve falha de hook. Não contar o primeiro ensaio como execução integral aprovada.

Node --check aprovado em server/index.js,quizzes.js,banco/esquema.js,migrador.js,migracoes.js,versoes/009-nucleo-quizzes.js,mainPage/cadastro.js e testes novos; imports dos23 arquivos exercitados. npm.cmd --prefix server --logs-max=0 ls --depth=0 retornou0. Nenhum pacote instalado. Avisos VM/router de fixtures não causaram falha na confirmação. npm test permanece placeholder até P43, não encerrado por antecipação.

Documentação de contratos em QUIZZES.md,PROJETOS-INTERFACE.md,SUBPROJETOS.md e BANCO-DE-DADOS.md. Versão de código esperada009; fontes001–008 preservadas. **Migração009 preparada/testada apenas em bancos descartáveis, não aplicada ao banco real.** Banco,.env e uploads reais não utilizados; nenhuma implantação,commit,publicação,redefinição de senha ou envio de mensagens/e-mail. Fixtures encerradas/limpas;zero mysqld de fixture remanescente. Resíduo histórico P15 preservado.

**STATUS FINAL:**28/46 Concluídos;faltam18 (17 Pendentes +1 Bloqueado:P03/D12),zero Em desenvolvimento/Aguardando teste. Quizzes com núcleo/cadastro administrativo e edição por API; formulário de edição ainda é P30. Sem alegação de resposta/correção/publicação acadêmica implementada.

**PRÓXIMO PROMPT:** **P30 — Formulário administrativo de edição de quiz**, com P29/P28/P14 concluídos; não iniciado. P31 exige decisão própria sobre exclusão/retencão, não aprovada pela política de edição D08. Lote de cinco encerrado, sem sexto prompt.

## Lote autorizado em 18/10/2026 — P30/P31/P32/P33/P43

Pedido: “pode prosseguir os proximos 5 prompts”. Sequência das tarefas liberadas: P30, P31, P32, P33 e P43. P34–P41 permanecem condicionados; P43 pode ser antecipado segundo o plano. Retenção de P31/P32 aprovada pelo usuário e registrada em 07. P30 em desenvolvimento; os demais aguardam a validação da etapa anterior. Nenhuma migração no banco real autorizada neste lote.

### P30 — Formulário administrativo de edição de quiz

**PROMPT EXECUTADO:** P30. **ALTERAÇÕES:** reutiliza o formulário de criação, carrega dados antes de abrir, mantém IDs/textos/gabarito, envia PUT e recarrega o detalhe. Erros e conflito de histórico preservam edição; cancelar/criar/perda de sessão limpam seleção. **ARQUIVOS MODIFICADOS:** mainPage/cadastro.js, mainPage/menuCadastro.html, server/test/quizzes-interface.test.js e controles 06/08. **TESTES:** node --check mainPage/cadastro.js; node --experimental-vm-modules --test --test-reporter=spec server/test/quizzes-interface.test.js, 26/26 aprovados, 1 suíte, 0 falhas/ignorados, saída 0, 12495.8287 ms (labhist-p30-confirmacao.log). Chrome real com API controlada; persistência real já coberta em P29 e será regressada no lote. **ERROS:** asserção do teste consultava capturarQuiz antes de verificar aviso, limpando-o por validação; corrigida a ordem do teste. **STATUS:** Concluído em 18/10/2026, sem teste manual obrigatório identificado. **PRÓXIMO PROMPT:** P31 — API de exclusão administrativa de quiz; retenção aprovada em 07.

### P31 — API de exclusão administrativa de quiz

**PROMPT EXECUTADO:** P31. **ALTERAÇÕES:** DELETE /quizzes/:id administrativo, trava o núcleo, verifica todos os dependentes externos antes de qualquer exclusão, remove alternativas/perguntas/quiz em transação; histórico inclusive FK CASCADE fica preservado, erro intermediário reverte tudo. **ARQUIVOS MODIFICADOS:** server/quizzes.js, server/test/quizzes.test.js, decisões 07 e controles 06/08. **TESTES:** node --check server/quizzes.js; node --experimental-vm-modules --test --test-reporter=spec server/test/quizzes.test.js, 54/54 testes, 1 suíte, zero falhas/ignorados, saída 0, 39137.2352 ms (labhist-p31.log), HTTP e MySQL reais descartáveis. Inclui papéis, IDs, três relações de histórico com RESTRICT/CASCADE, outro quiz e rollback sanitizado. **ERROS:** nenhum na validação. **STATUS:** Concluído em 18/10/2026; sem migração/banco real, sem teste manual obrigatório. **PRÓXIMO PROMPT:** P32 — confirmação visual de exclusão.

### P32 — Confirmação de exclusão administrativa de quiz

**PROMPT EXECUTADO:** P32. **ALTERAÇÕES:** ação no detalhe confirmado, confirmação nativa com título, cancelar não envia DELETE; clique duplo protegido, lista muda após sucesso da API, conflito/negação/ausência/erro mantêm item e informam falha. Respostas antigas não mudam contexto novo. **ARQUIVOS MODIFICADOS:** mainPage/cadastro.js, mainPage/menuCadastro.html, server/test/quizzes-interface.test.js, controles 06/08. **TESTES:** node --check mainPage/cadastro.js; node --experimental-vm-modules --test --test-reporter=spec server/test/quizzes-interface.test.js, 33/33 testes Chrome com API controlada, 1 suíte, zero falhas/ignorados, saída 0, 6834.0722 ms (labhist-p32.log). **ERROS:** nenhum. **STATUS:** Concluído em 18/10/2026, sem teste manual obrigatório identificado. **PRÓXIMO PROMPT:** P33 — entrada pública e informações de projetos. Contrato proposto explicitamente: id, título, descrição, objetivo e status; todos os projetos, sem seleção de publicação presumida, sem membros/documentos/arquivos/datas/dados de pessoas. Não expõe subprojetos/conteúdos/quizzes. O requisito público confirmado não exige criar uma política de publicação adicional.

### P33 — Entrada pública e informações de projetos para visitante

**PROMPT EXECUTADO:** P33. **ALTERAÇÕES:** link visitante funcional e área pública com início/sobre/lista/detalhe/login. GET /publico/projetos e /publico/projetos/:id retornam explicitamente apenas id/titulo/descricao/objetivo/status de projetos. Sem joins, membros, contatos, arquivos, datas, subprojetos ou gabaritos. Público consulta sem cookies; operações privadas continuam exigindo sessão. Todos os projetos entram nesse contrato informativo; publicação de quizzes não foi criada. **ARQUIVOS MODIFICADOS:** server/index.js, login/login.html, publico/index.html, publico/publico.js, publico/publico.css, server/test/publico.test.js, server/test/publico-interface.test.js, controles 06/08. **TESTES:** node --check nos scripts alterados; node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/publico.test.js server/test/publico-interface.test.js: 14/14, 2 suítes, saída 0, zero falhas/ignorados, 16716.9916 ms (labhist-p33.log). 7 HTTP/MySQL reais descartáveis e 7 Chrome com banco controlado. Confere ausência de dados privados, XSS como texto, 400/404/500/vazio, negação de escrita/download e viewport 390px sem overflow. Não equivale à matriz P44 ou navegador+MySQL E2E. **ERROS:** nenhum. **STATUS:** Concluído em 18/10/2026, sem migração real ou teste manual indispensável identificado. **PRÓXIMO PROMPT:** P43 — verificações reproduzíveis, quinto do lote, dependências P02/P04 atendidas. P34–P41 aguardam contratos/decisões. P43 deve cumprir critérios completos (incluindo mutação negativa e recusa de configuração real), preservando autoria legada incerta de P07/P08 e sem declarar P09 resolvido.

### P43 — Validação em andamento

Executor: npm.cmd --prefix server test (26 arquivos, concurrency=2); grupos test:seguranca/test:banco/test:navegador e guia server/TESTES.md. Testes do executor: 5/5 em labhist-p43-grupos.log, 2650.5375 ms, saída 0; grupo segurança: 409/409, 6 suítes, 10900.4466 ms, saída 0 em labhist-p43-seguranca.log. As variáveis de aplicação são recusadas antes de iniciar suítes; mesmos contratos de autorização passam original e falham na cópia VM sem requireAdmin, sem alterar hash do servidor. Primeiro ensaio do executor 4/5 falhou por herdar NODE_TEST_CONTEXT e receber protocolo binário do node:test; ambiente do filho corrigido para relatório TAP independente.

Primeiro ensaio integrado pelo npm: 1142/1144, 33 suítes, duas falhas, saída 1, 249583.0753 ms (labhist-lote-p30-p33-p43-final.log). Falhas nos testes CLI de esquema/integridade: caminho relativo server/scripts/banco.js era dependente do diretório de execução; ambos corrigidos para fileURLToPath(new URL(..., import.meta.url)), sem mudar o CLI de produção. Esse ensaio não é aprovação. Confirmação completa em andamento em labhist-lote-p30-p33-p43-confirmacao.log.

P30/P32, caso adicional de releitura: PUT confirmado seguido de GET500 mantém edição e encerra indicação Salvando, orientando consultar o quiz antes de reenviar. Confirmação 34/34 Chrome controlados, 1 suíte, saída 0, 6402.2199 ms em labhist-p30-p32-releitura.log.

Segundo ensaio integrado: 1144/1145, 33 suítes, uma falha, saída 1, 415670.2518 ms (labhist-lote-p30-p33-p43-confirmacao.log). Os dois CLIs corrigidos passaram. A única falha foi timeout DevTools Page.navigate no primeiro teste P18 do Chrome, em execução concorrente com banco. Ajustado o executor P43 para fases separadas: segurança/banco concurrency=2; após encerramento/limpeza, navegador concurrency=1. Nenhum caso foi removido/ignorado, nenhum timeout aumentado e nenhum erro suprimido. O contrato do plano de execução é validado no teste do executor. Confirmação final por npm test deve validar ambas as fases.

### P43 — Verificações reproduzíveis de segurança e persistência: fechamento

**PROMPT EXECUTADO:** P43, quinto e último do lote autorizado. Dependências P02/P04 atendidas, com P05/P07/P08 exercitados; autoria confirmada e contenção de legado ambíguo testadas sem presumir a correção estrutural de P09. R03 cumprida com todos os critérios do prompt, sem entregar apenas infraestrutura.

**ALTERAÇÕES:** npm test deixa de ser placeholder e executa todos os 26 arquivos. Comandos por grupo, pré-requisitos explícitos, recusa de variáveis/configuração de aplicação, seleção de arquivos validada e propagação de falhas. Execução completa separa segurança/banco (concorrência 2) de navegador (concorrência 1) após limpeza dos filhos. Canary em memória prova regressão de autorização (original passa; sem requireAdmin dá 200 em vez de 403 e sai 1), verificando hash do servidor intacto. CLI nas fixtures usa caminho absoluto baseado em import.meta.url, independente do cwd. Nenhum timeout aumentado e nenhum teste removido/ignorado. Guia de comandos/fixtures/limitações em server/TESTES.md.

**ARQUIVOS MODIFICADOS (P43):** server/package.json, server/scripts/testes.js, server/test/execucao-testes.test.js, server/test/fixtures/autorizacao-canario.js, server/test/helpers/aplicacao.js, server/test/esquema.test.js, server/test/integridade-projetos.test.js, server/TESTES.md e controles 06/08.

**TESTES:** executor final 5/5, saída 0, 2540.4615 ms em labhist-p43-fases.log. Grupo segurança via npm: 409/409, 6 suítes, saída 0 (labhist-p43-seguranca.log). Comando final npm.cmd --prefix server --logs-max=0 test: saída 0, 925/925 (25 suítes, 235033.9597 ms) e 220/220 (8 suítes, 35970.5038 ms), total **1145/1145 em 33 suítes**, zero falhas/cancelamentos/ignorados, log labhist-lote-p30-p33-p43-fases-final.log. Todas as importações exercitadas; node --check em server/index.js, server/quizzes.js, server/scripts/testes.js, mainPage/cadastro.js, login/login.js, publico/publico.js e fixtures CLI aprovado. npm ls --depth=0 aprovado sem instalar pacotes. Teste de configuração real rejeita antes de iniciar suítes/conexões; fixtures reais verificam FKs/migrações/transações/persistência. Chrome usa API/DB controlados, sem alegar E2E navegador+MySQL.

**ERROS:** corrigidos protocolo herdado NODE_TEST_CONTEXT no subprocesso canário, paths relativos dos dois testes CLI e disputa de recursos no arranque/navegação Chrome durante banco (executor por fases). As duas execuções integradas anteriores com falhas estão registradas acima; somente a última execução completa é aprovação.

**STATUS:** Concluído em 18/10/2026 no escopo P43. Banco/.env/uploads reais preservados, sem migração real, implantação, instalação, commit ou início de serviço do projeto. Fixtures próprias encerradas/limpas pelos helpers; conferência de processos confirmou zero mysqld de fixture remanescente. Resíduo antigo P15 preservado. Não identificado teste manual obrigatório para os critérios executados. P09 e P03 continuam pendentes; P43 não encerra requisitos inteiros dependentes desses trabalhos.

**PRÓXIMO PROMPT:** nenhum integralmente liberado agora: P03 depende de D12; P09 depende das decisões/legados; P45 exige consolidar o marco de segurança. Não iniciado sexto prompt.

### Fechamento do lote P30/P31/P32/P33/P43

**33/46 concluídos; faltam 13** (12 Pendentes e 1 Bloqueado). Quatro entregas funcionais e o executor de qualidade concluídos; decisões/contratos não autorizados preservados. Nenhuma publicação/correção/vínculo acadêmico de quiz, recuperação ou atividade implementada.

Arquivos alterados/criados neste lote:

- mainPage/cadastro.js
- mainPage/menuCadastro.html
- login/login.html
- server/index.js
- server/quizzes.js
- server/package.json
- server/scripts/testes.js
- server/test/helpers/aplicacao.js
- server/test/quizzes.test.js
- server/test/quizzes-interface.test.js
- server/test/publico.test.js
- server/test/publico-interface.test.js
- server/test/execucao-testes.test.js
- server/test/fixtures/autorizacao-canario.js
- server/test/esquema.test.js
- server/test/integridade-projetos.test.js
- publico/index.html
- publico/publico.js
- publico/publico.css
- server/QUIZZES.md
- server/TESTES.md
- server/PUBLICO.md
- docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md
- docs/auditoria-ers/07-DUVIDAS-DA-ERS.md
- docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md

## Novo lote solicitado em 19/10/2026 — decisões prévias pendentes

Pedido do usuário: “faça os proximos 5”. Controle e condições do arquivo 05 conferidos; não há cinco prompts integralmente liberados. Sequência candidata: P03 → P09 → P37 → P40 → P41. As três propostas abaixo foram enviadas para decisão, ainda sem resposta; não constituem regras aprovadas.

- P03/D12: frontend/API na mesma origem; HTTPS em produção, proxy confiável explicitamente configurado; sessões MySQL com expiração após 8 horas sem uso; HTTP no desenvolvimento. Domínio/segredos no ambiente, sem implantação agora.
- P09/D07: autoria estável pela conta e nome/perfil registrados no novo envio; preservar histórico após alterações cadastrais, bloquear exclusão da conta autora e manter legados sem prova como pendentes, sem atribuição deduzida ou exclusão de arquivos. Isso também libera P37 após concluir P09; não cria entidade Atividade.
- P40/P41/D11: contato de recuperação separado, confirmado pelo administrador por conta; SMTP configurável com segredos no ambiente; token aleatório de uso único por 30 minutos, revogação de sessões após redefinição; testes com transporte falso e sem e-mails reais.

Somente leituras e este registro foram feitos no novo pedido. Nenhum código, banco, migração ou teste novo alterado/executado; 33/46 concluídos e 13 restantes. Implementações dependentes aguardam respostas explícitas; autorização do lote não define as políticas pendentes. Nenhuma aprovação deduzida de tempo decorrido.

### Liberação explícita do novo lote — 19/10/2026

As três respostas do usuário chegaram após o registro das propostas; todas aprovadas e registradas em 07. Substitui somente a pendência de decisão operacional/autoria/recuperação acima. Sequência efetiva P03 → P09 → P37 → P40 → P41, uma etapa validada antes da próxima. Sem migração no banco real, implantação ou e-mail real. P03 iniciado.

### P03 — Origem da API, CORS e cookies — 19/10/2026

**PROMPT EXECUTADO:** P03, primeira etapa do lote. **ALTERAÇÕES:** origem atual padrão com configuração pública explícita; allowlist CORS, recusa de terceiros antes de sessão/SQL, proxy por IP/subrede, cookies HTTPS/TTL/rolling e store MySQL padrão, memory proibido em produção. Migração 010 explícita; nenhuma aplicação real. **ARQUIVOS MODIFICADOS:** server/operacao.js, configuracao.js, index.js, .env.example, banco/esquema.js, migracoes.js, migrador.js, versoes/010-sessoes.js; assets/api.js; login/login.js/login.html; mainPage/cadastro.js/menuCadastro.html; publico/index.html/publico.js; helpers aplicacao/fixture-projetos; testes operacao/operacao-interface e contratos de migração; server/OPERACAO.md e controles 06/07/08. Testes de migração agora acompanham o manifesto sem mudar as versões publicadas. **TESTES:** autenticação/autorização 138/138 (labhist-p03-base.log); operacao+esquema 22/22, 4 suítes, saída 0, 51228.641 ms (labhist-p03-confirmacao.log); cálculo UTC final 8/8, 3 suítes, saída 0, 15507.0552 ms (labhist-p03-utc.log); navegador final 51/51, 2 suítes, saída 0, 7666.5244 ms (labhist-p03-navegador-final.log). HTTP/HTTPS local reais; persistência em MySQL descartável e cookies reutilizados em outra instância; Chrome com DB controlado. **ERROS:** fixture HTTPS herdava API_PUBLIC_ORIGIN HTTP do helper; configurada explicitamente sem override, mantendo a recusa correta de HTTP em produção. Expiração SQL passou a usar UTC para não depender do fuso do driver. **STATUS:** Concluído; banco real preservado. Sem dispositivo físico/homologação P44, sem teste manual indispensável ao escopo de configuração identificado. **PRÓXIMO PROMPT:** P09 — autoria, política aprovada em 07.

### P09 — Autoria estável dos documentos — 19/10/2026

**PROMPT EXECUTADO:** P09. **ALTERAÇÕES:** migração 011 adiciona conta autora por FK RESTRICT e snapshot nome/perfil, sem atribuir legados por dedução. Upload captura identidade revalidada/travada na transação; leituras e download do aluno usam conta e perfil históricos; administrador não vira aluno. API administrativa de pendências, exibição do snapshot/pendência sem busca por nomes atuais. Alteração/exclusão de pessoa preserva conta histórica, arquivo/data e autoria; exclusão da conta autora bloqueada. **ARQUIVOS MODIFICADOS:** server/index.js, acesso-academico.js, banco/esquema.js/migracoes.js/migrador.js/versoes/011-autoria-documentos.js; mainPage/cadastro.js; helpers/aplicacao.js e fixtures/testes acesso-academico/download/projetos-interface; server/AUTORIA-DOCUMENTOS.md e controles. **TESTES:** node --check; node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/acesso-academico.test.js server/test/download-documentos.test.js server/test/uploads.test.js: 103/103, 5 suítes, saída 0, 29964.4853 ms (labhist-p09-confirmacao.log). Chrome projetos-interface: 56/56, saída 0 (labhist-p09-chrome.log). **ERROS:** primeiro ensaio 98/99: fixture antiga tentava excluir conta agora protegida; substituída por conta sem autoria para manter o teste de sessão revogada, com teste RESTRICT específico acrescentado. Fixtures identificam explicitamente novos documentos; legados continuam NULL. **STATUS:** Concluído, sem migração ou saneamento real, sem teste manual indispensável identificado. **PRÓXIMO PROMPT:** P37 — texto explicativo separado e opcional, sem novo vínculo de atividade.

### P37 — Texto explicativo separado — 19/10/2026

**PROMPT EXECUTADO:** P37. **ALTERAÇÕES:** migração 012 nullable sem conteúdo fabricado; API, formulário e leitura autorizada com texto explicativo opcional distinto da descrição, tipo/bytes/controles validados e HTML literal escapado. Erro preserva rascunho; sucesso confirmado e mudança de projeto limpam campos. Mantém limites operacionais multipart configuráveis, sem atividade/vínculo novo. **ARQUIVOS MODIFICADOS:** server/index.js, banco/esquema.js/migracoes.js/versoes/012-texto-documentos.js; mainPage/cadastro.js/menuCadastro.html; helper/aplicacao.js e testes acesso-academico/projetos-interface/erros-interface; server/AUTORIA-DOCUMENTOS.md e controles 06/08. **TESTES:** API/arquivos 63/63, 3 suítes, saída 0, 24983.9999 ms (labhist-p37-confirmacao.log); Chrome 101/101, 2 suítes, saída 0, 15232.1903 ms (labhist-p37-chrome-confirmacao.log). Inclui texto/descrição distintos, legado sem texto, multipart repetido/tipo errado, excesso, envio e limpeza, falha preservando campos, XSS literal. **ERROS:** primeiro API 62/63 porque VM de teste não expunha Buffer global do Node, corrigido no ambiente isolado; Chrome inicial 100/101 por const dt reutilizado no mesmo contexto DevTools, renomeado na fixture. Nenhuma validação do produto removida. **STATUS:** Concluído; nenhuma migração real, sem teste manual indispensável identificado. **PRÓXIMO PROMPT:** P40 — recuperação por e-mail, D11 aprovada.

### Dependência crítica observada durante P40

Instalação autorizada de nodemailer para SMTP revelou npm audit com 7 alertas (1 crítico). Proxy-addr 2.0.7 era usado pelo trust proxy de P03; atualizado para 2.0.8 e regressão IPv6/IPv4 acrescentada ao teste de operação, sem alterar timeouts. Atualização é correção necessária ao modelo de proxy aprovado. Fonte do mantenedor e relatório em server/DEPENDENCIAS.md. Após correção restam 6 alertas, zero críticos; sem atualização geral por presunção. A proposta de atualização e os pacotes/níveis estão registrados nesse guia. Não declarar auditoria npm limpa nem considerar isso um prompt extra.

### P40 — Recuperação por e-mail — 19/10/2026

**PROMPT EXECUTADO:** P40. **ALTERAÇÕES:** contato confirmado por administrador por conta, SMTP Nodemailer configurável, solicitação uniforme assíncrona sem token público, hash de token/30min/uso único, abuso limitado e redefinição transacional com hash seguro e revogação de sessões. Store rejeita conta removida/versão antiga e não permite recriar sessão antiga após reset. Migração 013 explícita, CLI de banco continua independente de parâmetros web/SMTP. **ARQUIVOS MODIFICADOS:** server/recuperacao.js, email-recuperacao.js, index.js, operacao.js, configuracao.js, .env.example, package.json/package-lock.json; banco/esquema.js/migracoes.js/migrador.js/versoes/013-recuperacao-senha.js; helpers e testes recuperacao/operacao/autenticacao, fixtures de limpeza do esquema e executor; server/RECUPERACAO.md/DEPENDENCIAS.md e controles. **TESTES:** node --check; recuperacao.test.js + operacao.test.js: 21/21, 4 suítes, saída 0, 32700.0666 ms (labhist-p40-confirmacao.log). Testes incluem SMTP configurado por stub, contato restrito, solicitação uniforme, hash/expiração, reset e login, revogação/replay, concorrência, contato alterado, rollback, SMTP falho, abuso e rejeição de sessão antiga resalva. MySQL/HTTP/HTTPS descartáveis reais; sem SMTP real. **ERROS:** primeiro ensaio 17/20 por limite de login atingido na montagem repetida de fixtures; relógio dos limitadores injetado no helper, mantendo limites de produção e testando 429 explicitamente. Crítico de proxy-addr corrigido conforme registro acima; seis outros alertas de dependências remanescentes, não ocultados. **STATUS:** Concluído no escopo API. Origem/SMTP reais e contatos reais ainda exigem configuração local; sem migração real, segredos ou e-mails reais. Não identificado teste manual indispensável para os contratos automatizados. **PRÓXIMO PROMPT:** P41 — interface de solicitação/redefinição.

### P41 — Telas de solicitação e redefinição — 19/10/2026

**PROMPT EXECUTADO:** P41, última etapa autorizada do lote. **ALTERAÇÕES:** link funcional, formulários de usuário/contato e nova senha/confirmação, resposta uniforme, erros orientados sem existência de conta, senha/token apenas em memória; fragmento removido e sem logs/analytics; teclado e navegação de login/visitante mantidos. Link reaberto na mesma aba relê fragmento com recarga, e API recusa reutilização. **ARQUIVOS MODIFICADOS:** login/login.html/login.css/recuperar.html/redefinir.html/recuperacao.js; server/test/recuperacao-interface.test.js, helpers/fixture-projetos.js, scripts/testes.js e guias TESTES/RECUPERACAO; controles 06/08. **TESTES LOCAIS:** 9/9, 1 suíte, saída 0, 53994.5393 ms (labhist-p41-final.log), Chrome+HTTP+MySQL reais descartáveis e SMTP fictício. Envio segue o link efetivamente recebido na caixa falsa, autentica nova senha e recusa sessão antiga. Testes antigos de Chrome continuam usando API/DB controlados; não generalizar essa integração para todos os testes. **ERROS:** primeiro 7/8 por evento Enter incompleto na fixture, acrescentado text carriage-return nativo sem trocar o comportamento do formulário; segundo 8/9 detectou navegação de fragmento na mesma aba sem reexecutar JS. Corrigido o produto para recarregar/relê-lo e a espera do teste para aguardar token consumido do URL/formulário reabilitado, sem aumentar timeout ou ignorar erros. **STATUS:** Aguardando teste integrado, implementação local validada; npm test completo em andamento em labhist-lote-p03-p09-p37-p40-p41-final.log. Nenhum teste manual indispensável identificado para estes fluxos; matriz física P44 permanece separada. **PRÓXIMO PROMPT:** após fechamento, P45 pode ser selecionado com marco P01/P02/P03/P05/P06/P07/P08/P09/P10/P43 revisado; nenhum sexto prompt iniciado. Seis alertas npm remanescentes seguem DEPENDENCIAS.md.

### Regressão integrada do lote de 19/10/2026

Primeira execução npm test (labhist-lote-p03-p09-p37-p40-p41-final.log): fase segurança/banco com 954 casos, 29 suítes, 943 aprovados e 11 falhas, saída 1, 297104.5021 ms; fase navegador não iniciou por propagação do erro. Todas as falhas eram o beforeEach da fixture de legado P10: DROP TABLE usuarios impedia reset porque contatos_recuperacao permanecia com FK. Corrigida ordem de limpeza incluindo recuperacao_senha/contatos_recuperacao/sessoes antes de usuarios; somente banco descartável. Nenhuma FK/validação de produção removida. A repetição completa pelo mesmo npm test está em labhist-lote-p03-p09-p37-p40-p41-confirmacao.log; não contar o ensaio com falhas como aprovação.

### Fechamento P41 e do lote P03/P09/P37/P40/P41 — 19/10/2026

**PROMPT EXECUTADO:** P41, última etapa do lote. **ALTERAÇÕES/ARQUIVOS:** implementação e arquivos de P41 registrados na seção anterior; lista completa do lote abaixo. **TESTES:** npm.cmd --prefix server --logs-max=0 test, saída 0. Fase segurança/banco: 954/954, 29 suítes, 318198.4021 ms. Fase navegador: 233/233, 9 suítes, 55137.6366 ms. Total **1187/1187 testes em 38 suítes**, zero falhas/cancelamentos/ignorados, 30 arquivos. Log labhist-lote-p03-p09-p37-p40-p41-confirmacao.log. Os nove casos P41 usam Chrome, HTTP, cookies e MySQL reais com SMTP falso; demais testes de navegador mantêm seus controles documentados. Sintaxe verificada em index.js, operacao.js, recuperacao.js, email-recuperacao.js, configuracao.js, banco/migrador.js, scripts/testes.js, assets/api.js, login/login.js/recuperacao.js, mainPage/cadastro.js e publico/publico.js; imports exercitados na suíte. npm ls --depth=0 retornou 0, com nodemailer 10.1.7; proxy-addr 2.0.8 confirmado. npm audit após correção tem seis alertas (3 altos, 2 moderados, 1 baixo, 0 críticos); mantém saída diferente de zero e pendência em DEPENDENCIAS.md.

**ERROS:** falhas das fixtures e a navegação de fragmento do produto estão registradas nas etapas. Primeira regressão integrada falhou no reset da fixture legada P10; ordem de limpeza corrigida incluindo novas tabelas antes das contas, sem remover restrições. A repetição completa pelo mesmo npm test passou; nenhum timeout aumentado, teste ignorado ou erro suprimido.

**STATUS:** P41 Concluído; lote encerrado com **38/46 concluídos e 8 restantes**. Não há teste manual indispensável identificado para os fluxos automatizados dessas tarefas; compatibilidade física permanece P44. Migrações reais, configuração de SMTP/origem e confirmação de contatos reais não foram executadas nem presumidas. Banco/.env/uploads reais preservados; nenhuma implantação, commit ou e-mail real. Helpers limparam/encerraram somente suas fixtures; verificação de processos confirmou zero mysqld descartável remanescente. Resíduo P15 preservado.

**PRÓXIMO PROMPT:** P45 — Separar módulos do backend preservando contratos. Marco funcional de segurança revisado no topo; seis alertas de dependências continuam pendência transversal para revisão/atualização. Sem iniciar sexto prompt. Os demais prompts aguardam os contratos/decisões descritos no controle.

Arquivos criados/alterados neste lote (não inclui node_modules, logs temporários nem versões publicadas 001–009, que permaneceram preservadas):

- assets/api.js
- mainPage/cadastro.js
- mainPage/menuCadastro.html
- login/login.js
- login/login.html
- login/login.css
- login/recuperar.html
- login/redefinir.html
- login/recuperacao.js
- publico/index.html
- publico/publico.js
- server/index.js
- server/configuracao.js
- server/operacao.js
- server/recuperacao.js
- server/email-recuperacao.js
- server/acesso-academico.js
- server/.env.example
- server/package.json
- server/package-lock.json
- server/banco/esquema.js
- server/banco/migracoes.js
- server/banco/migrador.js
- server/banco/versoes/010-sessoes.js
- server/banco/versoes/011-autoria-documentos.js
- server/banco/versoes/012-texto-documentos.js
- server/banco/versoes/013-recuperacao-senha.js
- server/scripts/testes.js
- server/test/helpers/aplicacao.js
- server/test/helpers/fixture-projetos.js
- server/test/autenticacao.test.js
- server/test/acesso-academico.test.js
- server/test/download-documentos.test.js
- server/test/esquema.test.js
- server/test/identidades.test.js
- server/test/integridade-projetos.test.js
- server/test/quizzes.test.js
- server/test/status-projetos.test.js
- server/test/subprojetos.test.js
- server/test/projetos-interface.test.js
- server/test/erros-interface.test.js
- server/test/publico-interface.test.js
- server/test/execucao-testes.test.js
- server/test/operacao.test.js
- server/test/operacao-interface.test.js
- server/test/recuperacao.test.js
- server/test/recuperacao-interface.test.js
- server/test/fixtures/https-local-key.pem
- server/test/fixtures/https-local-cert.pem
- server/OPERACAO.md
- server/AUTORIA-DOCUMENTOS.md
- server/RECUPERACAO.md
- server/DEPENDENCIAS.md
- server/BANCO-DE-DADOS.md
- server/TESTES.md
- server/PUBLICO.md
- docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md
- docs/auditoria-ers/07-DUVIDAS-DA-ERS.md
- docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md

## Execução P45 — 19/10/2026 — regressão em andamento

**PROMPT EXECUTADO:** P45 — Separar módulos do backend preservando contratos.

**ALTERAÇÕES:** extrações incrementais de autenticação/autorização/contas, validação/mapeamento e rotas de pessoas, rotas/serviços de projetos e gestão de documentos. Configuração, conexão e transação já eram módulos; preservados. index.js reduzido de 970 para 93 linhas de bootstrap; inventário compara 29 rotas inline anteriores e extraídas, sem perdas. Pool fornecido por getter; limpeza pós-commit compartilhada sem dependência circular.

**ARQUIVOS MODIFICADOS:** server/index.js, autenticacao.js, identidades.js, pessoas-dados.js, pessoas.js, projetos.js, documentos.js, MODULOS.md; server/test/helpers/aplicacao.js, fixtures/autorizacao-canario.js e execucao-testes.test.js; controles 06/07/08 e contrato prévio 09. Nenhuma alteração de dependências, versões SQL publicadas, frontend ou banco real em P45.

**TESTES:** baseline anterior completo 1187/1187. Após cada extração: autenticação+autorização+canário 144/144 (3 suítes, 6041.8369 ms, labhist-p45-auth.log); pessoas+autorização 347/347 (2 suítes, 3773.856 ms, labhist-p45-pessoas.log); projetos 170/170 (5 suítes, 87443.5895 ms, labhist-p45-projetos.log); documentos 86/86 (5 suítes, 47446.245 ms, labhist-p45-documentos.log). Todos saída 0, sem falhas/cancelamentos/ignorados. Sintaxe de sete módulos aprovada. Regressão completa em labhist-p45-regressao.log ainda pendente.

**ERROS:** nenhum defeito de produto detectado nas extrações. Helper adaptado para carregar módulos extraídos na VM com os mesmos doubles, evitando I/O do projeto; canário agora remove requireAdmin somente da cópia de autenticacao.js e confere hashes de index.js e autenticacao.js. Seis alertas npm anteriores permanecem fora desta refatoração.

**STATUS:** Aguardando teste integral; não marcar concluído antes do resultado.

**PRÓXIMO PROMPT:** P34, após tarefa prévia de vínculo/publicação, aprovada explicitamente pelo usuário junto com a política/tarefa prévia de correção D08. Contratos em 09; próximos quatro autorizados selecionados: P45 → P34 → P35 → P36. P38/P39/P44/P46 não iniciados.

### Fechamento P45

**TESTES:** regressão completa concluída com saída 0, 1187/1187 e 38 suítes, zero falhas/cancelamentos/ignorados. Contagens por fase registradas no log labhist-p45-regressao.log. Imports estáticos: 40 módulos existentes, sem ciclos, sem executar o serviço real. Guia server/TESTES.md também atualizado quanto ao canário.

**STATUS:** Concluído em 19/10/2026. **PRÓXIMO PROMPT:** P34 após tarefa prévia de vínculo/publicação autorizada. Total 39/46; nenhum requisito de compatibilidade física declarado concluído.

## Tarefa prévia autorizada de P34 — vínculo/publicação

**ALTERAÇÕES:** contrato 09 implementado, configuração administrativa explícita em GET/PUT /quizzes/:id/disponibilidade e tela “Vínculo e publicação”; novos quizzes começam rascunhos privados até configurar. Legados sem dedução. Migração 014 inclui projeto opcional para rascunho, subprojeto opcional consistente, FKs RESTRICT, FK composta e CHECK de estados/publicação. Serviço compartilhado verifica disponibilidade e vínculo atual. Histórico continua bloqueando edição inteira. Não conta como prompt adicional dos 46.

**ARQUIVOS MODIFICADOS:** server/disponibilidade-quizzes.js, quizzes.js (exports internos), index.js, banco/esquema.js, migrador.js, migracoes.js, quizzes-esquema.js, versoes/014-disponibilidade-quizzes.js; mainPage/cadastro.js/menuCadastro.html; testes disponibilidade-quizzes e quizzes-academico-interface; helpers/aplicacao.js, scripts/testes.js; guias QUIZZES/BANCO-DE-DADOS/MODULOS; documentos 07/08/09.

**TESTES:** 11/11 HTTP/MySQL reais descartáveis, saída 0, 30990.9594 ms (labhist-pre-p34-disponibilidade.log); 4/4 Chrome/HTTP/MySQL reais, saída 0, 27354.6074 ms (labhist-pre-p34-interface.log). Inclui seleção de subprojeto, publicação/opt-in público, erro de rede, formulário preservado e troca de perfil. Regressores de esquema/quizzes administrativos em labhist-pre-p34-regressao.log ainda em andamento.

**ERROS:** revisão identificou que falha ao listar subprojetos poderia permitir salvar seleção incompleta; formulário agora exige carga válida e mantém salvamento desabilitado até corrigir/recarregar. Sem rejeição não tratada em eventos onchange. Nenhum dado real tocado.

**STATUS:** Aguardando regressão de esquema/admin e reconferência dos controles de carregamento no navegador; P34 ainda não iniciado. **PRÓXIMO PROMPT:** P34 após validar esta dependência.

### Fechamento da tarefa prévia de vínculo/publicação

**TESTES:** regressão de esquema e quizzes administrativos 68/68, 2 suítes, saída 0, 95163.5887 ms (labhist-pre-p34-regressao.log). Reconferência final do formulário 4/4 Chrome/HTTP/MySQL, saída 0, 21230.494 ms (labhist-pre-p34-interface-final.log), incluindo bloqueio quando subprojetos não carregam. **STATUS:** Concluída como dependência, sem incrementar total dos 46. **PRÓXIMO PROMPT:** P34 iniciado após este fechamento. Versão preparada 014, sem migração real.

## Execução P34 — catálogos de quizzes

**PROMPT EXECUTADO:** P34 — Catálogos de quizzes para aluno e visitante, após vínculo/publicação validado.

**ALTERAÇÕES:** rotas mínimas e separadas em /aluno/quizzes e /publico/quizzes (lista/detalhe). Aluno usa identidade/vínculo atual; visitante somente título/introdução de publicados com opt-in explícito. Sem perguntas/gabarito nas duas introduções, com contratos administrativos intactos. Menu/telas de lista/introdução do aluno e seção pública com vazio/erro/recarga; texto literal, sequência de navegação e limpeza em mudança de identidade. Nenhuma submissão antecipada.

**ARQUIVOS MODIFICADOS:** server/catalogo-quizzes.js, index.js, scripts/testes.js, test/helpers/aplicacao.js, test/catalogo-quizzes.test.js, test/quizzes-academico-interface.test.js; mainPage/menuCadastro.html/cadastro.js; publico/index.html/publico.js/publico.css; guias QUIZZES/PUBLICO e controles 06/08.

**TESTES:** 10/10 HTTP/MySQL reais descartáveis, saída 0, 24840.4235 ms (labhist-p34-catalogo.log). Testa listas/detalhes mínimos, projeto alheio, rascunho/arquivado/legado, retirada de vínculo/opt-in, identidade forjada, perfil/anônimo antes do SQL, IDs e falha SQL sanitizada. Navegador e regressão de P33/P28/P30/P32 em labhist-p34-navegador.log pendentes de fechamento.

**ERROS:** nenhum erro de produto identificado nos testes de API. **STATUS:** Aguardando teste de navegador/regressão. **PRÓXIMO PROMPT:** após conclusão, tarefa prévia de correção aprovada antes de P35; depois P35/P36.

### Fechamento P34

**TESTES:** navegador 50/50, 3 suítes, saída 0, 44957.3398 ms (labhist-p34-navegador.log), zero falhas/cancelamentos/ignorados. Nove casos integrados Chrome/HTTP/MySQL reais da disponibilidade/catálogo e regressões P33/P28/P30/P32 com API/DB controlados. **STATUS:** Concluído; 40/46. **PRÓXIMO PROMPT:** P35 após tarefa prévia de correção aprovada, iniciada somente agora. Sem migração real.

## Tarefa prévia de correção D08 — concluída antes de P35

**ALTERAÇÕES:** serviço server/correcao-quizzes.js usa somente gabarito do servidor, exige todas as perguntas uma vez, valida alternativa pertencente à pergunta e calcula um ponto/acerto, zero/erro, percentual acertos ÷ total × 100, sem arredondamento adicional. Retorna respostas normalizadas para persistência/reenvio; não cria endpoint público nem aceita nota. **ARQUIVOS MODIFICADOS:** serviço, test/correcao-quizzes.test.js e controle 08. **TESTES:** 9/9 unitários, saída 0, zero falhas/cancelamentos/ignorados (labhist-pre-p35-correcao.log): zero/total/parcial/fração, ordem, falta/duplicação, pergunta/alternativa alheia, nota forjada e gabarito inconsistente. **ERROS:** nenhum. **STATUS:** Concluída como dependência, sem incremento dos 46. **PRÓXIMO PROMPT:** P35, iniciado após esta validação; disponibilidade já validada em 014.

## Execução P35 — respostas e resultados

**PROMPT EXECUTADO:** P35 — Persistir respostas e resultados com identidade do aluno.

**ALTERAÇÕES:** POST transacional usa identidade atual da sessão e correção aprovada/testada; grava resultado e respostas atomicamente. Conta142/pessoa42 distintas preservadas nos testes. UNIQUE por quiz/aluno e travas previnem duplicação; reenvio idêntico retorna resultado salvo, outro conjunto recusa409. GET atividade entrega estrutura sem gabarito e resultado próprio. Histórico real bloqueia edição/exclusão/configuração. Migração explícita 015 com FKs RESTRICT, UNIQUE e CHECK; nenhum dado real tocado.

**ARQUIVOS MODIFICADOS:** server/resultados-quizzes.js, index.js, banco/esquema.js/migrador.js/migracoes.js/versoes/015-resultados-quizzes.js; test/resultados-quizzes.test.js, catalogo-quizzes.test.js, esquema.test.js, integridade-projetos.test.js, quizzes.test.js, helpers/aplicacao.js, scripts/testes.js; guias QUIZZES/BANCO-DE-DADOS e controles 06/08. Fixtures de DROP agora removem respostas/resultados antes dos pais, preservando FKs.

**TESTES:** 20/20 HTTP/MySQL reais descartáveis, saída 0, 35816.436 ms, sem falhas/cancelamentos/ignorados (labhist-p35-resultados.log). Inclui zero/total/parcial, perfis antes SQL, identidade/nota forjadas, respostas inválidas, vínculo/identidade removidos, falha parcial, reenvios/conjuntos diferentes, concorrência, confirmação perdida após COMMIT, isolamento entre alunos, histórico e migração014→015/startup. Correção prévia 9/9. Sintaxe do teste corrigida antes da execução válida (regex de expectativa escapada incorretamente); não houve execução parcial creditada como aprovada.

**ERROS:** nenhum defeito de produto identificado no ensaio final. **STATUS:** Concluído em 19/10/2026, 41/46. Sem teste manual indispensável ao endpoint identificado; regressão global ocorrerá após P36, incluindo esquema e rotas antigas. **PRÓXIMO PROMPT:** P36 — interface do aluno para responder quiz, agora iniciado.

## Execução P36 — interface de resposta do aluno

**PROMPT EXECUTADO:** P36 — Interface do aluno para responder quiz.

**ALTERAÇÕES:** formulário de escolha única sem gabarito, validação de todas as perguntas, foco/mensagens, envio de IDs de pergunta/alternativa sem identidade ou nota. Resultado vem do servidor persistido e quiz concluído reabre bloqueado. Falhas preservam seleções, consulta de resultado não apaga rascunho e reenvio idêntico recupera confirmação perdida. Controle de duplo clique/sequência, limpeza em troca de identidade/expiração e layout/teclado dos controles novos.

**ARQUIVOS MODIFICADOS:** mainPage/menuCadastro.html, cadastro.js, menu.css; server/test/quizzes-academico-interface.test.js; integração final ajusta fixtures antigas integridade-projetos.test.js e subprojetos.test.js para respeitar novas FKs nos ensaios de downgrade/recriação descartáveis; guias QUIZZES/TESTES/MODULOS, contrato09 e controles06/08.

**TESTES:** 22/22 Chrome/HTTP/MySQL reais, saída0, 49648.6445 ms (labhist-p36-navegador.log), incluindo nove casos da disponibilidade/catálogo e13 P36. Mais2/2 casos adicionados e selecionados, saída0, 33021.8674 ms (labhist-p36-extremos.log): nota zero e texto longo/HTML literal a390px. São24 casos únicos; regressão completa repetirá todos sem filtro. Clique duplo, SQL/rede, conflito409, confirmação perdida (rede controlada após encaminhar gravação real), reabertura, arquivamento prévio, sessão encerrada, navegação durante envio e Enter/orientação móvel. Não equivale a Android/iOS físico. Sintaxe de21 arquivos de aplicação/CLI aprovada antes do npm test.

**ERROS:** nenhum defeito de produto observado nos ensaios locais. Revisão das fixtures identificou novas FKs em testes antigos de DROP; ordem dos filhos corrigida e a FK de quiz/subprojeto removida explicitamente somente na fixture antes de recriar o legado e reaplicar migrações. FKs do produto não desabilitadas. Seis alertas npm anteriores continuam pendentes.

**STATUS:** Aguardando teste integral em labhist-lote-p45-p34-p35-p36-final.log. **PRÓXIMO PROMPT:** P38 após encerramento e nova autorização; nenhum quinto prompt iniciado.

### Inventário do lote P45/P34/P35/P36 e tarefas prévias

47 arquivos criados/alterados nesta execução; lista consolidada (sem versões SQL001–013, dependências ou arquivos reais de ambiente/dados):

- docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md
- docs/auditoria-ers/07-DUVIDAS-DA-ERS.md
- docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md
- docs/auditoria-ers/09-CONTRATOS-PREVIOS-QUIZZES.md
- mainPage/cadastro.js
- mainPage/menu.css
- mainPage/menuCadastro.html
- publico/index.html
- publico/publico.css
- publico/publico.js
- server/BANCO-DE-DADOS.md
- server/MODULOS.md
- server/PUBLICO.md
- server/QUIZZES.md
- server/TESTES.md
- server/autenticacao.js
- server/banco/esquema.js
- server/banco/migracoes.js
- server/banco/migrador.js
- server/banco/quizzes-esquema.js
- server/banco/versoes/014-disponibilidade-quizzes.js
- server/banco/versoes/015-resultados-quizzes.js
- server/catalogo-quizzes.js
- server/correcao-quizzes.js
- server/disponibilidade-quizzes.js
- server/documentos.js
- server/identidades.js
- server/index.js
- server/pessoas-dados.js
- server/pessoas.js
- server/projetos.js
- server/quizzes.js
- server/resultados-quizzes.js
- server/scripts/testes.js
- server/subprojetos.js
- server/test/catalogo-quizzes.test.js
- server/test/correcao-quizzes.test.js
- server/test/disponibilidade-quizzes.test.js
- server/test/esquema.test.js
- server/test/execucao-testes.test.js
- server/test/fixtures/autorizacao-canario.js
- server/test/helpers/aplicacao.js
- server/test/integridade-projetos.test.js
- server/test/quizzes-academico-interface.test.js
- server/test/quizzes.test.js
- server/test/resultados-quizzes.test.js
- server/test/subprojetos.test.js

### Regressão integrada — falha identificada e correção em verificação

Primeiro npm test do lote (labhist-lote-p45-p34-p35-p36-final.log), saída1: fase segurança/banco1004 casos,999 aprovados/5 falhas,32 suítes,599767.9429 ms. Navegador não iniciado pelo executor. Cinco falhas P22 revelaram regressão real: o guard de exclusão de subprojeto tratava a segunda coluna da FK composta de014 como referência desconhecida e recusava até registros sem dependentes. Não foi declarado aprovado.

Correção em server/subprojetos.js agrupa por restrição e reconhece exclusivamente a FK composta aprovada quiz(subprojeto_id,projeto_id)→subprojeto(id,projeto_id). Consulta dependência pelo subprojeto, bloqueia quando existe quiz e preserva proteção de FKs externas/desconhecidas. Nenhuma FK/validação do produto removida. Teste adicional em disponibilidade-quizzes comprova que o irmão sem dependente é excluído enquanto o subprojeto do quiz permanece protegido. Regressores pertinentes e repetição completa ainda pendentes. P36 continua Aguardando teste.

Correção da integração validada localmente: 62/62,2 suítes,saída0,47334.141 ms (labhist-lote-subprojetos-correcao.log), zero falhas/cancelamentos/ignorados. Inclui50 testes anteriores de subprojetos e12 de disponibilidade, com caso novo de irmão sem dependente versus subprojeto vinculado. Repetição completa agora em labhist-lote-p45-p34-p35-p36-confirmacao.log; status P36 permanece Aguardando teste até esse fechamento.

## Fechamento do lote P45 → P34 → P35 → P36 — 19/10/2026

**PROMPTS EXECUTADOS:** P45 — Separar módulos do backend; P34 — Catálogos de quizzes; P35 — Respostas/resultados; P36 — Interface do aluno. Cada etapa e dependência prévia foi validada antes do consumidor.

**ALTERAÇÕES:** bootstrap/domínios separados preservando os contratos anteriores; vínculo/publicação e correção aprovados implementados; catálogos mínimos por vínculo/opt-in, atividade sem gabarito, respostas e resultado transacionais com uma tentativa/reenvio seguro; formulário do aluno com erros preservando escolhas e resultado persistido. Integração de exclusão de subprojetos corrigida para a FK composta, sem remover proteção de dependentes.

**ARQUIVOS MODIFICADOS:** 47, inventário consolidado acima. Inclui server/subprojetos.js pela correção da integração; nenhum arquivo de dados/configuração real ou dependência foi alterado. Grafo final: 47 módulos locais, imports presentes e sem ciclos, conferido sem executar serviço real.

**TESTES:** saída 0 no npm test de confirmação; 1005/1005 segurança/banco (32 suítes, 394150.0482 ms) e257/257 navegador (10 suítes, 87635.0642 ms), total1262/1262 em 42 suítes. Zero falhas, cancelamentos, ignorados e todo. 35 arquivos; não somar novamente ensaios repetidos. Logs intermediários e primeiro ensaio falho permanecem discriminados.24 casos de quizzes com Chrome/HTTP/MySQL reais; falhas de rede controladas explicitamente, sem SMTP/produção ou aparelho físico. Sintaxe dos21 arquivos iniciais e de subprojetos após correção aprovada. Verificação de limpeza confirmou zero mysqld de fixture.

**ERROS:** regressão detectada de exclusão indevidamente bloqueada por FK composta corrigida e coberta por teste positivo/negativo; casos antigos e novos aprovados na repetição completa. Seis alertas npm previamente documentados permanecem, sem declarar auditoria de dependências limpa.

**STATUS:** P36 Concluído; lote encerrado com 42/46 e quatro pendentes. Migrações014/015 apenas preparadas/testadas, sem execução no banco real. Nenhum teste manual indispensável identificado para esses contratos automatizados; homologação física e metas permanecem P44.

**PRÓXIMO PROMPT:** P38 — Histórico do próprio aluno; não iniciado. P39/P44/P46 mantêm as condições registradas. Encerrados os quatro autorizados, sem quinto prompt.

## Lote final autorizado — P38 → P39 → P44 → P46

19/10/2026: usuário solicitou implementar os quatro restantes. P38 iniciado; D06/P39 e matriz/metas D12/P44 apresentadas para decisão, sem presumi-las. Dependências serão verificadas individualmente. Banco real preservado; testes usarão fixtures descartáveis.

### P38 — implementação e validação em andamento

**PROMPT EXECUTADO:** P38 — Histórico do próprio aluno. **ALTERAÇÕES:** GET /aluno/resultados usa pessoa da sessão atual, recusa filtros de identidade, retorna projeção mínima de resultados persistidos em ordem data/ID. Inclui próprios resultados anteriores mesmo com quiz arquivado ou vínculo de projeto removido; não depende de disponibilidade para responder. Menu Meu desempenho com vazio/erro/recarga, texto literal e limpeza/sequência na navegação e identidade. Sem gráfico/ranking ou nova migração. **ARQUIVOS MODIFICADOS:** server/historico-quizzes.js, resultados-quizzes.js (exports compartilhados), index.js, test/helpers/aplicacao.js, scripts/testes.js, test/historico-quizzes.test.js, test/quizzes-academico-interface.test.js; mainPage/cadastro.js/menuCadastro.html/menu.css; controle08. **TESTES:** 7/7 HTTP/MySQL reais descartáveis, saída0,19546.1937 ms (labhist-p38-api.log); perfis antes SQL, conta142/pessoa42, resultados alheios, query forjada, vazio/múltiplos, revogação e falha sanitizada. Navegador/regressão em labhist-p38-navegador.log em andamento. **ERROS:** nenhum até aqui. **STATUS:** Aguardando teste. **PRÓXIMO PROMPT:** P39 após decisão D06 e conclusão de P38; D12/P44 também pendente de resposta.

## Fechamento P38 — 19/10/2026

**PROMPT EXECUTADO:** P38 — Histórico do próprio aluno.

**ALTERAÇÕES:** consulta e menu Meu desempenho com resultados próprios persistidos, vazio/erro/recarga e limpeza ao mudar identidade. Preserva histórico próprio após arquivamento do quiz ou remoção do projeto. Sem gabarito, ranking ou identidade fornecida pelo navegador.

**ARQUIVOS MODIFICADOS:** os dez arquivos de código/testes inventariados na implementação acima, mais server/QUIZZES.md e controles06/08.

**TESTES:** API7/7,1suíte,19546.1937ms (labhist-p38-api.log); Chrome26/26,1suíte,49817.7663ms (labhist-p38-navegador.log), incluindo24 casos anteriores e2 novos. Ambos saída0, zero falhas/cancelamentos/ignorados/todo. Banco/HTTP/Chrome reais descartáveis; erros de rede controlados. Sintaxe do cadastro.js aprovada. Não é uma nova regressão integral nem homologação física.

**ERROS:** nenhum nesses ensaios. Seis alertas npm anteriores continuam documentados, sem mudança de dependências.

**STATUS:** Concluído;43/46. Nenhum teste manual indispensável identificado para este contrato automatizado. Sem mudança de esquema ou acesso ao banco real.

**PRÓXIMO PROMPT:** P39 após resposta D06; P44 após resposta D12; P46 depende de P44. Perguntas enviadas ao usuário neste lote permanecem pendentes. A autorização para executar o lote está mantida; faltam decisões de negócio/aceitação, não nova autorização geral.

## P39 — implementação em validação

D06 aprovada pelo usuário em19/10/2026, registrada em07. GET /professor/resultados e /professor/resultados/:id filtram por ambos os vínculos atuais ao projeto e pessoa da sessão. Quiz arquivado permanece consultável. Detalhe inclui apenas pergunta/alternativa escolhida, sem gabarito nem contatos. Menu exclusivo do professor, vazio/erro/recarga e descarte de requisições atrasadas. Sem migração. Arquivos: server/historico-quizzes.js/index.js e testes historico-quizzes/quizzes-academico-interface; mainPage/cadastro.js/menuCadastro.html; controles07/08. Testes HTTP/MySQL/Chrome descartáveis em labhist-p39.log. Status:Aguardando teste; próximo:P44 após fechamento.

## Fechamento P39 / início P44 —19/10/2026

**PROMPT EXECUTADO:** P39. **ALTERAÇÕES:** acompanhamento conforme D06, lista/detalhe sem gabarito e menu exclusivo com revogação por vínculo atual. **ARQUIVOS MODIFICADOS:** historico-quizzes.js/index.js, mainPage/cadastro.js/menuCadastro.html, testes historico-quizzes/quizzes-academico-interface/helpers/aplicacao e guias/controles06/07/08. **TESTES:** primeiro43/43 API/Chrome; regressão documentos revelou erro intermitente ERR_VM_MODULE_LINK_FAILURE no loader VM de testes. Corrigido helper para pré-criar grafo e deixar linker nativo ligar imports compartilhados uma vez, sem link recursivo concorrente. Repetição completa pertinente86/86,4suítes,75161.3095ms,saída0, zero falhas/cancelamentos/ignorados/todo (labhist-p39-confirmacao.log). Inclui15API histórico/acompanhamento,28Chrome quizzes/históricos,43documentos; não somar ensaios repetidos. **ERROS:** falha do loader corrigida; código de autorização não foi enfraquecido. **STATUS:** Concluído;44/46. **PRÓXIMO PROMPT:** P44, matriz/metas D12 aprovada registrada em07, ensaios locais reais descartáveis e emulação móvel; dispositivos físicos fora do escopo aprovado.

## P44 — matriz e correções em validação

Matriz/metas explicitamente aprovadas em07. Fixture HTTP/MySQL/arquivos isolada,100 projetos/100 alunos/20 quizzes, duas instalações reais de navegador em modo headless, emulação de toque/viewport/teclado. Primeiro ensaio1/13 (labhist-p44-inicial.log) reproduziu overflow com título longo e exclusão invisível no foco em ambos browsers; não aprovado. Corrigidos mínimo de flex, quebra do título/topbar/rodapé, visibilidade por foco/toque e rótulos estáticos de projeto/upload/login. Navegação principal passou a botões nativos, com IDs/handlers preservados e aria-expanded no menu. Segundo ensaio encontrou erro na expressão de geração do PDF pela fixture (não no upload); corrigido escape/geração em bytes. Confirmação13/13,3suítes,saída0,34989.7383ms (labhist-p44-confirmacao.log), mas ensaio final repete com medição incluindo dois frames e toque no overlay, além de regressões de projetos/pessoas/operação. Não declarado concluído até fechamento. Arquivos: mainPage/menuCadastro.html/menu.css/cadastro.js, login/login.html, teste homologacao-interface, helpers/navegador (executável opcional), scripts/testes e documentação.

## Fechamento P44 —19/10/2026

**PROMPT EXECUTADO:** P44. **ALTERAÇÕES:** correções de overflow/texto longo, visibilidade de exclusão por foco/toque, labels associados e menu operável como botão nativo. Matriz, passos, limites e métricas em10-HOMOLOGACAO-LOCAL.md/json. **ARQUIVOS MODIFICADOS:** mainPage/menuCadastro.html/menu.css/cadastro.js; login/login.html; server/test/homologacao-interface.test.js/helpers/navegador.js/scripts/testes.js; documentação06/08/10. **TESTES:** labhist-p44-final.log,102/102,5suítes,saída0,54442.7359ms, zero falhas/cancelamentos/ignorados/todo. Matriz13casos (3suítes, duas instalações/10combinações) com HTTP/MySQL/arquivos reais descartáveis; outros89 casos de pessoas/projetos/operação com os doubles documentados. API P95projetos23.56ms,alunos16.33ms,quizzes16.39ms (20amostras/rota). Ação máxima Chrome149.86ms/Edge450.15ms; upload máximo68.32/70.72ms, incluindo dois frames. Dentro das metas locais1000/2000/5000ms. **ERROS:** os defeitos reproduzidos foram corrigidos; primeiros ensaios falhos preservados, fixturePDF corrigida. **STATUS:** Concluído, exclusivamente matriz local aprovada;45/46. Não exige confirmação manual adicional para esse escopo aprovado de automação; Android/iOS físicos/rede de produção continuam sem homologação. **PRÓXIMO PROMPT:** P46 — extração incremental sem alteração visual/contratos.

## P46 — extrações implementadas, aguardando confirmação integrada

**PROMPT EXECUTADO:** P46. **ALTERAÇÕES:** dez módulos clássicos por responsabilidade; entrada cadastro.js com12linhas. IDs/handlers preservados, sem framework ou alteração visual neste prompt. Estados movidos aos respectivos domínios, sem globals adicionais; compatibilidade do HTML documentada. Carga única sequencial antes da entrada, sem imports/ciclos de inicialização. **ARQUIVOS MODIFICADOS:** mainPage/cadastro.js/menuCadastro.html/MODULOS.md, modulos/api/comum/pessoas/navegacao/sessao/projetos/subprojetos/documentos/quizzes/desempenho.js; teste homologacao-interface (handlers inline/teclado) e guias/controle. **TESTES:** API/sessão/navegação50/50,3suítes,12143.6328ms; pessoas75/75,2suítes,6903.4772ms; projetos/subprojetos57/57,1suíte,9818.9771ms; documentos/quizzes106/106,3suítes,66303.1501ms. Todos saída0, zero falhas/cancelamentos/ignorados/todo. Logs labhist-p46-api-sessao-navegacao/pessoas/projetos-subprojetos/documentos-quizzes.log. Conferência VM comprovou110 funções textualmente preservadas,10scripts únicos e sintaxe conjunta válida; não executou bootstrap real. **ERROS:** nenhum nas extrações. **STATUS:** Aguardando teste da matriz e npm test completo; não concluído antecipadamente. **PRÓXIMO PROMPT:** nenhum adicional; fechar o lote autorizado após validação final.

### Inventário consolidado do lote final

32 arquivos de aplicação/testes/documentação criados ou modificados neste lote, incluindo P38 encerrado antes da resposta D06/D12. Não há arquivo de migração, dependência, configuração ou dado real neste inventário.

- docs/auditoria-ers/06-PENDENCIAS-DO-PROJETO.md
- docs/auditoria-ers/07-DUVIDAS-DA-ERS.md
- docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md
- docs/auditoria-ers/10-HOMOLOGACAO-LOCAL-POS-P46.json
- docs/auditoria-ers/10-HOMOLOGACAO-LOCAL.json
- docs/auditoria-ers/10-HOMOLOGACAO-LOCAL.md
- login/login.html
- mainPage/MODULOS.md
- mainPage/cadastro.js
- mainPage/menu.css
- mainPage/menuCadastro.html
- mainPage/modulos/api.js
- mainPage/modulos/comum.js
- mainPage/modulos/desempenho.js
- mainPage/modulos/documentos.js
- mainPage/modulos/navegacao.js
- mainPage/modulos/pessoas.js
- mainPage/modulos/projetos.js
- mainPage/modulos/quizzes.js
- mainPage/modulos/sessao.js
- mainPage/modulos/subprojetos.js
- server/QUIZZES.md
- server/TESTES.md
- server/historico-quizzes.js
- server/index.js
- server/resultados-quizzes.js
- server/scripts/testes.js
- server/test/helpers/aplicacao.js
- server/test/helpers/navegador.js
- server/test/historico-quizzes.test.js
- server/test/homologacao-interface.test.js
- server/test/quizzes-academico-interface.test.js

Validação complementar P46: matriz pós-extração13/13,3suítes,saída0,56366.0542ms (labhist-p46-matriz.log), com métricas/limites em10 e10-HOMOLOGACAO-LOCAL-POS-P46.json. Conferência inline exercitada também com canário em memória: chamada ausente detectada e método event.preventDefault corretamente ignorado. Grafo backend atual48 módulos locais, imports presentes e zero ciclos, conferido sem executar bootstrap. npm test integral em labhist-lote-p38-p39-p44-p46-final.log permanece em execução; P46 ainda Aguardando teste.

## Fechamento P46 e lote final —19/10/2026

**PROMPT EXECUTADO:** P46 — Separar módulos do frontend preservando fluxos. Lote P38/P39/P44/P46 encerrado; aprovações D06/D12 em07.

**ALTERAÇÕES:** dez módulos clássicos por responsabilidade e entrada cadastro.js com12linhas. API/sessão, navegação, pessoas, projetos/subprojetos, documentos, quizzes e desempenho separados; handlers/IDs e110 funções preservados, sem framework ou redesenho neste prompt. Colaboração e ordem de carregamento documentadas. P38/P39 entregaram histórico próprio e acompanhamento restrito; P44 corrigiu defeitos observados e executou a matriz/metas locais aprovadas.

**ARQUIVOS MODIFICADOS:**32 no inventário consolidado acima, incluindo aplicação, testes e guias/controle. Nenhuma dependência, migração ou dado/configuração real alterado.

**TESTES:** npm.cmd --prefix server --logs-max=0 test,saída0 (labhist-lote-p38-p39-p44-p46-final.log). Segurança/banco1020/1020,33suítes,820351.2884ms; navegador274/274,13suítes,245351.9474ms. Total1294/1294,46suítes,37arquivos, zero falhas/cancelamentos/ignorados/todo. Matriz nesta regressão81359.1956ms,13/13 casos, inclui teclado em desktop explicitamente restaurado após toque emulado; aguarda condição visual final sem aumentar timeout. Cobre login/CRUD, upload/download, navegação/sidebar, erros/sessão, isolamento/revogação, transações/migrações e contratos anteriores. Ensaios incrementais e métricas pré/pós em10 não são contados duas vezes. Conferência documental final46caixas e46 registros únicos concluídos; verificação CIM sem processos próprios MySQL/Chrome/Edge remanescentes.

**ERROS:** testes da primeira regressão de documentos revelaram corrida do loader VM; corrigida a ligação compartilhada dos módulos e confirmada nesta suíte completa. Matriz inicial revelou overflow e exclusão invisível no foco; produto corrigido, geraçãoPDF da fixture ajustada e ensaios repetidos. Nenhuma falha pendente nesta regressão. Seis alertas npm anteriormente documentados continuam pendentes, sem atualização neste lote.

**STATUS:** P46 Concluído. **46/46 prompts concluídos no escopo autorizado**, com P44 limitado à matriz/metas locais explicitamente aprovadas. Sem teste manual indispensável pendente para esse escopo automatizado. Android/iOS físicos, rede/SMTP de produção, migrações/configuração reais e funcionalidades fora da lista não foram homologados/implantados nem presumidos resolvidos.

**PRÓXIMO PROMPT:** nenhum dos46. Trabalho autorizado do lote encerrado; nenhuma nova tarefa externa/implantação iniciada.
