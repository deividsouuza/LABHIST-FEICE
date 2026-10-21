# Quizzes — administração, publicação e participação do aluno

D08 parcial aprovada pelo responsável em 18/10/2026 (arquivo07): escolha única, ao menos duas alternativas e exatamente uma correta por pergunta. Edição de quiz com respostas/resultados é bloqueada integralmente em P29. Em P31/P32, decisão separada aprovou também bloquear integralmente a exclusão com histórico. Vínculo a projeto/subprojeto, publicação, correção/pontuação e tentativas foram aprovados em 19/10/2026 e implementados nas etapas descritas abaixo (014/015, P34/P35/P36).

Migração explícita009 cria quiz, quiz_pergunta e quiz_alternativa, com ordem das perguntas/alternativas e FKs RESTRICT. CHECK limita correta a0/1; a API exige exatamente uma correta no conjunto de alternativas de cada pergunta. Sem dados legados a classificar, sem alteração das versões001–008. A partida verifica esquema/FKs/CHECK, sem DDL. Migração preparada apenas em código e testada em bancos descartáveis; não aplicada ao banco real.

Todos os endpoints exigem sessão administrativa antes de validar o corpo ou consultar SQL:

| Método/caminho | Resultado |
|---|---|
| POST /quizzes | 201, id e mensagem, após transação confirmada |
| GET /quizzes | lista de id/titulo/descricao, sem estrutura de gabarito |
| GET /quizzes/:id | estrutura completa, incluindo IDs e correta booleana |
| PUT /quizzes/:id | 200 e mensagem após atualização transacional sem histórico |
| DELETE /quizzes/:id | 200 e mensagem após exclusão transacional sem histórico |

Leituras usam no-store; detalhe lê uma fotografia transacional consistente. Aluno/professor/visitante não recebem gabarito. O gabarito não aparece nas APIs acadêmicas; publicação exige configuração administrativa explícita.

POST recebe titulo, descricao opcional (omitida vira vazio) e perguntas. Cada pergunta tem descricao e alternativas; cada alternativa tem descricao e correta booleano. Título é obrigatório,1–255 caracteres após trim, sem controles/quebras. Descrições de perguntas/alternativas são obrigatórias e as demais opcionais; TEXT até65535 bytes UTF-8 após trim. JSON tem o limite global já existente da API. Campos fora do contrato são recusados, incluindo vínculo, publicação, pontuação e IDs forjados na criação.

Limites operacionais documentados, sem apresentá-los como novos requisitos da ERS:1–50 perguntas e2–20 alternativas por pergunta. Nenhuma marcação é deduzida do texto. Gravação usa uma conexão dedicada e transação; falha em qualquer alternativa reverte quiz e perguntas, sem reenvio automático.400 indica dados inválidos,401 ausência de sessão,403 perfil sem permissão,404 registro ausente e500 falha interna sanitizada.

Testes em test/quizzes.test.js usam HTTP/MySQL descartáveis reais para persistência, estrutura, limites, papéis, rollback, FKs/CHECK, upgrade008→009 e drift. Nenhum banco, .env ou upload real do projeto é utilizado. Evidências e comandos no controle08.

## P28 — composição administrativa

Menu Cadastros → Quizzes permite adicionar/remover perguntas e alternativas, marcar a única correta, revisar a estrutura e salvar. Erros aparecem por campo e preservam o rascunho; clique duplo não duplica o envio. Campos ficam bloqueados durante o POST e são reabilitados em falha. Sucesso confirmado atualiza a lista; consulta da estrutura é somente administrativa. Textos são renderizados por textContent, sem HTML arbitrário. Não há armazenamento do gabarito em localStorage, publicação ou vínculo acadêmico implícito. Reconfirmação de sessão não administrativa ou troca de conta apaga gabaritos/rascunhos anteriores e fecha os painéis privados, inclusive no retorno a página em cache; respostas antigas são descartadas pela sequência de navegação.

## P29 — edição e histórico

PUT usa o mesmo corpo do POST, admitindo IDs retornados pelo GET. ID raiz opcional precisa coincidir com a URL. Itens mantidos enviam seus IDs; itens novos omitem ID; omitir item antigo remove-o somente se não houver histórico. Alternativa com ID só pode permanecer na pergunta de origem; pergunta só pode permanecer no quiz original. IDs repetidos/alheios são recusados antes de alterar dados. Ordem é a posição no array; salvar os mesmos valores retorna sucesso.

A política aprovada bloqueia integralmente o PUT com respostas/resultados, inclusive para título/descrição. Locks dos registros do núcleo precedem a verificação de referências externas por FK; relações internas pergunta→quiz e alternativa→pergunta são preservadas explicitamente. Dependentes externos bloqueiam com 409 mesmo com FK CASCADE/SET NULL, sem remover histórico. Referência de outro esquema ou coluna não suportada também bloqueia. Na entrega original P29 ainda não havia respostas/resultados. P35 acrescentou entidades reais com FKs para o núcleo; o mesmo bloqueio foi revalidado com histórico persistido. Tabelas artificiais dos testes de referências externas existem somente na fixture.

Todas as alterações usam uma única transação, sem replay. Erro em alternativa reverte título, textos, ordem e estrutura; identidade de outro quiz e seu histórico não são afetados. P30 reutiliza o formulário para edição administrativa e preserva os IDs retidos. GET falho não substitui o formulário; PUT falho preserva a edição e informa bloqueio de histórico. Cancelar ou iniciar novo quiz limpa o modo de edição.

```powershell
node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/quizzes.test.js server/test/quizzes-interface.test.js
```

54 casos HTTP/MySQL descartáveis (27 criação/consulta +14 edição +13 exclusão) e34 Chrome com API controlada (15 criação +12 edição +7 exclusão). Não representam E2E navegador+MySQL. Regressões completas e resultados reais registrados no controle08.

## P31/P32 — exclusão e retenção

Usuário aprovou separadamente bloquear a exclusão inteira quando houver respostas, resultados ou dependentes externos. DELETE autentica/autoriza antes de validar/SQL, trava o núcleo, reutiliza a verificação de FKs externas e remove explicitamente alternativas, perguntas e quiz em uma transação apenas sem histórico. FKs CASCADE não dispensam a proteção. Falha intermediária reverte tudo e não expõe SQL. A interface confirma o título, cancelar não envia requisição e clique duplo não duplica DELETE; erros mantêm item/detalhe e explicam conflito. Atualiza a lista após sucesso confirmado. Novas entidades de histórico devem usar FKs para o núcleo e revalidar o contrato. Sem publicação, cálculo ou políticas de tentativas implícitas.

## Vínculo/publicação — decisão aprovada em 19/10/2026

A seção administrativa anterior descreve P27–P32. D03/D04 agora aprovadas em auditoria-ers/07; contrato complementar em 09. Migração explícita 014 acrescenta projeto/subprojeto/estado/autorização de introdução pública. Nenhuma aplicação real. Legados ficam rascunhos sem vínculo e privados; criação administrativa continua rascunho privado até configurar vínculo/publicação.

Administrador usa “Vínculo e publicação” no detalhe do quiz: GET/PUT /quizzes/:id/disponibilidade. PUT recebe projeto_id, subprojeto_id (IDs ou null), estado (rascunho/publicado/arquivado), publico (boolean). Publicar exige projeto; subprojeto opcional deve pertencer ao projeto. FK composta impede trocar o pai do subprojeto e deixar quiz inconsistente. Configuração também é edição: bloqueada com respostas/resultados/dependentes, preservando retenção já aprovada.

Serviço quizDisponivel revalida publicação/vínculo atual; disponível para os consumidores P34/P35 após suas respectivas implementações. Não há alteração automática de vínculo, prazo ou tentativa; o visitante só poderá receber título/introdução dos publicados explicitamente autorizados, sem perguntas/gabarito.

## P34 — catálogos e introduções

Aluno autenticado: GET /aluno/quizzes e /aluno/quizzes/:id, perfil aluno e vínculo atual verificados no servidor. Lista só publicados dos próprios projetos. Não há filtro aluno_id aceito. Visitante: GET /publico/quizzes e /publico/quizzes/:id, somente publicados com introducao_publica=1. Ambos retornam exclusivamente id/titulo/descricao, sem perguntas, alternativas ou gabarito. Contratos administrativos continuam separados.

Menu “Quizzes disponíveis” do aluno e seção “Quizzes” da área pública oferecem lista/introdução, vazio, recarga e erros. Texto é literal, sem HTML dinâmico. Respostas atrasadas são descartadas por sequência de navegação; troca de conta/perfil/pessoa e logout limpam o catálogo. Esta etapa não cria submissão; P35/P36 são consumidores posteriores.

## P35 — submissão e resultado

POST /aluno/quizzes/:id/respostas recebe somente {respostas:[{pergunta_id,alternativa_id}]}. Sessão deve ser aluno com vínculo atual. Gabarito é lido no servidor; todas as perguntas obrigatórias, uma alternativa por pergunta, um ponto/acerto e percentual = acertos ÷ total × 100. Notas/IDs de aluno/conta do navegador são rejeitados.

Uma transação revalida/trava identidade, quiz e vínculo; grava resultado e todas as respostas juntos. Uma tentativa por aluno (pessoa), com conta autora separada, garantida por UNIQUE. Mesmo conjunto em outra ordem retorna 200/reenvio=true e o resultado salvo; outro conjunto retorna 409. Primeira gravação retorna 201. Falha reverte tudo; confirmação perdida após COMMIT é recuperável pelo reenvio, sem replay automático do servidor. Histórico bloqueia edição/exclusão/configuração de quiz. FKs preservam quiz, aluno e conta referenciados.

GET /aluno/quizzes/:id/atividade fornece estrutura sem correta/gabarito e resultado do próprio aluno ou null, somente se publicado e autorizado. Resultado retorna id, quiz_id, quiz_titulo, pontuacao, total_perguntas, percentual, concluido_em UTC; sem dados pessoais/gabarito. Percentual DOUBLE preserva a precisão numérica da fórmula, sem arredondamento novo. UI P36 mostra até duas casas decimais na apresentação; o valor persistido mantém a fórmula aprovada.

Migração 015 acrescenta quiz_resultado/quiz_resposta e restrições; sem dados fabricados ou alteração de quizzes legados. Aplicação real não executada.

## P36 — resposta do aluno

Menu Quizzes disponíveis → introdução → Abrir quiz. Formulário de escolha única sem gabarito, com todas as perguntas obrigatórias. Dados enviados contêm só pergunta_id/alternativa_id; nenhum aluno/conta/nota. Pendências recebem foco e mensagem antes da rede. Durante envio os controles ficam bloqueados; duplo clique não envia novamente. Resultado só aparece a partir da resposta persistida do servidor. Resultado já concluído reabre sem permitir nova tentativa.

Rede/SQL/409 preservam seleções e oferecem “Consultar resultado salvo”. Consulta sem resultado mantém o rascunho; reenvio idêntico recupera confirmação perdida. Navegação e mudança de identidade descartam respostas HTTP atrasadas; sessão expirada limpa o estado e retorna ao login. Professor/visitante não recebem formulário acadêmico. Texto de perguntas/alternativas é literal, sem HTML interpretado; teclado e emulação móvel foram testados, sem homologação física Android/iOS.

Integração da FK composta: exclusão de subprojeto reconhece a relação aprovada uma vez pelo subprojeto_id. A simples existência da FK não bloqueia registros sem dependentes; um quiz vinculado bloqueia a exclusão. Formatos externos/desconhecidos continuam protegidos, inclusive políticas CASCADE/SET NULL. Regressão específica em disponibilidade-quizzes/subprojetos.

## P38 — histórico próprio

GET /aluno/resultados exige aluno autenticado com identidade atual e usa exclusivamente o ID da pessoa vinculada à sessão; parâmetros de consulta são rejeitados. Retorna a projeção mínima de resultado descrita em P35, ordenada por conclusão/ID decrescentes, com Cache-Control:no-store. Não contém dados de outro aluno, perguntas ou gabarito. Resultados próprios anteriores continuam disponíveis mesmo após arquivamento do quiz ou remoção do vínculo de projeto.

Menu Meu desempenho mostra vazio, pontuação/total, percentual e data, com recarga após falha. Navegação invalida respostas atrasadas e troca de identidade limpa o histórico. Professor, administrador e visitante não acessam essa consulta. Não implementa indicadores de evolução ou rankings.

## P39 — acompanhamento do professor

GET /professor/resultados e /professor/resultados/:id exigem professor e identidade atual. Ambos os vínculos atuais professor/projeto e aluno/projeto são obrigatórios; não há filtro de identidade aceito do cliente. Resultados de quizzes arquivados continuam consultáveis enquanto os vínculos existirem. Remoção de qualquer vínculo revoga lista e detalhe, que retorna404 para ausente/sem acesso. Cache-Control:no-store.

Projeção acrescenta aluno:{id,nome} (nome registrado na conclusão). Detalhe lê, em transação, apenas pergunta e alternativa escolhida, conferindo consistência de quiz/pergunta/alternativa; sem correta/gabarito, outras alternativas, contatos ou matrícula. Menu Resultados acompanhados trata vazio/erro/recarga, texto literal, mudança de identidade e respostas atrasadas. Nenhuma migração nova.
