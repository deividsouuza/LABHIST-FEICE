# Matriz completa — ERS 2.0 × código

Data: 15/10/2026. Escopo: 86 requisitos numerados, além dos processos e critérios sem ID ao final. Fonte primária: PDF fornecido, 20 páginas, setembro/2026. Código: fotografia local descrita no relatório geral.

Todas as categorias usam a nomenclatura solicitada. IMPLEMENTADO exige evidência do comportamento aplicável; NÃO VERIFICADO não significa ausente. Testes com doubles sustentam defeitos de contrato/autorização, sem provar persistência real. Exceto a apresentação de erro de credenciais (RF06), os fluxos existentes têm defeitos ou lacunas. Os módulos ausentes foram procurados em todos os arquivos próprios de aplicação e SQL, não apenas no menu.

Editais foram classificados como REMOVIDO DO ESCOPO porque há nota explícita de remoção por Lorena; D01 solicita reconciliação da ERS. Conteúdos/estados/pontuação/evolução indefinidos não geram implementação automática. Os comentários em vermelho e o diagrama da p.8 foram considerados.

## Tabela de rastreabilidade

| ID | Requisito | Situação | Evidência no código | Pendência | Prioridade |
|---|---|---|---|---|---|
| RF01 | Login de administradores, professores e alunos | IMPLEMENTADO COM ERROS | server/index.js:423 fazer login; :498 /sessao/pessoa; mainPage/cadastro.js:463 confirmarIdentidadePessoa; login/login.js:3 fazerLogin | Cadastro de pessoa não gera credencial vinculada; escolha pública de pessoa dispensa senha. P01, P06 e P13: autenticação real, vínculo persistente e tela coerente. | P0 |
| RF02 | Acesso de visitante sem autenticação | NÃO IMPLEMENTADO | login/login.html:25; server/index.js:689 GET /projetos exige requireAuth | href="#" não abre área pública; não há catálogo público. P33: criar entrada e informações públicas de projetos; conteúdos aguardam D02. | P1 |
| RF03 | Identificação do perfil autenticado | IMPLEMENTADO COM ERROS | server/index.js:449 e :523; mainPage/cadastro.js:428 perfilAtual e :981 aplicarPermissoes | Perfil da interface é manipulável; identidade de conta não é ligada a aluno/professor e pode ser trocada sem credencial. P01, P06 e P13: usar a identidade confirmada pelo servidor. | P0 |
| RF04 | Controle de funcionalidades por perfil | IMPLEMENTADO COM ERROS | server/index.js:108 requireAuth, :118 requireAdmin, :390 /cadastro, :625 DELETE /usuarios; mainPage/cadastro.js:981 | requireAdmin só protege DELETE /documentos; aluno executa operações administrativas. P02 e P07: autorização por operação e vínculo no servidor. | P0 |
| RF05 | Recuperação de senha | NÃO IMPLEMENTADO | login/login.html:21; login/login.js:3; server/index.js:423 | Link sem ação; faltam token temporário, alteração de hash e envio de instruções. P40: fluxo de recuperação por e-mail. | P1 |
| RF06 | Informar credenciais inválidas | IMPLEMENTADO | server/index.js:439 e :445; login/login.js:26 | Ensaio T10 confirmou 401 com senha inválida; texto do alert verificado por leitura. Risco de enumeração em E12 não invalida a presença da mensagem. Preservar comportamento; P01 uniformiza respostas por segurança sem criar tarefa duplicada. | P2 |
| RF07 | Administrador cadastrar alunos | IMPLEMENTADO COM ERROS | server/index.js:656 /cadastro-dashboard; mainPage/cadastro.js:788 submitAluno | Somente nome é exigido; sem autorização de administrador nem criação de credenciais. P02, P06, P11 e P12. | P1 |
| RF08 | Administrador consultar alunos | IMPLEMENTADO COM ERROS | server/index.js:531 e :568; mainPage/cadastro.js:71 showForm e :729 editUser | Qualquer sessão acessa todos os dados pessoais; leitura não verifica res.ok. P02, P07 e P14. | P1 |
| RF09 | Administrador alterar alunos | IMPLEMENTADO COM ERROS | server/index.js:593 PUT /usuarios; mainPage/cadastro.js:788 submitAluno | Sem autorização, validação obrigatória e checagem de existência. P02, P11, P12 e P15. | P1 |
| RF10 | Administrador excluir alunos | IMPLEMENTADO COM ERROS | server/index.js:625 DELETE /usuarios; mainPage/cadastro.js:819 deleteUser | Não exige administrador; retorna sucesso com zero registros; autoria documental pode ficar órfã. P02, P09 e P15. | P1 |
| RF11 | Administrador cadastrar professores | IMPLEMENTADO COM ERROS | server/index.js:656; mainPage/cadastro.js:759 submitProfessor | Sem autorização nem credencial vinculada; validações genéricas ausentes. P02, P06 e P11. | P1 |
| RF12 | Administrador consultar professores | IMPLEMENTADO COM ERROS | server/index.js:531 e :568; mainPage/cadastro.js:71 e :729 | Dados pessoais sem restrição de perfil/vínculo; leitura sem res.ok. P02, P07 e P14. | P1 |
| RF13 | Administrador alterar professores | IMPLEMENTADO COM ERROS | server/index.js:593; mainPage/cadastro.js:759 | Sem autorização; aceita nome vazio no PUT e não verifica affectedRows. P02, P11 e P15. | P1 |
| RF14 | Administrador excluir professores | IMPLEMENTADO COM ERROS | server/index.js:625; mainPage/cadastro.js:819 | Aluno pode excluir professor; ausência de registro não é reportada; autoria fica sem referência segura. P02, P09 e P15. | P1 |
| RF15 | Administrador criar projetos | IMPLEMENTADO COM ERROS | server/index.js:364 validarProjetoPayload e :710 POST /projetos; mainPage/cadastro.js:891 submitProjeto | Sem autorização; status ausente; IDs relacionados não são conferidos; período depende de D05. P02, P10 e P18. | P1 |
| RF16 | Administrador consultar projetos | IMPLEMENTADO COM ERROS | server/index.js:689 e :736; mainPage/cadastro.js:71 e :853 editProjeto | Lista expõe todos os projetos e dados pessoais; descrição da lista é alterada com texto de membros; faltam status/subprojetos. P07, P18, P23 e P42. | P1 |
| RF17 | Administrador alterar projetos | IMPLEMENTADO COM ERROS | server/index.js:755; mainPage/cadastro.js:853 e :891 | Sem autorização; status ausente; atualização de ID inexistente não é detectada. P02, P10, P18 e P15. | P1 |
| RF18 | Administrador excluir projetos | IMPLEMENTADO COM ERROS | server/index.js:781; mainPage/cadastro.js:926 deleteProjeto | Sem autorização; cascata SQL de documentos não apaga arquivos físicos; retorna sucesso sem existência. P02, P17 e P15. | P1 |
| RF19 | Projeto possuir um ou mais subprojetos | NÃO IMPLEMENTADO | server/index.js:208 CREATE projeto; mainPage/menuCadastro.html:204 lista de projetos; inventário integral | Sem tabela, FK, rotas ou navegação de subprojetos. P20 e P23: relação projeto 1:N subprojeto. | P1 |
| RF20 | Administrador criar subprojetos | NÃO IMPLEMENTADO | server/index.js:208; mainPage/menuCadastro.html:25; ERS §4.1.8 p.8 | Faltam título, objetivo, descrição, temas e projeto relacionado nas camadas. P20 e P23: cadastro e integração da tela. | P1 |
| RF21 | Administrador alterar subprojetos | NÃO IMPLEMENTADO | Inventário; server/index.js rotas :390–918; mainPage/cadastro.js:24 formMap | Sem leitura/edição/persistência. P21 e P23. | P1 |
| RF22 | Administrador excluir subprojetos | NÃO IMPLEMENTADO | Inventário; server/index.js:781 exclusão cobre somente projeto | Faltam exclusão, confirmação e política de dependentes. P22 e P23; política de arquivos em D07 antes de cascatas. | P1 |
| RF23 | Associar conteúdos aos subprojetos | PENDENTE DE DEFINIÇÃO | ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114 | Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito. D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. | Decisão |
| RF24 | Administrador cadastrar conteúdos | PENDENTE DE DEFINIÇÃO | ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114 | Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito. D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. | Decisão |
| RF25 | Associar conteúdos a projetos ou subprojetos | PENDENTE DE DEFINIÇÃO | ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114 | Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito. D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. | Decisão |
| RF26 | Visualizar conteúdos por usuários autorizados | PENDENTE DE DEFINIÇÃO | ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114 | Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito. D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. | Decisão |
| RF27 | Disponibilizar conteúdos públicos para visitantes | PENDENTE DE DEFINIÇÃO | ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114 | Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito. D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts. | Decisão |
| RF28 | Administrador cadastrar editais | REMOVIDO DO ESCOPO | ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário | Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite. D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. | Fora do escopo |
| RF29 | Data de abertura do edital | REMOVIDO DO ESCOPO | ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário | Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite. D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. | Fora do escopo |
| RF30 | Prazo para submissão | REMOVIDO DO ESCOPO | ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário | Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite. D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. | Fora do escopo |
| RF31 | Upload do edital em PDF | REMOVIDO DO ESCOPO | ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário | Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite. D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. | Fora do escopo |
| RF32 | Visualização dos editais publicados | REMOVIDO DO ESCOPO | ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário | Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite. D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação. | Fora do escopo |
| RF33 | Administrador criar quizzes | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Sem entidade/rota/tela de quiz. Vínculo projeto/subprojeto diverge entre texto e diagrama. P27: núcleo administrativo confirmado; relação fica bloqueada por D03. | P1 |
| RF34 | Administrador editar quizzes | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Não há edição ou consulta administrativa de quiz. P29: edição; políticas de tentativas e alteração após respostas dependem de D08. | P1 |
| RF35 | Administrador excluir quizzes | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Não há exclusão nem proteção dos resultados vinculados. P31: exclusão; retenção/histórico depende de D08. | P1 |
| RF36 | Administrador publicar quizzes | PENDENTE DE DEFINIÇÃO | ERS p.8 §4.1.9; server/index.js rotas | Publicado, aberto e encerrado não possuem transições ou relação de permissão definidas; diagrama apenas Status. D04: consolidar estado e transições; gerar prompt de publicação após decisão. | Decisão |
| RF37 | Aluno visualizar quizzes disponíveis para seu perfil | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Não há catálogo de quizzes nem filtragem no servidor. P34: catálogo restrito; depende da consolidação de vínculo e publicação em D03/D04. | P1 |
| RF38 | Aluno responder quizzes | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Não há formulário de resposta ou submissão. P35: respostas autenticadas; depende de D03/D04/D08. | P1 |
| RF39 | Registrar respostas dos alunos | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Sem entidade resposta/tentativa ou persistência. P35: salvar respostas ligadas ao aluno e quiz em transação. | P1 |
| RF40 | Calcular pontuação do aluno | PENDENTE DE DEFINIÇÃO | ERS p.8 texto e diagrama Quizz–Perguntas–Alternativas | Texto atribui pontuação à pergunta; diagrama à alternativa. Sem regra para múltiplas corretas, tentativas ou percentual. D08: decidir unidade de pontuação e política de correção; só depois gerar prompt de cálculo. | Decisão |
| RF41 | Professor visualizar resultados dos quizzes | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Sem consulta de resultados e sem vínculo de professor responsável. P38: consulta restrita aos alunos/atividades acompanhados; depende de D03/D06. | P1 |
| RF42 | Visitante visualizar informações de quizzes sem responder | NÃO IMPLEMENTADO | Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13 | Link visitante sem destino e nenhum resumo público de quizzes. P34 e P33: informações públicas separadas; negar resposta sem sessão. | P1 |
| RF43 | Aluno participar dos projetos disponibilizados para seu perfil | IMPLEMENTADO COM ERROS | server/index.js:231 projeto_aluno e :295 syncProjetoAlunos; mainPage/cadastro.js:535 carregarMeusProjetos | API entrega todos os projetos; vínculo não é checado nas operações. Inscrição voluntária não está definida. P07 e P19: tornar participação e consulta seguras; não criar autoinscrição sem D09. | P0 |
| RF44 | Aluno enviar arquivos relacionados às atividades | PARCIALMENTE IMPLEMENTADO | server/index.js:860 POST /documentos; mainPage/cadastro.js:694 enviarDocumento; server/sql/documentos.sql:7 | Sem associação ao subprojeto/atividade; falta autorização por vínculo e validação de conteúdo/tamanho. P07, P08, P16 e P37. D07 bloqueia somente a associação ainda indefinida. | P1 |
| RF45 | Aluno inserir descrição do arquivo enviado | IMPLEMENTADO COM ERROS | mainPage/menuCadastro.html:136; mainPage/cadastro.js:695; server/index.js:872 e :891 | Aceita whitespace/tipo inadequado por API e descrição maior que VARCHAR(255); sessão não prova autoria. P01 e P16: validar texto e limites sem inventar campos de conteúdo. | P1 |
| RF46 | Aluno inserir texto explicativo da atividade | NÃO IMPLEMENTADO | server/sql/documentos.sql:10; server/index.js:863; mainPage/menuCadastro.html:135 | Campo texto explicativo separado não existe; ERS §5.3 lista descrição e texto em itens distintos. P37: campo independente, tela/API/banco; vínculo da atividade fica aguardando D07. | P1 |
| RF47 | Registrar data e usuário responsável pelo envio | IMPLEMENTADO COM ERROS | server/sql/documentos.sql:13; server/index.js:869 e :891; migrações de documentos | Identidade pode ser escolhida sem senha; IDs de tabelas distintas colidem; administrador é registrado como aluno. P01 e P09: autoria por credencial vinculada e migração de legados sem atribuição fictícia. | P0 |
| RF48 | Professor visualizar atividades enviadas pelos alunos | IMPLEMENTADO COM ERROS | server/index.js:827 GET /documentos; mainPage/cadastro.js:619 e :646 renderDocumentosList | Professor vê documentos de qualquer projeto; não há subprojeto/atividade nem verificação de responsabilidade. P07, P08 e P19; extensão para atividade depende de D07. | P0 |
| RF49 | Registrar resultados dos alunos nos quizzes | NÃO IMPLEMENTADO | Inventário; server/index.js tabelas :171–239 e rotas :390–918 | Nenhum resultado persistido ligado a aluno/tentativa. P35: gravar identidade e respostas; conclusão do resultado depende da decisão/cálculo D08. | P1 |
| RF50 | Professor consultar desempenho dos alunos | NÃO IMPLEMENTADO | mainPage/cadastro.js:646; ERS §6.5 pp.10–11 | Sem aluno/quiz/data/pontuação/percentual em consultas de resultado. P38: consulta mínima de resultados confirmados; painéis de evolução dependem de D06. | P1 |
| RF51 | Aluno consultar seu próprio desempenho | NÃO IMPLEMENTADO | mainPage/menuCadastro.html:25; ERS §5.7 p.10 | Sem histórico de quizzes, pontuação e acertos por aluno. P38: histórico próprio dos resultados; depende da apuração em D08. | P1 |
| RF52 | Apresentar informações sobre a evolução do aprendizado | PENDENTE DE DEFINIÇÃO | ERS p.1 comentário sobre desempenho; §5.7 e §6.5; mainPage/menuCadastro.html:25 | Indicadores de evolução, agregação, atividades e comparabilidade não definidos. D06: definir indicadores e critérios mensuráveis; sem inventar gráficos ou gamificação. | Decisão |
| RNF01 | Interface simples e intuitiva | NÃO VERIFICADO | mainPage/menuCadastro.html; mainPage/menu.css | Não houve avaliação com usuários; links inativos e seletor de identidade atrapalham, mas não bastam para medir intuitividade. P44: verificar usabilidade por tarefas após correções. | P2 |
| RNF02 | Funcionalidades organizadas claramente | PARCIALMENTE IMPLEMENTADO | mainPage/menuCadastro.html:25; mainPage/cadastro.js:59 hideAll e :981 | Menus previstos não existem; falta retorno para início e identidade vem de seletor. P13, P19, P23 e P33: navegação dos módulos confirmados. | P1 |
| RNF03 | Mensagens claras de erro, confirmação e operação | IMPLEMENTADO COM ERROS | mainPage/cadastro.js:71, :729, :819; server/index.js:925 | Leituras não verificam HTTP; edições/exclusões inexistentes podem anunciar sucesso; handler retorna 400 para tudo. P14 e P15. | P1 |
| RNF04 | Reduzir etapas de operações frequentes | NÃO VERIFICADO | mainPage/cadastro.js:104 e :476 | Não há tarefas de referência nem medida de passos; seleção manual de identidade adiciona etapas. P44: observar operações frequentes e registrar resultado. | P2 |
| RNF05 | Bom desempenho em dispositivos móveis | NÃO VERIFICADO | mainPage/menu.css:921; login/login.css | Sem execução em dispositivos móveis nem medição. P44: medir em Android/iOS após corrigir URL da API. | P2 |
| RNF06 | Carregamento das telas em tempo adequado | NÃO VERIFICADO | server/index.js:696; mainPage/cadastro.js:71 | Sem meta de latência, volume ou ambiente; N+1 é risco mensurável ainda não benchmarkado. P42 e P44: medir lista e fixar referência junto ao responsável. | P2 |
| RNF07 | Evitar carregamentos desnecessários de arquivos/conteúdos | IMPLEMENTADO COM ERROS | mainPage/cadastro.js:446; server/index.js:341 e :696 | Carrega todos os projetos/membros antes de filtrar; servidor realiza 1+2N consultas, mais possíveis fallbacks; fontes externas. P07 e P42: restringir consulta e remover N+1; não afirmar ganho sem medir. | P2 |
| RNF08 | Código organizado e documentado | PARCIALMENTE IMPLEMENTADO | server/index.js (942 linhas); mainPage/cadastro.js (1000 linhas); server/package.json:6 | Falta guia de execução/migração e limites de módulos; comentários sobre ausência de login estão desatualizados. P04 e P45: documentar setup e módulos. | P2 |
| RNF09 | Desenvolvimento modular para manutenção | PARCIALMENTE IMPLEMENTADO | server/index.js:94, :283, :341; mainPage/cadastro.js:24 | Rotas, DDL, autenticação e arquivos no mesmo index.js; frontend concentra todos os fluxos. P45: extração incremental após testes de regressão. | P2 |
| RNF10 | Disponibilidade enquanto o serviço estiver funcionando | NÃO VERIFICADO | server/index.js:931 main | Não foi iniciado contra banco real: bootstrap executa DDL e cria administrador. Sem prova de recuperação, disponibilidade ou hospedagem. P04 e P44: homologar ciclo de serviço com banco descartável. | P2 |
| RNF11 | Interface adaptada a telas móveis | PARCIALMENTE IMPLEMENTADO | mainPage/menuCadastro.html:5; mainPage/menu.css:921; mainPage/cadastro.js:961 | API localhost impede acesso por celular a backend remoto; rodapé sem wrap pode transbordar; toque/teclado não validados. P03 e P44: corrigir endereço e validar layouts. | P2 |
| RS01 | Controlar acesso por perfil | IMPLEMENTADO COM ERROS | server/index.js:108 e :118 | Proteção de administrador não cobre usuários/projetos/contas. P02 e P07. | P0 |
| RS02 | Armazenar credenciais com segurança | IMPLEMENTADO COM ERROS | server/index.js:129, :411 e :445 | Senha inserida/comparada em texto puro; credenciais e segredo fixos no código. P01. | P0 |
| RS03 | Não armazenar senhas em texto puro | IMPLEMENTADO COM ERROS | server/index.js:411 e :445 | Nenhuma função de hash/salt/verificação; senha padrão inserida no bootstrap. P01. | P0 |
| RS04 | Proteger dados pessoais de acesso não autorizado | IMPLEMENTADO COM ERROS | server/index.js:471, :498, :531 e :689 | Nomes públicos e sessão sem senha dão acesso a dados de todos; projetos incluem detalhes de membros. P01, P02 e P07. | P0 |
| RS05 | Impedir funcionalidades de outro perfil | IMPLEMENTADO COM ERROS | mainPage/cadastro.js:981; server/index.js:390 e :625 | Aluno cria conta administrativa e exclui professor em ensaio isolado. P02. | P0 |
| RS06 | Validar dados dos formulários | IMPLEMENTADO COM ERROS | server/index.js:364, :593, :656; mainPage/cadastro.js:788 | Matrícula/curso/turma/e-mail/telefone não obrigatórios; tipos e tamanhos não verificados. P10, P16, P11 e P12. | P0 |
| RS07 | Controlar acesso aos arquivos enviados | IMPLEMENTADO COM ERROS | server/index.js:46 e :827 | Bytes são servidos por express.static sem autenticação; metadados não filtram vínculo nem perfil do autor. P07 e P08. | P0 |
| RC01 | Compatibilidade com dispositivos móveis | PARCIALMENTE IMPLEMENTADO | login/login.html:5; mainPage/menu.css:921; mainPage/cadastro.js:1 | API localhost fixa aponta para o próprio celular; ausência de teste real. P03 e P44. | P2 |
| RC02 | Funcionamento em Android | NÃO VERIFICADO | mainPage/menuCadastro.html; login/login.html; inventário | Não houve teste nesses sistemas; ERS não exige explicitamente app nativo. P44: matriz de navegadores reais; esclarecer distribuição em D12. | P2 |
| RC03 | Funcionamento em iOS | NÃO VERIFICADO | mainPage/menuCadastro.html; login/login.html; inventário | Não houve teste nesses sistemas; ERS não exige explicitamente app nativo. P44: matriz de navegadores reais; esclarecer distribuição em D12. | P2 |
| RC04 | Adaptação a resoluções diferentes | PARCIALMENTE IMPLEMENTADO | mainPage/menu.css:921; login/login.css:26 | Possível overflow de botões/textos longos; sem ensaio visual de telas atuais. P44. | P2 |
| RC05 | Compatibilidade com navegadores modernos | NÃO VERIFICADO | mainPage/menu.css:720; mainPage/cadastro.js:7; login/login.css:32 | Sem matriz/versionamento de browsers ou execução em navegador nesta auditoria. P44. | P2 |
| RN01 | Só administradores cadastram/excluem usuários | IMPLEMENTADO COM ERROS | server/index.js:390, :625 e :656 | requireAdmin ausente; T04/T06 reproduziram bypass. P02. | P0 |
| RN02 | Só autenticados acessam funcionalidades restritas | IMPLEMENTADO COM ERROS | server/index.js:108; :498 /sessao/pessoa; :46 /uploads | Sessão de pessoa criada sem credencial; arquivos acessíveis sem sessão. P01 e P08. | P0 |
| RN03 | Visitantes não respondem quizzes | NÃO IMPLEMENTADO | Inventário; ERS p.16 | Inexistência de quiz não comprova regra de autorização implementada. P35: negar submissão anônima e de perfis não alunos. | P1 |
| RN04 | Projeto com vários subprojetos | NÃO IMPLEMENTADO | server/index.js:208 e inventário | Relação e persistência ausentes. P20. | P1 |
| RN05 | Subprojeto com conteúdos e quizzes relacionados | PENDENTE DE DEFINIÇÃO | ERS pp.1,3,8 e16; inventário | Conteúdo a confirmar e vínculo quiz contraditório no diagrama. D02 e D03; sem prompt para relação indefinida. | Decisão |
| RN06 | Aluno acessa só projetos/atividades disponibilizados | IMPLEMENTADO COM ERROS | mainPage/cadastro.js:535; server/index.js:689 e :860 | GET/POST não conferem vínculo; sessão pode impersonar outro aluno. P01 e P07. | P0 |
| RN07 | Professor consulta resultados das atividades acompanhadas | NÃO IMPLEMENTADO | server/index.js:827; mainPage/cadastro.js:646 | Sem resultados nem restrição por responsabilidade acadêmica. P38 após P07 e decisões de quiz. | P1 |
| RN08 | Campos obrigatórios preenchidos antes do cadastro | IMPLEMENTADO COM ERROS | server/index.js:663; mainPage/cadastro.js:796 | Aluno sem matrícula, curso, turma, e-mail e telefone é aceito; PUT aceita nome vazio. P11 e P12. | P1 |
| RN09 | Telefone no formato brasileiro | NÃO IMPLEMENTADO | mainPage/menuCadastro.html:247 e :300; mainPage/cadastro.js:759 e :788 | Sem máscara JavaScript, validação ou normalização. P12: máscara (99) 99999-9999 com validação no servidor. | P1 |
| RN10 | Arquivos de editais em PDF | REMOVIDO DO ESCOPO | ERS p.3 remoção explícita; p.16 mantém RN10 | Parte do escopo removido de editais. D01: consolidar documento; sem prompt de implementação. | Fora do escopo |
| RN11 | Resultado vinculado ao aluno que respondeu | NÃO IMPLEMENTADO | server/index.js:449 e :523; inventário | Não há persistência do resultado; identidade de pessoa é selecionável. P06 e P35; apuração depende de D08. | P1 |

## Análise individual

### RF01 — Login de administradores, professores e alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Login consulta usuarios e cria sessão; há escolha de aluno/professor.
- **Evidências:** server/index.js:423 fazer login; :498 /sessao/pessoa; mainPage/cadastro.js:463 confirmarIdentidadePessoa; login/login.js:3 fazerLogin.
- **O que falta / erros / inconsistências:** Cadastro de pessoa não gera credencial vinculada; escolha pública de pessoa dispensa senha.
- **Para concluir:** P01, P06 e P13: autenticação real, vínculo persistente e tela coerente.
- **Prioridade:** P0. **Prompts relacionados:** P01, P06, P13
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RF02 — Acesso de visitante sem autenticação

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Somente link visual de visitante.
- **Evidências:** login/login.html:25; server/index.js:689 GET /projetos exige requireAuth.
- **O que falta / erros / inconsistências:** href="#" não abre área pública; não há catálogo público.
- **Para concluir:** P33: criar entrada e informações públicas de projetos; conteúdos aguardam D02.
- **Prioridade:** P1. **Prompts relacionados:** P33
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF03 — Identificação do perfil autenticado

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Perfil vem do banco em /login e é armazenado na sessão e localStorage.
- **Evidências:** server/index.js:449 e :523; mainPage/cadastro.js:428 perfilAtual e :981 aplicarPermissoes.
- **O que falta / erros / inconsistências:** Perfil da interface é manipulável; identidade de conta não é ligada a aluno/professor e pode ser trocada sem credencial.
- **Para concluir:** P01, P06 e P13: usar a identidade confirmada pelo servidor.
- **Prioridade:** P0. **Prompts relacionados:** P01, P06, P13
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF04 — Controle de funcionalidades por perfil

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** requireAuth e requireAdmin; menu ocultado por perfil.
- **Evidências:** server/index.js:108 requireAuth, :118 requireAdmin, :390 /cadastro, :625 DELETE /usuarios; mainPage/cadastro.js:981.
- **O que falta / erros / inconsistências:** requireAdmin só protege DELETE /documentos; aluno executa operações administrativas.
- **Para concluir:** P02 e P07: autorização por operação e vínculo no servidor.
- **Prioridade:** P0. **Prompts relacionados:** P02, P07, P13
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RF05 — Recuperação de senha

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Texto e link na tela de login.
- **Evidências:** login/login.html:21; login/login.js:3; server/index.js:423.
- **O que falta / erros / inconsistências:** Link sem ação; faltam token temporário, alteração de hash e envio de instruções.
- **Para concluir:** P40: fluxo de recuperação por e-mail.
- **Prioridade:** P1. **Prompts relacionados:** P40, P41
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF06 — Informar credenciais inválidas

- **Situação:** IMPLEMENTADO.
- **O que existe:** Servidor retorna erro para usuário inexistente ou senha incorreta; frontend apresenta data.erro.
- **Evidências:** server/index.js:439 e :445; login/login.js:26.
- **O que falta / erros / inconsistências:** Ensaio T10 confirmou 401 com senha inválida; texto do alert verificado por leitura. Risco de enumeração em E12 não invalida a presença da mensagem.
- **Para concluir:** Preservar comportamento; P01 uniformiza respostas por segurança sem criar tarefa duplicada.
- **Prioridade:** P2. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** 100% de cobertura atribuída; mensagem no frontend verificada por código e erro 401 reproduzido em API isolada.

### RF07 — Administrador cadastrar alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Formulário, POST e INSERT aluno.
- **Evidências:** server/index.js:656 /cadastro-dashboard; mainPage/cadastro.js:788 submitAluno.
- **O que falta / erros / inconsistências:** Somente nome é exigido; sem autorização de administrador nem criação de credenciais.
- **Para concluir:** P02, P06, P11 e P12.
- **Prioridade:** P1. **Prompts relacionados:** P02, P06, P11, P12
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF08 — Administrador consultar alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** GET lista/detalhe e renderização de alunos.
- **Evidências:** server/index.js:531 e :568; mainPage/cadastro.js:71 showForm e :729 editUser.
- **O que falta / erros / inconsistências:** Qualquer sessão acessa todos os dados pessoais; leitura não verifica res.ok.
- **Para concluir:** P02, P07 e P14.
- **Prioridade:** P1. **Prompts relacionados:** P02, P07, P14
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF09 — Administrador alterar alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Carregamento para edição, PUT e UPDATE aluno.
- **Evidências:** server/index.js:593 PUT /usuarios; mainPage/cadastro.js:788 submitAluno.
- **O que falta / erros / inconsistências:** Sem autorização, validação obrigatória e checagem de existência.
- **Para concluir:** P02, P11, P12 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P11, P12, P15
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF10 — Administrador excluir alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Confirmação na interface e exclusão com limpeza de vínculo projeto_aluno.
- **Evidências:** server/index.js:625 DELETE /usuarios; mainPage/cadastro.js:819 deleteUser.
- **O que falta / erros / inconsistências:** Não exige administrador; retorna sucesso com zero registros; autoria documental pode ficar órfã.
- **Para concluir:** P02, P09 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P15
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF11 — Administrador cadastrar professores

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** POST e INSERT professor com formulário.
- **Evidências:** server/index.js:656; mainPage/cadastro.js:759 submitProfessor.
- **O que falta / erros / inconsistências:** Sem autorização nem credencial vinculada; validações genéricas ausentes.
- **Para concluir:** P02, P06 e P11.
- **Prioridade:** P1. **Prompts relacionados:** P02, P06, P11
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF12 — Administrador consultar professores

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** GET lista/detalhe e renderização de professores.
- **Evidências:** server/index.js:531 e :568; mainPage/cadastro.js:71 e :729.
- **O que falta / erros / inconsistências:** Dados pessoais sem restrição de perfil/vínculo; leitura sem res.ok.
- **Para concluir:** P02, P07 e P14.
- **Prioridade:** P1. **Prompts relacionados:** P02, P07, P14
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF13 — Administrador alterar professores

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** PUT, UPDATE professor e tela de edição.
- **Evidências:** server/index.js:593; mainPage/cadastro.js:759.
- **O que falta / erros / inconsistências:** Sem autorização; aceita nome vazio no PUT e não verifica affectedRows.
- **Para concluir:** P02, P11 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P11, P15
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF14 — Administrador excluir professores

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Confirmação e remoção dos vínculos do professor.
- **Evidências:** server/index.js:625; mainPage/cadastro.js:819.
- **O que falta / erros / inconsistências:** Aluno pode excluir professor; ausência de registro não é reportada; autoria fica sem referência segura.
- **Para concluir:** P02, P09 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P15
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF15 — Administrador criar projetos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Nome, descrição, objetivo, membros e INSERT transacional.
- **Evidências:** server/index.js:364 validarProjetoPayload e :710 POST /projetos; mainPage/cadastro.js:891 submitProjeto.
- **O que falta / erros / inconsistências:** Sem autorização; status ausente; IDs relacionados não são conferidos; período depende de D05.
- **Para concluir:** P02, P10 e P18.
- **Prioridade:** P1. **Prompts relacionados:** P02, P05, P10, P18
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF16 — Administrador consultar projetos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Lista/detalhe com membros associados.
- **Evidências:** server/index.js:689 e :736; mainPage/cadastro.js:71 e :853 editProjeto.
- **O que falta / erros / inconsistências:** Lista expõe todos os projetos e dados pessoais; descrição da lista é alterada com texto de membros; faltam status/subprojetos.
- **Para concluir:** P07, P18, P23 e P42.
- **Prioridade:** P1. **Prompts relacionados:** P02, P07, P14, P18, P19, P42
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF17 — Administrador alterar projetos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** PUT e sincronização de vínculos.
- **Evidências:** server/index.js:755; mainPage/cadastro.js:853 e :891.
- **O que falta / erros / inconsistências:** Sem autorização; status ausente; atualização de ID inexistente não é detectada.
- **Para concluir:** P02, P10, P18 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P05, P10, P15, P18
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF18 — Administrador excluir projetos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Confirmação e transação removendo projeto e associações.
- **Evidências:** server/index.js:781; mainPage/cadastro.js:926 deleteProjeto.
- **O que falta / erros / inconsistências:** Sem autorização; cascata SQL de documentos não apaga arquivos físicos; retorna sucesso sem existência.
- **Para concluir:** P02, P17 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P02, P05, P15, P17
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF19 — Projeto possuir um ou mais subprojetos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Existe projeto, sem entidade subprojeto.
- **Evidências:** server/index.js:208 CREATE projeto; mainPage/menuCadastro.html:204 lista de projetos; inventário integral.
- **O que falta / erros / inconsistências:** Sem tabela, FK, rotas ou navegação de subprojetos.
- **Para concluir:** P20 e P23: relação projeto 1:N subprojeto.
- **Prioridade:** P1. **Prompts relacionados:** P20, P23
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF20 — Administrador criar subprojetos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Nenhum fluxo correspondente encontrado.
- **Evidências:** server/index.js:208; mainPage/menuCadastro.html:25; ERS §4.1.8 p.8.
- **O que falta / erros / inconsistências:** Faltam título, objetivo, descrição, temas e projeto relacionado nas camadas.
- **Para concluir:** P20 e P23: cadastro e integração da tela.
- **Prioridade:** P1. **Prompts relacionados:** P20, P23, P24
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF21 — Administrador alterar subprojetos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não existe subprojeto no código.
- **Evidências:** Inventário; server/index.js rotas :390–918; mainPage/cadastro.js:24 formMap.
- **O que falta / erros / inconsistências:** Sem leitura/edição/persistência.
- **Para concluir:** P21 e P23.
- **Prioridade:** P1. **Prompts relacionados:** P21, P25
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF22 — Administrador excluir subprojetos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não existe subprojeto no código.
- **Evidências:** Inventário; server/index.js:781 exclusão cobre somente projeto.
- **O que falta / erros / inconsistências:** Faltam exclusão, confirmação e política de dependentes.
- **Para concluir:** P22 e P23; política de arquivos em D07 antes de cascatas.
- **Prioridade:** P1. **Prompts relacionados:** P22, P26
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF23 — Associar conteúdos aos subprojetos

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não foi encontrado módulo de conteúdo educacional; documentos são submissões de projeto.
- **Evidências:** ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114.
- **O que falta / erros / inconsistências:** Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito.
- **Para concluir:** D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF24 — Administrador cadastrar conteúdos

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não foi encontrado módulo de conteúdo educacional; documentos são submissões de projeto.
- **Evidências:** ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114.
- **O que falta / erros / inconsistências:** Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito.
- **Para concluir:** D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF25 — Associar conteúdos a projetos ou subprojetos

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não foi encontrado módulo de conteúdo educacional; documentos são submissões de projeto.
- **Evidências:** ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114.
- **O que falta / erros / inconsistências:** Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito.
- **Para concluir:** D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF26 — Visualizar conteúdos por usuários autorizados

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não foi encontrado módulo de conteúdo educacional; documentos são submissões de projeto.
- **Evidências:** ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114.
- **O que falta / erros / inconsistências:** Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito.
- **Para concluir:** D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF27 — Disponibilizar conteúdos públicos para visitantes

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não foi encontrado módulo de conteúdo educacional; documentos são submissões de projeto.
- **Evidências:** ERS pp.3–4 comentários sobre conteúdos; server/index.js:814 mapDocumentoRow; mainPage/menuCadastro.html:114.
- **O que falta / erros / inconsistências:** Escopo dos conteúdos está expressamente a confirmar; upload de atividade não comprova este requisito.
- **Para concluir:** D02: esclarecer conteúdo como entidade, página de subprojeto ou arquivo; só depois gerar prompts.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF28 — Administrador cadastrar editais

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Não há implementação de editais.
- **Evidências:** ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário.
- **O que falta / erros / inconsistências:** Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite.
- **Para concluir:** D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF29 — Data de abertura do edital

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Não há implementação de editais.
- **Evidências:** ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário.
- **O que falta / erros / inconsistências:** Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite.
- **Para concluir:** D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF30 — Prazo para submissão

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Não há implementação de editais.
- **Evidências:** ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário.
- **O que falta / erros / inconsistências:** Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite.
- **Para concluir:** D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF31 — Upload do edital em PDF

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Não há implementação de editais.
- **Evidências:** ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário.
- **O que falta / erros / inconsistências:** Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite.
- **Para concluir:** D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF32 — Visualização dos editais publicados

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Não há implementação de editais.
- **Evidências:** ERS pp.1,3–4: remoção solicitada por Lorena; requisitos mantidos p.13; inventário.
- **O que falta / erros / inconsistências:** Decisão explícita de remoção no PDF não foi propagada a processos, menus e aceite.
- **Para concluir:** D01: consolidar a ERS e confirmar que a nota continua vigente; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF33 — Administrador criar quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Sem entidade/rota/tela de quiz. Vínculo projeto/subprojeto diverge entre texto e diagrama.
- **Para concluir:** P27: núcleo administrativo confirmado; relação fica bloqueada por D03.
- **Prioridade:** P1. **Prompts relacionados:** P27, P28
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF34 — Administrador editar quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Não há edição ou consulta administrativa de quiz.
- **Para concluir:** P29: edição; políticas de tentativas e alteração após respostas dependem de D08.
- **Prioridade:** P1. **Prompts relacionados:** P29, P30
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF35 — Administrador excluir quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Não há exclusão nem proteção dos resultados vinculados.
- **Para concluir:** P31: exclusão; retenção/histórico depende de D08.
- **Prioridade:** P1. **Prompts relacionados:** P31, P32
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF36 — Administrador publicar quizzes

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Não existe módulo de quiz.
- **Evidências:** ERS p.8 §4.1.9; server/index.js rotas.
- **O que falta / erros / inconsistências:** Publicado, aberto e encerrado não possuem transições ou relação de permissão definidas; diagrama apenas Status.
- **Para concluir:** D04: consolidar estado e transições; gerar prompt de publicação após decisão.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF37 — Aluno visualizar quizzes disponíveis para seu perfil

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Não há catálogo de quizzes nem filtragem no servidor.
- **Para concluir:** P34: catálogo restrito; depende da consolidação de vínculo e publicação em D03/D04.
- **Prioridade:** P1. **Prompts relacionados:** P34
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF38 — Aluno responder quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Não há formulário de resposta ou submissão.
- **Para concluir:** P35: respostas autenticadas; depende de D03/D04/D08.
- **Prioridade:** P1. **Prompts relacionados:** P36
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF39 — Registrar respostas dos alunos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Sem entidade resposta/tentativa ou persistência.
- **Para concluir:** P35: salvar respostas ligadas ao aluno e quiz em transação.
- **Prioridade:** P1. **Prompts relacionados:** P35
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF40 — Calcular pontuação do aluno

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Nenhum cálculo encontrado.
- **Evidências:** ERS p.8 texto e diagrama Quizz–Perguntas–Alternativas.
- **O que falta / erros / inconsistências:** Texto atribui pontuação à pergunta; diagrama à alternativa. Sem regra para múltiplas corretas, tentativas ou percentual.
- **Para concluir:** D08: decidir unidade de pontuação e política de correção; só depois gerar prompt de cálculo.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RF41 — Professor visualizar resultados dos quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Sem consulta de resultados e sem vínculo de professor responsável.
- **Para concluir:** P38: consulta restrita aos alunos/atividades acompanhados; depende de D03/D06.
- **Prioridade:** P1. **Prompts relacionados:** P39
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF42 — Visitante visualizar informações de quizzes sem responder

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não foi localizada implementação de quizzes.
- **Evidências:** Inventário de fontes e SQL; server/index.js:390–918; ERS pp.8,13.
- **O que falta / erros / inconsistências:** Link visitante sem destino e nenhum resumo público de quizzes.
- **Para concluir:** P34 e P33: informações públicas separadas; negar resposta sem sessão.
- **Prioridade:** P1. **Prompts relacionados:** P33, P34
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF43 — Aluno participar dos projetos disponibilizados para seu perfil

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Administrador associa alunos; Meus Projetos filtra aluno_ids na interface.
- **Evidências:** server/index.js:231 projeto_aluno e :295 syncProjetoAlunos; mainPage/cadastro.js:535 carregarMeusProjetos.
- **O que falta / erros / inconsistências:** API entrega todos os projetos; vínculo não é checado nas operações. Inscrição voluntária não está definida.
- **Para concluir:** P07 e P19: tornar participação e consulta seguras; não criar autoinscrição sem D09.
- **Prioridade:** P0. **Prompts relacionados:** P07, P19
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF44 — Aluno enviar arquivos relacionados às atividades

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Upload para projeto com Multer, FormData e INSERT documentos.
- **Evidências:** server/index.js:860 POST /documentos; mainPage/cadastro.js:694 enviarDocumento; server/sql/documentos.sql:7.
- **O que falta / erros / inconsistências:** Sem associação ao subprojeto/atividade; falta autorização por vínculo e validação de conteúdo/tamanho.
- **Para concluir:** P07, P08, P16 e P37. D07 bloqueia somente a associação ainda indefinida.
- **Prioridade:** P1. **Prompts relacionados:** P04, P07, P08, P16, P17, P37
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF45 — Aluno inserir descrição do arquivo enviado

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Campo descrição, exigência no frontend/backend e persistência.
- **Evidências:** mainPage/menuCadastro.html:136; mainPage/cadastro.js:695; server/index.js:872 e :891.
- **O que falta / erros / inconsistências:** Aceita whitespace/tipo inadequado por API e descrição maior que VARCHAR(255); sessão não prova autoria.
- **Para concluir:** P01 e P16: validar texto e limites sem inventar campos de conteúdo.
- **Prioridade:** P1. **Prompts relacionados:** P16, P37
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF46 — Aluno inserir texto explicativo da atividade

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Somente descricao é armazenada.
- **Evidências:** server/sql/documentos.sql:10; server/index.js:863; mainPage/menuCadastro.html:135.
- **O que falta / erros / inconsistências:** Campo texto explicativo separado não existe; ERS §5.3 lista descrição e texto em itens distintos.
- **Para concluir:** P37: campo independente, tela/API/banco; vínculo da atividade fica aguardando D07.
- **Prioridade:** P1. **Prompts relacionados:** P37
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF47 — Registrar data e usuário responsável pelo envio

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Timestamp SQL e autor extraído da sessão.
- **Evidências:** server/sql/documentos.sql:13; server/index.js:869 e :891; migrações de documentos.
- **O que falta / erros / inconsistências:** Identidade pode ser escolhida sem senha; IDs de tabelas distintas colidem; administrador é registrado como aluno.
- **Para concluir:** P01 e P09: autoria por credencial vinculada e migração de legados sem atribuição fictícia.
- **Prioridade:** P0. **Prompts relacionados:** P04, P06, P09
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RF48 — Professor visualizar atividades enviadas pelos alunos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Professor lista documentos por projeto e frontend exibe autor.
- **Evidências:** server/index.js:827 GET /documentos; mainPage/cadastro.js:619 e :646 renderDocumentosList.
- **O que falta / erros / inconsistências:** Professor vê documentos de qualquer projeto; não há subprojeto/atividade nem verificação de responsabilidade.
- **Para concluir:** P07, P08 e P19; extensão para atividade depende de D07.
- **Prioridade:** P0. **Prompts relacionados:** P07, P08, P09, P19
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RF49 — Registrar resultados dos alunos nos quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Sem tabelas ou rotas de resultado.
- **Evidências:** Inventário; server/index.js tabelas :171–239 e rotas :390–918.
- **O que falta / erros / inconsistências:** Nenhum resultado persistido ligado a aluno/tentativa.
- **Para concluir:** P35: gravar identidade e respostas; conclusão do resultado depende da decisão/cálculo D08.
- **Prioridade:** P1. **Prompts relacionados:** P35
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF50 — Professor consultar desempenho dos alunos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Consulta atual cobre documentos enviados, sem pontuação.
- **Evidências:** mainPage/cadastro.js:646; ERS §6.5 pp.10–11.
- **O que falta / erros / inconsistências:** Sem aluno/quiz/data/pontuação/percentual em consultas de resultado.
- **Para concluir:** P38: consulta mínima de resultados confirmados; painéis de evolução dependem de D06.
- **Prioridade:** P1. **Prompts relacionados:** P38, P39
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF51 — Aluno consultar seu próprio desempenho

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Sem área de desempenho.
- **Evidências:** mainPage/menuCadastro.html:25; ERS §5.7 p.10.
- **O que falta / erros / inconsistências:** Sem histórico de quizzes, pontuação e acertos por aluno.
- **Para concluir:** P38: histórico próprio dos resultados; depende da apuração em D08.
- **Prioridade:** P1. **Prompts relacionados:** P38
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RF52 — Apresentar informações sobre a evolução do aprendizado

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Nenhum acompanhamento temporal localizado.
- **Evidências:** ERS p.1 comentário sobre desempenho; §5.7 e §6.5; mainPage/menuCadastro.html:25.
- **O que falta / erros / inconsistências:** Indicadores de evolução, agregação, atividades e comparabilidade não definidos.
- **Para concluir:** D06: definir indicadores e critérios mensuráveis; sem inventar gráficos ou gamificação.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF01 — Interface simples e intuitiva

- **Situação:** NÃO VERIFICADO.
- **O que existe:** Painéis, busca, feedback e estilos consistentes.
- **Evidências:** mainPage/menuCadastro.html; mainPage/menu.css.
- **O que falta / erros / inconsistências:** Não houve avaliação com usuários; links inativos e seletor de identidade atrapalham, mas não bastam para medir intuitividade.
- **Para concluir:** P44: verificar usabilidade por tarefas após correções.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF02 — Funcionalidades organizadas claramente

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Menus de cadastros e Meus Projetos separados.
- **Evidências:** mainPage/menuCadastro.html:25; mainPage/cadastro.js:59 hideAll e :981.
- **O que falta / erros / inconsistências:** Menus previstos não existem; falta retorno para início e identidade vem de seletor.
- **Para concluir:** P13, P19, P23 e P33: navegação dos módulos confirmados.
- **Prioridade:** P1. **Prompts relacionados:** P13, P19, P23, P33
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RNF03 — Mensagens claras de erro, confirmação e operação

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Alerts, confirmação antes de exclusão e estados vazios/carregando.
- **Evidências:** mainPage/cadastro.js:71, :729, :819; server/index.js:925.
- **O que falta / erros / inconsistências:** Leituras não verificam HTTP; edições/exclusões inexistentes podem anunciar sucesso; handler retorna 400 para tudo.
- **Para concluir:** P14 e P15.
- **Prioridade:** P1. **Prompts relacionados:** P14, P15, P26, P28, P30, P32, P41
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RNF04 — Reduzir etapas de operações frequentes

- **Situação:** NÃO VERIFICADO.
- **O que existe:** Busca e filtros ajudam nas listagens.
- **Evidências:** mainPage/cadastro.js:104 e :476.
- **O que falta / erros / inconsistências:** Não há tarefas de referência nem medida de passos; seleção manual de identidade adiciona etapas.
- **Para concluir:** P44: observar operações frequentes e registrar resultado.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF05 — Bom desempenho em dispositivos móveis

- **Situação:** NÃO VERIFICADO.
- **O que existe:** CSS adaptativo e assets locais.
- **Evidências:** mainPage/menu.css:921; login/login.css.
- **O que falta / erros / inconsistências:** Sem execução em dispositivos móveis nem medição.
- **Para concluir:** P44: medir em Android/iOS após corrigir URL da API.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF06 — Carregamento das telas em tempo adequado

- **Situação:** NÃO VERIFICADO.
- **O que existe:** Busca é local após carregar dados.
- **Evidências:** server/index.js:696; mainPage/cadastro.js:71.
- **O que falta / erros / inconsistências:** Sem meta de latência, volume ou ambiente; N+1 é risco mensurável ainda não benchmarkado.
- **Para concluir:** P42 e P44: medir lista e fixar referência junto ao responsável.
- **Prioridade:** P2. **Prompts relacionados:** P42, P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF07 — Evitar carregamentos desnecessários de arquivos/conteúdos

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Cache de nomes por perfil na interface.
- **Evidências:** mainPage/cadastro.js:446; server/index.js:341 e :696.
- **O que falta / erros / inconsistências:** Carrega todos os projetos/membros antes de filtrar; servidor realiza 1+2N consultas, mais possíveis fallbacks; fontes externas.
- **Para concluir:** P07 e P42: restringir consulta e remover N+1; não afirmar ganho sem medir.
- **Prioridade:** P2. **Prompts relacionados:** P42
- **Validação e peso:** 50% de cobertura atribuída; há caminho de dados reconhecível, mas falta correção de comportamento/segurança; não validado ponta a ponta em MySQL real.

### RNF08 — Código organizado e documentado

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Separação de login/mainPage/server/sql; funções nomeadas e comentários.
- **Evidências:** server/index.js (942 linhas); mainPage/cadastro.js (1000 linhas); server/package.json:6.
- **O que falta / erros / inconsistências:** Falta guia de execução/migração e limites de módulos; comentários sobre ausência de login estão desatualizados.
- **Para concluir:** P04 e P45: documentar setup e módulos.
- **Prioridade:** P2. **Prompts relacionados:** P04, P43, P45, P46
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RNF09 — Desenvolvimento modular para manutenção

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Funções de mapeamento, validação e componentes visuais reutilizados.
- **Evidências:** server/index.js:94, :283, :341; mainPage/cadastro.js:24.
- **O que falta / erros / inconsistências:** Rotas, DDL, autenticação e arquivos no mesmo index.js; frontend concentra todos os fluxos.
- **Para concluir:** P45: extração incremental após testes de regressão.
- **Prioridade:** P2. **Prompts relacionados:** P05, P43, P45, P46
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RNF10 — Disponibilidade enquanto o serviço estiver funcionando

- **Situação:** NÃO VERIFICADO.
- **O que existe:** main inicia listener após connectDB.
- **Evidências:** server/index.js:931 main.
- **O que falta / erros / inconsistências:** Não foi iniciado contra banco real: bootstrap executa DDL e cria administrador. Sem prova de recuperação, disponibilidade ou hospedagem.
- **Para concluir:** P04 e P44: homologar ciclo de serviço com banco descartável.
- **Prioridade:** P2. **Prompts relacionados:** P04, P05
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RNF11 — Interface adaptada a telas móveis

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Viewport, sidebar móvel e breakpoint em 768px.
- **Evidências:** mainPage/menuCadastro.html:5; mainPage/menu.css:921; mainPage/cadastro.js:961.
- **O que falta / erros / inconsistências:** API localhost impede acesso por celular a backend remoto; rodapé sem wrap pode transbordar; toque/teclado não validados.
- **Para concluir:** P03 e P44: corrigir endereço e validar layouts.
- **Prioridade:** P2. **Prompts relacionados:** P03, P44
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RS01 — Controlar acesso por perfil

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Sessão e middleware de administrador existem.
- **Evidências:** server/index.js:108 e :118.
- **O que falta / erros / inconsistências:** Proteção de administrador não cobre usuários/projetos/contas.
- **Para concluir:** P02 e P07.
- **Prioridade:** P0. **Prompts relacionados:** P02, P07, P43
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS02 — Armazenar credenciais com segurança

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Coluna senha e comparação no login.
- **Evidências:** server/index.js:129, :411 e :445.
- **O que falta / erros / inconsistências:** Senha inserida/comparada em texto puro; credenciais e segredo fixos no código.
- **Para concluir:** P01.
- **Prioridade:** P0. **Prompts relacionados:** P01, P40
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS03 — Não armazenar senhas em texto puro

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Persistência de senha implementada.
- **Evidências:** server/index.js:411 e :445.
- **O que falta / erros / inconsistências:** Nenhuma função de hash/salt/verificação; senha padrão inserida no bootstrap.
- **Para concluir:** P01.
- **Prioridade:** P0. **Prompts relacionados:** P01, P40
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS04 — Proteger dados pessoais de acesso não autorizado

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** GET /usuarios exige sessão.
- **Evidências:** server/index.js:471, :498, :531 e :689.
- **O que falta / erros / inconsistências:** Nomes públicos e sessão sem senha dão acesso a dados de todos; projetos incluem detalhes de membros.
- **Para concluir:** P01, P02 e P07.
- **Prioridade:** P0. **Prompts relacionados:** P01, P03, P07, P09, P35, P40, P43
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS05 — Impedir funcionalidades de outro perfil

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Menus ocultados e exclusão de documento protegida.
- **Evidências:** mainPage/cadastro.js:981; server/index.js:390 e :625.
- **O que falta / erros / inconsistências:** Aluno cria conta administrativa e exclui professor em ensaio isolado.
- **Para concluir:** P02.
- **Prioridade:** P0. **Prompts relacionados:** P02, P07, P43
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS06 — Validar dados dos formulários

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Validações pontuais de presença e listas de IDs.
- **Evidências:** server/index.js:364, :593, :656; mainPage/cadastro.js:788.
- **O que falta / erros / inconsistências:** Matrícula/curso/turma/e-mail/telefone não obrigatórios; tipos e tamanhos não verificados.
- **Para concluir:** P10, P16, P11 e P12.
- **Prioridade:** P0. **Prompts relacionados:** P10, P11, P12, P16, P21, P24, P25, P27, P29, P43
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RS07 — Controlar acesso aos arquivos enviados

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Metadados exigem sessão; exclusão exige administrador.
- **Evidências:** server/index.js:46 e :827.
- **O que falta / erros / inconsistências:** Bytes são servidos por express.static sem autenticação; metadados não filtram vínculo nem perfil do autor.
- **Para concluir:** P07 e P08.
- **Prioridade:** P0. **Prompts relacionados:** P08, P09, P16, P17, P22, P43
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RC01 — Compatibilidade com dispositivos móveis

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** HTML responsivo com viewport.
- **Evidências:** login/login.html:5; mainPage/menu.css:921; mainPage/cadastro.js:1.
- **O que falta / erros / inconsistências:** API localhost fixa aponta para o próprio celular; ausência de teste real.
- **Para concluir:** P03 e P44.
- **Prioridade:** P2. **Prompts relacionados:** P03, P44
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RC02 — Funcionamento em Android

- **Situação:** NÃO VERIFICADO.
- **O que existe:** Aplicação web, sem pacote nativo no inventário.
- **Evidências:** mainPage/menuCadastro.html; login/login.html; inventário.
- **O que falta / erros / inconsistências:** Não houve teste nesses sistemas; ERS não exige explicitamente app nativo.
- **Para concluir:** P44: matriz de navegadores reais; esclarecer distribuição em D12.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RC03 — Funcionamento em iOS

- **Situação:** NÃO VERIFICADO.
- **O que existe:** Aplicação web, sem pacote nativo no inventário.
- **Evidências:** mainPage/menuCadastro.html; login/login.html; inventário.
- **O que falta / erros / inconsistências:** Não houve teste nesses sistemas; ERS não exige explicitamente app nativo.
- **Para concluir:** P44: matriz de navegadores reais; esclarecer distribuição em D12.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RC04 — Adaptação a resoluções diferentes

- **Situação:** PARCIALMENTE IMPLEMENTADO.
- **O que existe:** Layout flexível e breakpoint móvel.
- **Evidências:** mainPage/menu.css:921; login/login.css:26.
- **O que falta / erros / inconsistências:** Possível overflow de botões/textos longos; sem ensaio visual de telas atuais.
- **Para concluir:** P44.
- **Prioridade:** P2. **Prompts relacionados:** P03, P44
- **Validação e peso:** 50% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RC05 — Compatibilidade com navegadores modernos

- **Situação:** NÃO VERIFICADO.
- **O que existe:** JS moderno, fetch, FormData, CSS :has e backdrop-filter.
- **Evidências:** mainPage/menu.css:720; mainPage/cadastro.js:7; login/login.css:32.
- **O que falta / erros / inconsistências:** Sem matriz/versionamento de browsers ou execução em navegador nesta auditoria.
- **Para concluir:** P44.
- **Prioridade:** P2. **Prompts relacionados:** P44
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RN01 — Só administradores cadastram/excluem usuários

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Operações de cadastro e exclusão exigem alguma sessão.
- **Evidências:** server/index.js:390, :625 e :656.
- **O que falta / erros / inconsistências:** requireAdmin ausente; T04/T06 reproduziram bypass.
- **Para concluir:** P02.
- **Prioridade:** P0. **Prompts relacionados:** P02
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RN02 — Só autenticados acessam funcionalidades restritas

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** requireAuth bloqueia requisição sem identidade.
- **Evidências:** server/index.js:108; :498 /sessao/pessoa; :46 /uploads.
- **O que falta / erros / inconsistências:** Sessão de pessoa criada sem credencial; arquivos acessíveis sem sessão.
- **Para concluir:** P01 e P08.
- **Prioridade:** P0. **Prompts relacionados:** P01, P08
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RN03 — Visitantes não respondem quizzes

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Não existe endpoint de resposta.
- **Evidências:** Inventário; ERS p.16.
- **O que falta / erros / inconsistências:** Inexistência de quiz não comprova regra de autorização implementada.
- **Para concluir:** P35: negar submissão anônima e de perfis não alunos.
- **Prioridade:** P1. **Prompts relacionados:** P34, P36
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RN04 — Projeto com vários subprojetos

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Somente entidade projeto.
- **Evidências:** server/index.js:208 e inventário.
- **O que falta / erros / inconsistências:** Relação e persistência ausentes.
- **Para concluir:** P20.
- **Prioridade:** P1. **Prompts relacionados:** P20, P23
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RN05 — Subprojeto com conteúdos e quizzes relacionados

- **Situação:** PENDENTE DE DEFINIÇÃO.
- **O que existe:** Sem entidades subprojeto/conteúdo/quiz.
- **Evidências:** ERS pp.1,3,8 e16; inventário.
- **O que falta / erros / inconsistências:** Conteúdo a confirmar e vínculo quiz contraditório no diagrama.
- **Para concluir:** D02 e D03; sem prompt para relação indefinida.
- **Prioridade:** Decisão. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RN06 — Aluno acessa só projetos/atividades disponibilizados

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Filtro aluno_ids no navegador.
- **Evidências:** mainPage/cadastro.js:535; server/index.js:689 e :860.
- **O que falta / erros / inconsistências:** GET/POST não conferem vínculo; sessão pode impersonar outro aluno.
- **Para concluir:** P01 e P07.
- **Prioridade:** P0. **Prompts relacionados:** P07
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RN07 — Professor consulta resultados das atividades acompanhadas

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Existe leitura de documentos, sem resultados de quizzes.
- **Evidências:** server/index.js:827; mainPage/cadastro.js:646.
- **O que falta / erros / inconsistências:** Sem resultados nem restrição por responsabilidade acadêmica.
- **Para concluir:** P38 após P07 e decisões de quiz.
- **Prioridade:** P1. **Prompts relacionados:** P39
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RN08 — Campos obrigatórios preenchidos antes do cadastro

- **Situação:** IMPLEMENTADO COM ERROS.
- **O que existe:** Nome e perfil exigidos em cadastro de pessoa.
- **Evidências:** server/index.js:663; mainPage/cadastro.js:796.
- **O que falta / erros / inconsistências:** Aluno sem matrícula, curso, turma, e-mail e telefone é aceito; PUT aceita nome vazio.
- **Para concluir:** P11 e P12.
- **Prioridade:** P1. **Prompts relacionados:** P10, P11, P12
- **Validação e peso:** 0% de cobertura atribuída; falha inviabiliza a garantia central do requisito; existência de código não recebe crédito funcional neste item.

### RN09 — Telefone no formato brasileiro

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Há somente placeholder.
- **Evidências:** mainPage/menuCadastro.html:247 e :300; mainPage/cadastro.js:759 e :788.
- **O que falta / erros / inconsistências:** Sem máscara JavaScript, validação ou normalização.
- **Para concluir:** P12: máscara (99) 99999-9999 com validação no servidor.
- **Prioridade:** P1. **Prompts relacionados:** P12
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

### RN10 — Arquivos de editais em PDF

- **Situação:** REMOVIDO DO ESCOPO.
- **O que existe:** Nenhum edital localizado.
- **Evidências:** ERS p.3 remoção explícita; p.16 mantém RN10.
- **O que falta / erros / inconsistências:** Parte do escopo removido de editais.
- **Para concluir:** D01: consolidar documento; sem prompt de implementação.
- **Prioridade:** Fora do escopo. **Prompts relacionados:** Nenhum; preservar comportamento ou resolver decisão/escopo antes de gerar tarefa.
- **Validação e peso:** Excluído do percentual por remoção, indefinição ou evidência insuficiente.

### RN11 — Resultado vinculado ao aluno que respondeu

- **Situação:** NÃO IMPLEMENTADO.
- **O que existe:** Sem resultado nem vínculo aluno-conta confiável.
- **Evidências:** server/index.js:449 e :523; inventário.
- **O que falta / erros / inconsistências:** Não há persistência do resultado; identidade de pessoa é selecionável.
- **Para concluir:** P06 e P35; apuração depende de D08.
- **Prioridade:** P1. **Prompts relacionados:** P06, P35, P36, P38
- **Validação e peso:** 0% de cobertura atribuída; evidência estática; não validado ponta a ponta em banco/navegador real.

## Processos, interfaces e regras sem código próprio

| Referência ERS | Confronto e pendência | Encaminhamento |
|---|---|---|
| §4.1.1 e §13.1 login | Usuário/senha/logo/Entrar existem; seletor de perfil não existe no HTML; recuperação e visitante têm #. Sessão real do administrador existe, mas identidade acadêmica é insegura. | P01/P06/P13/P40/P41/P33. |
| §4.1.2 recuperação | Sem token, endereço administrativo recuperável ou serviço de e-mail. | P40/P41 e D11. |
| §4.1.3–4.1.6 alunos/professores | CRUD cruza HTML→fetch→Express→SQL; confirmação de exclusão existe. Validação de aluno incompleta; sem vínculo de credencial. Professor tem campos obrigatórios específicos indefinidos. | P02/P06/P11/P12/P15; D10. |
| §4.1.7 projeto | Nome/descrição/objetivo/membros existentes; status ausente e datas sem contrato. Exige mínimo de equipe não expresso na ERS. | P10/P18 e D05/D09. |
| §4.1.8 subprojeto | Nenhum modelo/rota/tela; campos título, objetivo, descrição e temas explícitos. | P20–P26; sem presumir Conteúdo separado. |
| §4.1.9 e diagrama p.8 | Não existe módulo quiz. Texto exige Projeto + Subprojeto e pontuação da pergunta; diagrama só id_projeto e pontuação da alternativa. | P27–P32 só núcleo confirmado; D03/D04/D08 antes de vínculos/publicação/cálculo. |
| §5.1–5.7 aluno | Login acadêmico incompleto; Meus Projetos existe com filtro apenas no cliente; detalhe omite objetivo/descrição; envio possui arquivo/descrição, mas não texto independente nem atividade/subprojeto; quiz/desempenho ausentes. | P06/P07/P13/P19/P16/P37/P34–P38; D07/D08. |
| §6 professor | Vê documentos e autores pelo projeto selecionado, sem vínculo validado no backend; não consulta respostas/resultados. | P07/P09/P19/P39; D03/D06/D08. |
| §7 visitante | Não existe área pública; pessoas públicas são enumeração de identidades e não material educacional de visitante. | P33/P34; D02 para conteúdo público. |
| §13.2–13.5 menus | Só Cadastros→Professor/Aluno/Projeto, Meus Projetos e Sair. Início é estado inicial, sem ação própria de retorno. Faltam subprojetos, quizzes, desempenho e área pública; menus de conteúdo/edital não devem ser criados automaticamente. | P13/P19/P23–P26/P28/P30/P32/P33/P34/P38/P39; D01/D02. |
| §14 validações | Nome, usuário/senha, presença de arquivo/descrição, extensão e duplicação de membros possuem verificações pontuais; não há contrato completo no servidor. Sem respostas de quiz. | P01/P10/P11/P12/P16/P27/P35. |
| §15 entidades | Existem usuarios, professor, aluno, projeto, projeto_professor, projeto_aluno e documentos por script. Curso/turma são texto; administrador é perfil, não tabela própria — isso não é por si só defeito. Demais entidades não existem; a ERS deixa modelagem para etapa posterior. | P04/P06/P09/P20/P27/P35; conteúdo/edital conforme D01/D02. |
| §16 Trello | Ferramenta opcional de gerenciamento; não é funcionalidade obrigatória nem integração solicitada. | Sem tarefa de integração. |
| §18 ampliações futuras | Notificações, relatórios, gamificação, fóruns, calendário, certificados e integrações estão citados como possibilidades futuras. | Fora do backlog confirmado; nenhum prompt criado. |

## Critérios gerais de aceitação (§17)

| Nº | Critério | Resultado da auditoria |
|---|---|---|
| 1 | Acesso por perfil | Com erros: seleção de identidade sem senha e vínculo de credencial ausente. |
| 2 | Administrador gerenciar alunos/professores | Caminho de CRUD existe; autorização/validação e integridade precisam de correção. Persistência real não executada. |
| 3 | Criar projetos/subprojetos | Projeto existe com lacunas; subprojeto ausente. |
| 4 | Visualizar conteúdo autorizado | Pendente D02; upload de documento não foi contado como conteúdo educacional. |
| 5 | Publicar editais | Removido conforme nota explícita, mas aceite ainda precisa ser atualizado (D01). |
| 6 | Participação em projetos | Vínculo administrativo existe; acesso restrito falha; autoinscrição não presumida (D09). |
| 7 | Responder quizzes | Ausente; depende dos contratos D03/D04/D08. |
| 8 | Registrar resultados | Ausente; RF40 precisa de definição antes da conclusão de RF49. |
| 9 | Professor consultar desempenho | Ausente; consulta mínima planejada, evolução indefinida. |
| 10 | Visitante acessar conteúdos públicos | Área pública ausente; conteúdo específico pendente D02. |
| 11 | Respeitar permissões | Não atende: falhas reproduzidas nos ensaios isolados. |
| 12 | Funcionar adequadamente em móveis | Parcial por código responsivo; bloqueio de localhost e testes reais pendentes. |

## Nota sobre esforço e validação

Cada linha tem um único status, inclusive quando há mais de um problema. O status principal não apaga a observação de que não houve validação com banco/navegador real. Um requisito ausente pode ter núcleo confirmado e depender de uma decisão para sua conclusão; isso é explicitado nos prompts sem implementar a parte ambígua. A ausência de suíte de testes não foi usada para classificar CRUD como ausente.
