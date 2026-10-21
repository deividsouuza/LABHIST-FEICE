# Divergências e decisões da ERS

Fonte: ERS 2.0 fornecida pelo usuário, setembro/2026, 20 páginas. Decisões registradas em 15/10/2026, **sem presumir respostas**. Este documento apresenta primeiro o que precisa ser consolidado; nenhum prompt autoriza resolver ambiguidade sozinho.

## Separação do escopo

| Grupo | O que se pode afirmar |
|---|---|
| Confirmado | Autenticação de administrador/professor/aluno, recuperação, perfis, CRUD de pessoas/projetos, status de projeto incluído expressamente, CRUD de subprojetos e campos §4.1.8, núcleo de quiz/perguntas/alternativas, participação, upload com descrição e texto, registro de respostas/resultados e consultas mínimas, visitante, validação, segurança e compatibilidade. Detalhes dependentes não se tornam confirmados só porque o objetivo é. |
| Removido com registro explícito / documento desatualizado | Editais RF28–RF32 e RN10: pp.1/3–4 citam remoção solicitada por Lorena. Como as seções de RF/processo/menu/aceite continuam, consolidar a retirada em D01; sem prompts para reconstruí-los. |
| Escopo aparentemente ainda não confirmado | Conteúdos RF23–RF27 e parte de RN05, com notas a confirmar/perguntar; não confundir com os documentos enviados. |
| Contraditório/ambíguo | Vínculo do quiz, pontuação por pergunta × alternativa, estados de publicação, atividade e evolução do aprendizado. |
| Precisa de detalhamento | Período de projeto, participação/quantidade mínima de membros, identificador e campos do professor, e-mail/legados, metas de desempenho e matriz de compatibilidade. |

## D01 — Editais removidos, ainda presentes na ERS

**Requisitos/processos afetados:** RF28–RF32, RN10, menus e aceite 5.

**Evidência e origem:** pp.1 e3–4 registram remoção pedida por Lorena; pp.9–10/13/16–20 ainda descrevem o módulo. A leitura visual mostra trechos em vermelho sobre editais.

**Decisão necessária:** Confirmar vigência da decisão de remoção e publicar versão consolidada retirando todas as referências. Classificação REMOVIDO DO ESCOPO baseia-se na nota explícita; não se propõe reconstrução do módulo.

**Impacto no planejamento:** Nenhum prompt de implementação de editais.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D02 — Natureza e permanência de conteúdos educacionais

**Requisitos/processos afetados:** RF23–RF27 e parte de RN05; interfaces de conteúdo.

**Evidência e origem:** pp.3–4: cadastro/acesso a conteúdos a perguntar/a confirmar; p.8 chama subprojeto de página de conteúdo; pp.12–13 mantêm entidade conteúdo.

**Decisão necessária:** Definir se haverá entidade Conteúdo, tipos/mídias, campos, autor, público/restrito e vínculo a projeto/subprojeto; distinguir material didático de submissão do aluno.

**Impacto no planejamento:** Não gerar CRUD/publicação de conteúdo até decisão. P20/P23 podem criar subprojeto com campos já definidos.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D03 — Vínculo de quiz com projeto/subprojeto

**Requisitos/processos afetados:** Parte de RF33–RF42 e RN05.

**Evidência e origem:** p.1 pergunta o vínculo; p.8 exige Projeto + Subprojeto, mas diagrama Quizz só contém id_projeto FK; RN05 permite quiz em subprojeto.

**Decisão necessária:** Escolher vínculo obrigatório/opcional, se quiz de projeto pode não ter subprojeto e regra de consistência entre os dois. Registrar autorização resultante.

**Impacto no planejamento:** P27 trata somente núcleo confirmado; P34/P35/P38 ficam bloqueados para autorização acadêmica até relação consolidada.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D04 — Estados e publicação do quiz

**Requisitos/processos afetados:** RF36; disponibilidade de RF37/38/42.

**Evidência e origem:** p.8 inclui Publicado, aberto ou encerrado, sem transições, prazos ou quem pode responder em cada estado.

**Decisão necessária:** Definir estados, transições, visibilidade e possibilidade de resposta; esclarecer se publicado e aberto são fases distintas.

**Impacto no planejamento:** Sem prompt de publicação nesta auditoria; catálogos e submissão têm dependência explícita.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D05 — Período dos projetos

**Requisitos/processos afetados:** Parte de RF15–RF17 e §4.1.7.

**Evidência e origem:** p.7: Período //Perguntar a Lorena; DDL já possui data_inicio/data_fim sem UI/API.

**Decisão necessária:** Definir se período permanece, significado das datas, obrigatoriedade e limites; não assumir cronograma apenas porque há colunas.

**Impacto no planejamento:** P18 implementa só status explícito; datas ficam fora dos prompts.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D06 — Acompanhamento e evolução do desempenho

**Requisitos/processos afetados:** RF52 e extensão de RF50/51; RN07.

**Evidência e origem:** p.1 pergunta Como seria?; pp.10–11 listam resultados mínimos, mas não definem evolução, agregação ou relação com atividades.

**Decisão necessária:** Confirmar indicadores e público: histórico de quizzes/pontuação/acertos é mínimo descrito; evolução por tempo, metas e painéis precisam de aceite. Definir acompanhamento do professor.

**Impacto no planejamento:** P38 cobre consulta mínima de resultados; nenhum gráfico, ranking ou indicador temporal será inventado.

**Resposta registrada em19/10/2026:** acompanhamento mínimo aprovado pelo usuário: professor e aluno atualmente vinculados ao projeto do quiz, inclusive arquivado; revogação se qualquer vínculo removido. Nome do aluno, quiz, data, pontuação, percentual e questões/alternativas escolhidas, sem gabarito, contatos ou matrícula. Detalhes no registro do lote final abaixo. Evolução temporal, metas, gráficos e ranking continuam fora do escopo aprovado.

## D07 — Atividade e destino dos arquivos

**Requisitos/processos afetados:** Parte de RF44/RF48; §5.2/5.3 e escopo p.1.

**Evidência e origem:** p.9 Atividades //Conversar com Lorena; escopo fala em arquivos de subprojetos; código associa documentos só ao projeto.

**Decisão necessária:** Definir se Atividade é entidade própria, onde o envio se vincula (projeto/subprojeto/atividade), visibilidade e política ao excluir vínculo/autor. Texto explicativo separado está explicitado em §5.3.

**Impacto no planejamento:** P37 adiciona texto confirmado; a relação do envio e cascatas novas ficam bloqueadas até decisão.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D08 — Correção, pontuação, tentativas e preservação de quizzes

**Requisitos/processos afetados:** RF40; dependências de RF34/35/38/39/49/50/51 e RN11.

**Evidência e origem:** p.8 texto: pontuação de cada pergunta; diagrama: Pontuação em Alternativas e Correta bool. Faltam regra de escolha única/múltipla, arredondamento, tentativas e edição após respostas.

**Decisão necessária:** Definir unidade de pontuação, tipo de questão, alternativas corretas, fórmula de acertos e notas; política de reenvio/retomada e alterações/exclusões com resultados existentes.

**Impacto no planejamento:** Sem prompt de cálculo enquanto RF40 está indefinido. P29/P31/P35/P38 contêm travas para trechos dependentes; resultado final precisa de prompt futuro do cálculo aprovado.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D09 — Participação e obrigatoriedade de membros do projeto

**Requisitos/processos afetados:** RF43; RF15/17.

**Evidência e origem:** ERS diz participar de projetos; código exige ao menos um aluno e um professor em POST/PUT e só permite inclusão pelo administrador. ERS não especifica essas quantidades ou autoinscrição.

**Decisão necessária:** Confirmar participação por convite/inclusão administrativa ou solicitação do aluno e se projeto pode existir sem equipe. Não remover exigência atual silenciosamente.

**Impacto no planejamento:** P07/P19 preservam inclusão administrativa; não criar autoinscrição nem alterar mínimo de membros antes da decisão.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D10 — Campos e unicidade de cadastro de professor/identificação

**Requisitos/processos afetados:** RF07/RF11; §4.1.6; seção15.

**Evidência e origem:** Cadastro de professor só diz dados necessários. Matrícula aluno é obrigatória numérica; ERS não define unicidade global de e-mail/matrícula entre perfis. Código tem IDs distintos e sem vínculo credencial.

**Decisão necessária:** Definir identificador de login para cada perfil, chaves únicas de pessoas e quais campos específicos do professor são obrigatórios. Nome obrigatório atual será preservado; não impor domínio institucional sem requisito.

**Impacto no planejamento:** P06 precisa do identificador aprovado antes de provisionar credenciais; P11 pode validar campos fornecidos e obrigatórios expressos do aluno.

**Resposta registrada:** pendente de manifestação do responsável; não preenchida pela auditoria.

## D11 — Operação de e-mail e contas legadas

**Requisitos/processos afetados:** RF05; RF01; RS02/03.

**Evidência e origem:** ERS prevê recuperação por e-mail, mas conta administrativa atual possui somente usuario/senha/perfil, sem e-mail. Sem provedor/configuração de envio no repositório.

**Decisão necessária:** Definir e-mail verificado do administrador e dos demais perfis, canal de envio e procedimento de migração/redefinição das credenciais legadas; nenhum segredo precisa entrar na conversa.

**Impacto no planejamento:** P40 depende do contato de recuperação e configuração de envio; testes usam transporte falso, sem e-mail real.

**Resposta registrada em 18/10/2026 — decisão parcial do responsável (usuário):** opção 1, preservar as senhas existentes e converter o armazenamento para hashes seguros. Aceite: mesmas credenciais após migração explícita transacional, sem fallback de texto puro no login, sem redefinição automática e sem exposição dos valores. Essa decisão libera o escopo de P01; não autoriza executar a migração no banco real. Contatos verificados, envio de recuperação (P40) e correspondência entre contas/pessoas (D10/P06) continuam pendentes. Nenhum trecho da ERS foi reescrito. Implementação e evidências em 08-CONTROLE-DE-EXECUCAO.md e server/AUTENTICACAO.md.

## D12 — Critérios mensuráveis de compatibilidade, desempenho e operação

**Requisitos/processos afetados:** RNF01/04/05/06/10/11; RC01–RC05.

**Evidência e origem:** ERS não fixa dispositivos, navegadores mínimos, latência, carga, resolução ou formato de distribuição. Aplicação atual é web, sem app nativo.

**Decisão necessária:** Aprovar matriz Android/iOS/navegadores, condições de rede/volume e limiares de sucesso; decidir hospedagem HTTPS, origens e persistência de sessão. Se for exigido app nativo, explicitar novo escopo.

**Impacto no planejamento atualizado:** P44 cobre a matriz/metas locais explicitamente aprovadas, com baseline em10; sem migração de stack/app nativo.

**Resposta registrada:** operação de mesma origem/HTTPS/sessões persistidas já aprovada no registro P03. Em19/10/2026, usuário aprovou Chrome/Edge no Windows, desktop1280×900/1920×1080 e toque emulado360×800/390×844/768×1024, orientação/teclado; até100projetos/100alunos/20quizzes,upload1MiB,P95API≤1s,ações≤2s,upload≤5s. Evidências/limites em10. Dispositivos físicos Android/iOS e rede de produção explicitamente sem homologação.


## Leitura específica do diagrama da página 8

O desenho foi visto em renderização ampliada. Há três caixas:

- **Quizz:** id PK; id_projeto FK; Tema; Descrição; Status.
- **Perguntas:** id PK; id_quizz FK; Descrição.
- **Alternativas:** id PK; id_pergunta FK; Descrição; Pontuação; Correta bool.

Há ligações entre as caixas, mas não aparecem campos de subprojeto, aluno, resposta ou resultado. Não foram inferidas cardinalidades gráficas que o desenho não detalha. O texto da mesma página lista título, Projeto + Subprojeto, pontuação de cada pergunta e estados de publicação. Portanto, copiar esse diagrama diretamente como schema definitivo perderia dados ou adotaria regra ainda contraditória.

## Notas que não significam remoção ou tarefa nova

- “Em andamento” ao lado de subprojeto é observação de progresso no PDF, não evidência de implementação no código atual e não cancelamento. RF19–RF22 continuam confirmados/ausentes.
- Status de projeto foi anotado com inclusão explícita e alteração pelo administrador: é trabalho confirmado, diferente de período a perguntar.
- Descrição e texto explicativo aparecem separadamente em §5.3: P37 contempla o texto adicional sem inventar entidade Atividade. A obrigatoriedade desse texto não foi presumida.
- A seção15 lista entidades previstas e deixa relações para modelagem: não obriga tabela própria de administrador/curso/turma se representação atual atender regras e integridade.
- Trello é apoio opcional, não integração obrigatória.
- Notificações, relatórios, gamificação, fóruns, calendário, certificados e outras integrações são ampliações futuras, sem inclusão automática nos prompts.
- “Criptografia” junto a RS02 expressa proteção desejada; senha deve usar hash adequado para verificação, não reversão/recuperação do valor original.

## Registro da consolidação

Para cada resposta futura, registrar responsável, data, decisão, critérios de aceite e trechos da ERS alterados. Só então reclassificar requisito e criar prompt específico da parte definida. Não transformar resposta parcial de D03 em aprovação automática de D04/D08.

## Decisão de execução — lote P06/P13/P14/P07/P08 (18/10/2026)

Responsável: usuário. Resposta: “escolho essa regra”, após solicitar os próximos cinco prompts. D10/D11 parcialmente resolvidas: login por nome de usuário globalmente único e senha; professor mantém apenas nome obrigatório nos dados pessoais; e-mail/matrícula não se tornam chaves únicas nem identificadores de login. Cada conta acadêmica corresponde explicitamente a uma pessoa do mesmo perfil. Legados são vinculados pelo administrador mediante IDs revisados; nunca por nome. Contas acadêmicas sem vínculo não autenticam. Senhas existentes preservadas conforme decisão anterior; armazenamento em hash e validação P01 permanecem. Novos cadastros administrativos podem criar pessoa e credencial na mesma transação. Contatos verificados/SMTP e autoria ambígua (D07/P09) permanecem abertos. Não há autorização para executar migrações no banco real. Nenhum trecho da ERS foi reescrito.

Lote autorizado: P06 → P13 → P14 → P07 → P08, com validação individual. A ordem proposta na resposta anterior foi aceita, aplicando R02 para integrar identidade e tratamento de erros antes de restringir consultas. A autorização mais recente substitui a regra anterior de aguardar nova autorização entre essas cinco tarefas.

## Decisão P18 — status dos projetos legados (18/10/2026)

Responsável: usuário. Resposta: “Sim, preservar os legados como não informado”. Aprovada a proposta apresentada: legados preservados com status NULL, exibido como Não informado; novos projetos exigem em andamento, finalizado ou cancelado; somente administrador classifica/atualiza os antigos. Não deduzir estado por datas nem preencher em andamento automaticamente. Edição sem classificação mantém NULL; estado já definido não pode ser apagado para NULL. Sem migração real autorizada. Libera P18 e, após validação sequencial, P19/P23/P24, os quatro restantes do lote iniciado em P42.

## Decisão D08 parcial — núcleo e edição de quizzes (18/10/2026)

Responsável: usuário. Respostas: “Escolha única: exatamente uma alternativa correta” e “Bloquear a edição inteira enquanto houver respostas/resultados”. Perguntas apresentadas incluíam mínimo de duas alternativas por pergunta. Aprovado: perguntas de escolha única, ao menos duas alternativas e exatamente uma correta; edição completa recusada enquanto houver respostas/resultados, preservando o histórico. Libera P27/P28/P29 no lote iniciado com P25/P26, após validação individual. Não aprova pontuação/correção, tentativas, exclusão/retencão P31, vínculo D03 ou publicação D04. Núcleo administrativo privado, sem migração real autorizada.

### D08 — Retenção aprovada para P31/P32 em 18/10/2026

O usuário aprovou: “Sim, bloquear exclusão quando houver histórico”. A exclusão inteira fica bloqueada quando houver respostas, resultados ou outros dependentes externos; somente quizzes sem histórico podem ser excluídos. Não autoriza apagar histórico nem define publicação, pontuação ou tentativas.

## Decisões aprovadas para o lote P03/P09/P37/P40/P41 — 19/10/2026

Responsável: usuário, respostas explícitas às três propostas. D12 operacional: “Aprovo esse modelo de operação”: frontend/API na mesma origem por padrão, produção HTTPS com proxy confiável explicitamente configurado, sessões persistidas em MySQL e expiração após 8 horas sem uso; HTTP no desenvolvimento. Domínio/segredos no ambiente; sem implantação. Matriz física/desempenho D12 de P44 continua pendente.

D07 autoria: “Aprovo preservar autoria e legados pendentes”: cada novo envio registra conta, nome e perfil no momento do envio; alterações cadastrais não reescrevem história; exclusão de conta autora bloqueada. Registros antigos sem prova ficam pendentes, sem atribuição por dedução nem apagar arquivos. Libera P09 e, após concluído, P37; não aprova entidade Atividade/vínculos novos.

D11 recuperação: “Aprovo essa política de recuperação”: contato separado confirmado pelo administrador por conta, inclusive administrativa; SMTP configurável com segredos apenas no ambiente; token aleatório de uso único por 30 minutos; revogação de sessões após redefinição. Testes por transporte falso, nenhum e-mail real. Não autoriza migração no banco real.

## Decisões D03/D04/D08 e tarefas prévias — 19/10/2026

Responsável: usuário. Respostas explícitas: “Aprovo a regra e a tarefa prévia” e “Aprovo a política e a tarefa prévia”. Autoriza criar/documentar e executar as tarefas prévias de vínculo/publicação e correção antes de P34/P35. Não renumera P01–P46 nem conta essas dependências como prompts concluídos.

D03/D04: cada quiz pertence a um projeto, com subprojeto opcional do mesmo projeto. Legados sem vínculo permanecem privados. Administrador define rascunho, publicado ou arquivado. Alunos atualmente vinculados ao projeto acessam apenas publicados. Visitante recebe somente título/introdução de publicados marcados explicitamente como públicos pelo administrador, sem perguntas/gabarito.

D08: uma tentativa concluída por aluno/quiz; todas as perguntas obrigatórias; um ponto por acerto, zero por erro; percentual = acertos ÷ perguntas × 100. Aluno recebe pontuação/percentual sem gabarito. Reenvio idêntico retorna resultado salvo; respostas diferentes após conclusão são recusadas. Correção deve existir/testar antes de P35. Regras anteriores de escolha única, bloqueio integral de edição e exclusão com histórico permanecem. Não resolve acompanhamento/evolução D06, nem matriz física/desempenho D12. Nenhuma migração real autorizada.

## Decisões do lote final — 19/10/2026

Usuário aprovou explicitamente D06: professor consulta resultados de quizzes dos projetos em que professor e aluno estejam atualmente vinculados, inclusive arquivados; remoção de qualquer vínculo revoga acesso. Projeção: nome do aluno, quiz, data, pontuação, percentual, perguntas e alternativas escolhidas. Sem gabarito, contatos, matrícula, gráficos ou ranking.

Usuário aprovou D12/homologação local descartável: Chrome e Edge instalados no Windows; desktop1280×900 e1920×1080; toque emulado360×800,390×844,768×1024, incluindo orientação e teclado. Até100 projetos,100 alunos,20 quizzes, upload1MiB. P95API≤1s,ações de tela≤2s,upload≤5s no ambiente local. Android/iOS físicos e rede de produção explicitamente sem homologação. P44 cobrirá essa matriz acordada e regressão de P46. Não autoriza implantação nem banco real.
