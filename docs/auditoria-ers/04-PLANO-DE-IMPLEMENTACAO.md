# Plano de implementação incremental

**Sequência autorizada em 18/10/2026:** P06 → P13 → P14 → P07 → P08, validando uma tarefa por vez dentro do lote. Proposta R02 aceita pelo usuário; regras D10/D11 aprovadas estão no arquivo 07. IDs, escopos e demais dependências preservados.

Data-base: 15/10/2026. São **46 prompts**, cada qual com objetivo verificável e entrega própria no documento 05. Este plano não executou mudanças. **P0** indica falha crítica/alta de segurança; **P1**, base/funcionalidade confirmada; **P2**, validação e manutenção. Requisitos removidos ou indefinidos não são executados pelo plano.

## Regras de execução e decisões anteriores ao código

1. Leia [07 — Dúvidas](07-DUVIDAS-DA-ERS.md) e confirme somente as decisões necessárias à próxima tarefa. D01 mantém editais fora do desenvolvimento e exige consolidar o documento. Conteúdos RF23–RF27/RN05, publicação RF36, cálculo RF40 e evolução RF52 continuam sem prompt específico de implementação.
2. Execute um prompt por vez a partir do documento 05. A numeração representa a ordem recomendada entre tarefas liberadas. Dependências prevalecem sobre a numeração; um item bloqueado pode ser aguardado enquanto se executa outro independente.
3. P04/P05 têm prioridade estrutural P1, mas vêm antes de P06–P09 porque identidade, autoria e validação em banco precisam de migração/transação confiáveis. A contenção P01/P02 não deve aguardar um redesign completo.
4. Use banco descartável e transporte de e-mail falso para os testes. Migração de dados legados requer diagnóstico e regra aprovada; nenhum prompt autoriza apagar dados reais ou inventar autoria. Não coloque credenciais no relatório de execução.
5. Verifique a existência e o estado atual dos arquivos antes de aplicar um prompt. A fotografia original tem código monolítico; após extrações, localize o módulo equivalente. Atualize a matriz só com evidência suficiente, distinguindo teste com mock de persistência real.
6. Uma entrega parcial de camadas (por exemplo, API de subprojeto) não torna o RF implementado: conclua o formulário/integração correspondente e valide regras, autorização e banco.

## Sequência recomendada

| Ordem / prompt | Objetivo | Prioridade | Dependências e travas | Requisitos |
|---|---|---|---|---|
| P01 | Autenticação com senha e proteção das credenciais | P0 | D11 exige procedimento de migração de credenciais legadas; a correção imediata do login sem senha não depende dessa definição. | RF01, RF03, RS02, RS03, RS04, RN02 |
| P02 | Autorizar operações administrativas no servidor | P0 | Preferencialmente P01 (autenticação com senha); pode corrigir a autorização central antes dela. | RF04, RF07–RF18, RS01, RS05, RN01 |
| P03 | Configurar origem da API, CORS e cookies | P0 | P01; D12 para parâmetros do ambiente de implantação. | RNF11, RC01, RC04, RS04 |
| P04 | Organizar instalação e migrações do banco | P1 | P01 remove bootstrap inseguro. Não combinar aqui migração de autoria P09 nem integridade P10. | RNF08, RNF10, RF44, RF47 |
| P05 | Isolar transações por conexão de pool | P1 | P04: ambiente de banco isolado e schema versionado. | RNF09, RNF10, RF15, RF17, RF18 |
| P06 | Vincular credenciais a alunos e professores | P0 | P01 (hash e login), P04/P05 (migração e transação); D10/D11 (identificador e legados). | RF01, RF03, RF07, RF11, RF47, RN11 |
| P07 | Filtrar recursos acadêmicos por identidade e vínculo | P0 | P01 e P06: identidade autenticada vinculada a pessoa; P02: privilégios administrativos. | RF04, RF08, RF12, RF16, RF43, RF44, RF48, RS01, RS04, RS05, RN06 |
| P08 | Download autenticado dos documentos | P0 | P07: regras de vínculo; P09 pode depois substituir o formato legado da autoria. | RF44, RF48, RS07, RN02 |
| P09 | Corrigir identidade do autor dos documentos | P0 | P06, P04 e D07/D10 para preservação de autores legados. | RF47, RF48, RS04, RS07 |
| P10 | Validar relações e integridade dos projetos | P1 | P04, P05; não muda quantidades de membros sem D09. | RF15, RF17, RS06, RN08 |
| P11 | Validar cadastro e edição de pessoas na API | P1 | P02; D10 somente para campos específicos/identificador do professor. | RF07, RF09, RF11, RF13, RS06, RN08 |
| P12 | Validar formulário de aluno e aplicar máscara de telefone | P1 | P11: contrato e mensagens de validação da API. | RF07, RF09, RS06, RN08, RN09 |
| P13 | Usar sessão do servidor como identidade na interface | P1 | P01, P02 e P06. | RF01, RF03, RF04, RNF02 |
| P14 | Tratar respostas HTTP antes de atualizar a interface | P1 | P13 estabelece sessão; pode ser preparada com respostas simuladas antes. | RNF03, RF08, RF12, RF16 |
| P15 | Respostas corretas para recursos ausentes e erros da API | P1 | P02 e P05; integração com P14. | RF09, RF10, RF13, RF14, RF17, RF18, RNF03 |
| P16 | Validar e limitar uploads de documentos | P1 | P07, P08, P04; limite operacional deve ser documentado sem apresentar como requisito da ERS. | RF44, RF45, RS06, RS07 |
| P17 | Coordenar exclusão de projeto e arquivos físicos | P1 | P02, P08, P04 e P05. | RF18, RF44, RS07 |
| P18 | Adicionar status do projeto | P1 | P02, P04 e P10; classificação inicial dos legados deve ser acordada na execução. | RF15, RF16, RF17 |
| P19 | Mostrar informações do projeto aos participantes | P1 | P07, P13 e P18; participação além do vínculo administrativo aguarda D09. | RF16, RF43, RF48, RNF02 |
| P20 | Modelo e API de cadastro de subprojeto | P1 | P02, P07, P04 e P10. | RF19, RF20, RN04 |
| P21 | API de edição de subprojeto | P1 | P20 e P15. | RF21, RS06 |
| P22 | API de exclusão de subprojeto | P1 | P20/P21, P05/P15; D07 se já houver envios associados. | RF22, RS07 |
| P23 | Lista e detalhe de subprojetos | P1 | P19, P20 e P14. | RF19, RF20, RN04, RNF02 |
| P24 | Formulário de criação de subprojeto | P1 | P20, P23 e P14. | RF20, RS06 |
| P25 | Formulário de edição de subprojeto | P1 | P21, P23, P24 e P14. | RF21, RS06 |
| P26 | Confirmação de exclusão de subprojeto | P1 | P22, P23, P24 e P14. | RF22, RNF03 |
| P27 | Núcleo e API administrativa de criação de quizzes | P1 | P02, P04, P05; D08 para tipo de questão. D03/D04 e RF40 continuam fora deste escopo. | RF33, RS06 |
| P28 | Formulário administrativo de criação de quiz | P1 | P27, P13 e P14. | RF33, RNF03 |
| P29 | API de edição administrativa de quiz | P1 | P27, P05, P15; D08 sobre alterações após respostas. | RF34, RS06 |
| P30 | Formulário administrativo de edição de quiz | P1 | P29, P28 e P14. | RF34, RNF03 |
| P31 | API de exclusão administrativa de quiz | P1 | P27, P05, P15; D08 para retenção. | RF35 |
| P32 | Confirmação de exclusão administrativa de quiz | P1 | P31, P28 e P14. | RF35, RNF03 |
| P33 | Entrada pública e informações de projetos para visitante | P1 | P02, P07 e P08; D02 não bloqueia informações de projeto, mas bloqueia conteúdos educacionais. | RF02, RF42 (base pública), RNF02 |
| P34 | Catálogos de quizzes para aluno e visitante | P1 | P07, P27, P33; D03/D04 e tarefa futura de vínculo/publicação aprovada. | RF37, RF42, RN03 |
| P35 | Persistir respostas e resultados com identidade do aluno | P1 | P01, P07, P06, P05, P27; D03/D04/D08 e futura tarefa de correção/publicação aprovada. BLOQUEADO até essas condições. | RF39, RF49, RN11, RS04 |
| P36 | Interface do aluno para responder quiz | P1 | P34 e P35; decisões D03/D04/D08 resolvidas. | RF38, RN03, RN11 |
| P37 | Texto explicativo independente na submissão de arquivo | P1 | P07, P04, P09, P16; vínculo de atividade permanece bloqueado por D07. | RF46, RF44, RF45 |
| P38 | Histórico de desempenho do próprio aluno | P1 | P13, P14, P35; D08/correção resolvidos. Evolução RF52 continua aguardando D06. | RF51, RF50 (infraestrutura compartilhada), RN11 |
| P39 | Consulta do professor aos resultados acompanhados | P1 | P07, P35, P38; D03/D06 definem acompanhamento; D08/correção implementada. | RF41, RF50, RN07 |
| P40 | API de recuperação de senha por e-mail | P1 | P01, P06, P04; D11: contato de recuperação e transporte. | RF05, RS02, RS03, RS04 |
| P41 | Interface de solicitação e redefinição de senha | P1 | P40 e P14. | RF05, RNF03 |
| P42 | Reduzir consultas e carga da listagem de projetos | P2 | P07 e P05; P14 para erros no frontend. | RF16, RNF06, RNF07 |
| P43 | Disponibilizar verificações reproduzíveis de segurança e persistência | P2 | P02 e P04; ampliar casos conforme P07/P08/P09/P05 forem concluídos. | RNF08, RNF09, RS01, RS04, RS05, RS06, RS07 |
| P44 | Verificar e corrigir interface em dispositivos e navegadores | P2 | P03, P13, P12, P14; D12 define critérios; use banco de homologação. | RNF01, RNF04, RNF05, RNF06, RNF11, RC01, RC02, RC03, RC04, RC05 |
| P45 | Separar módulos do backend preservando contratos | P2 | P43: testes reproduzíveis; principais correções de segurança concluídas. | RNF08, RNF09 |
| P46 | Separar módulos do frontend preservando fluxos | P2 | P13, P14 e P43; P44 para regressão de interface. | RNF08, RNF09 |

## Marcos e critérios para seguir

| Fase | Prompts | Marco verificável |
|---|---|---|
| A — Contenção | P01–P03 | Identidade exige credencial, aluno não executa administração, origem/cookies são explícitos e API não depende do localhost do celular. |
| B — Base confiável | P04–P10 | Banco vazio/legado em ambiente isolado migra, transações são isoladas, conta se liga à pessoa, acesso por vínculo e autoria/download são seguros. |
| C — Estabilização | P11–P17 | Pessoa/arquivo são validados, erros não abrem formulários vazios e exclusões mantêm consistência. |
| D — Projetos/subprojetos | P18–P26 | Status e informação de projeto completos; CRUD de subprojeto cruza UI, API e persistência com autorização. |
| E — Quizzes administrativos | P27–P32 | Núcleo de quiz tem CRUD administrativo seguro e consistente; não significa que publicação/pontuação/vínculo estejam implementados. |
| F — Integrações e consultas | P33–P39 | Visitante consulta informação pública, aluno responde quiz conforme contrato consolidado, arquivos têm texto e resultados ficam restritos ao titular/professor responsável. Parte bloqueada por decisões. |
| G — Recuperação | P40–P41 | Solicitar instrução e redefinir senha funciona com token seguro e contato aprovado, sem enumeração de contas. Pode ser antecipada após P06 se D11 estiver resolvida. |
| H — Qualidade | P42–P46 | Carga de consultas reduzida, testes reproduzíveis, matriz de dispositivos executada e extrações preservam contratos. P43 pode ser antecipado após P04/P02 para apoiar cada correção. |

## Tarefas bloqueadas ou condicionais

- **P06/P09:** precisam de identificador de conta, correspondência e tratamento de legados definidos em D10/D11 e, para autoria histórica/exclusão, D07. P01 pode fechar a rota sem senha de imediato, preservando login administrativo seguro.
- **P27/P28:** criação de perguntas/alternativas depende do tipo de questão e quantidade de corretas em D08. Apenas o núcleo confirmado entra nesses prompts; vínculo, estado e pontuação não são decididos por eles.
- **P29–P32:** edição/exclusão e respectivas telas dependem da política de preservação de respostas em D08.
- **P34–P36:** catálogo e submissão dependem de D03/D04/D08 e dos contratos de relação/publicação/correção **implementados posteriormente a partir de decisões aprovadas**. Não há código atual que supra esses pré-requisitos.
- **P38/P39:** dependem de resultado apurado e persistido em P35; P39 também precisa do vínculo de acompanhamento D03/D06. Histórico mínimo é confirmado; gráficos e evolução continuam fora desses prompts.
- **P40/P41:** contato de recuperação das contas e transporte dependem de D11; não assumir e-mail para administrador inexistente no schema atual.
- **P03/P18/P22/P37/P44** possuem decisões operacionais ou de trecho específico: D12 para implantação/medição, tratamento explícito do status legado, D07 para dependentes de subprojeto e vínculo de atividade. Não bloqueiam correções independentes já especificadas; não autorizam decidir silenciosamente o que falta.

### Prompts que só poderão ser escritos após definições

| Decisão | Trabalho posterior ainda sem prompt | Por que não há implementação pronta |
|---|---|---|
| D02 | Conteúdo educacional e visibilidade/vínculo (RF23–RF27 e parte RN05) | O próprio escopo está a confirmar. |
| D03 | Relação de quiz com projeto/subprojeto e consistência dos pais | Texto e diagrama divergem; afeta autorização de catálogo/resposta/resultados. |
| D04 | Publicação e transições de quiz (RF36) | Publicado/aberto/encerrado não têm regra de transição definida. |
| D05 | Período de projeto | Colunas existentes não confirmam comportamento aprovado. |
| D06 | Indicadores de evolução (RF52) | Ausentes definições de métricas e aceite. |
| D07 | Entidade Atividade e/ou vínculo do envio ao subprojeto | Destino e processo de atividade não consolidados. |
| D08 | Cálculo da pontuação (RF40), percentual e políticas de resposta | Pontos por pergunta no texto, por alternativa no desenho; isso impede concluir resultado RF49 com uma fórmula presumida. |
| D09 | Solicitação/autoinscrição ou mudança de mínimos de equipe | ERS não exige esse fluxo específico; vínculo administrativo já existe. |

Essas linhas são decisões de escopo/contrato, não prompts extras ou autorização para desenvolver funcionalidades duvidosas. Requisitos confirmados que dependem delas continuam no checklist, com trava explícita. Após a resposta, criar prompts pequenos para a parte recém-definida e inserir as dependências no plano; não marcar P35/RF49 completo antes da apuração aprovada existir.

## Cobertura e prevenção de duplicação

Os prompts de API e os formulários correspondentes são separados para revisão individual: subprojeto P20/P24, P21/P25, P22/P26, com leitura P23; quiz P27/P28, P29/P30, P31/P32, catálogo P34 e resposta P35/P36; recuperação P40/P41; consulta própria P38 e consulta de professor P39. Cada etapa reaproveita a anterior, sem recriar o módulo.

P01 corrige credenciais/autenticação; P06 liga a pessoa acadêmica; P13 consome a sessão no frontend. P02 controla ações por perfil; P07 controla recursos por vínculo; P08 controla bytes; P09 corrige autoria. P04 organiza schema, P05 isola transações, P10 protege integridade. Essa divisão impede misturar um botão oculto com autorização efetiva.

### Cobertura dos requisitos pelos prompts

| Requisito | Prompts ou decisão |
|---|---|
| RF01 | P01, P06, P13 |
| RF02 | P33 |
| RF03 | P01, P06, P13 |
| RF04 | P02, P07, P13 |
| RF05 | P40, P41 |
| RF06 | Preservar comportamento; P01 uniformiza respostas por segurança sem criar tarefa duplicada. |
| RF07 | P02, P06, P11, P12 |
| RF08 | P02, P07, P14 |
| RF09 | P02, P11, P12, P15 |
| RF10 | P02, P15 |
| RF11 | P02, P06, P11 |
| RF12 | P02, P07, P14 |
| RF13 | P02, P11, P15 |
| RF14 | P02, P15 |
| RF15 | P02, P05, P10, P18 |
| RF16 | P02, P07, P14, P18, P19, P42 |
| RF17 | P02, P05, P10, P15, P18 |
| RF18 | P02, P05, P15, P17 |
| RF19 | P20, P23 |
| RF20 | P20, P23, P24 |
| RF21 | P21, P25 |
| RF22 | P22, P26 |
| RF23 | D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. |
| RF24 | D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. |
| RF25 | D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. |
| RF26 | D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. |
| RF27 | D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. |
| RF28 | D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. |
| RF29 | D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. |
| RF30 | D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. |
| RF31 | D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. |
| RF32 | D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. |
| RF33 | P27, P28 |
| RF34 | P29, P30 |
| RF35 | P31, P32 |
| RF36 | D04: consolidar estado e transições; gerar prompt de publicação após decisão. |
| RF37 | P34 |
| RF38 | P36 |
| RF39 | P35 |
| RF40 | D08: decidir unidade de pontuação e política de correção; só depois gerar prompt de cálculo. |
| RF41 | P39 |
| RF42 | P33, P34 |
| RF43 | P07, P19 |
| RF44 | P04, P07, P08, P16, P17, P37 |
| RF45 | P16, P37 |
| RF46 | P37 |
| RF47 | P04, P06, P09 |
| RF48 | P07, P08, P09, P19 |
| RF49 | P35 |
| RF50 | P38, P39 |
| RF51 | P38 |
| RF52 | D06: definir indicadores e critérios mensuráveis; sem inventar gráficos ou gamificação. |
| RNF01 | P44 |
| RNF02 | P13, P19, P23, P33 |
| RNF03 | P14, P15, P26, P28, P30, P32, P41 |
| RNF04 | P44 |
| RNF05 | P44 |
| RNF06 | P42, P44 |
| RNF07 | P42 |
| RNF08 | P04, P43, P45, P46 |
| RNF09 | P05, P43, P45, P46 |
| RNF10 | P04, P05 |
| RNF11 | P03, P44 |
| RS01 | P02, P07, P43 |
| RS02 | P01, P40 |
| RS03 | P01, P40 |
| RS04 | P01, P03, P07, P09, P35, P40, P43 |
| RS05 | P02, P07, P43 |
| RS06 | P10, P11, P12, P16, P21, P24, P25, P27, P29, P43 |
| RS07 | P08, P09, P16, P17, P22, P43 |
| RC01 | P03, P44 |
| RC02 | P44 |
| RC03 | P44 |
| RC04 | P03, P44 |
| RC05 | P44 |
| RN01 | P02 |
| RN02 | P01, P08 |
| RN03 | P34, P36 |
| RN04 | P20, P23 |
| RN05 | D02 e D03; sem prompt para relação indefinida. |
| RN06 | P07 |
| RN07 | P39 |
| RN08 | P10, P11, P12 |
| RN09 | P12 |
| RN10 | D01: consolidar documento; sem prompt de implementação. |
| RN11 | P06, P35, P36, P38 |

## Critério de encerramento por tarefa

Entregar arquivos alterados, comportamento/contrato final, migração se houver, testes efetivamente executados, resultados e limitações. Para fechar um requisito completo, conferir frontend + backend + persistência + regra de negócio e permissões aplicáveis. Ausência de teste automatizado não prova ausência de implementação; resultado simulado também não comprova MySQL real.
