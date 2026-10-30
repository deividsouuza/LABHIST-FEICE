# Módulos do painel — P46

Entrada: menuCadastro.html carrega configuracao-publica.js, assets/api.js, os dez scripts de modulos/ na ordem declarada e por último cadastro.js. cadastro.js apenas instala listeners/preview/máscaras e inicia a sessão (12 linhas). Login e área pública conservam suas entradas próprias e reutilizam assets/api.js; não há cliente de API duplicado.

| Arquivo | Responsabilidade e estado proprietário | Colaboração em execução |
|---|---|---|
| modulos/api.js | API de mesma origem, apiFetch, validação de projeções/HTTP e erros | assets/api.js; expiração delega à limpeza da sessão |
| modulos/comum.js | Escape HTML, rótulo de curso e data UTC | Funções puras usadas pelas listas |
| modulos/pessoas.js | currentEditId, validação/máscara/credenciais, cadastro/edição/exclusão de pessoas | API, navegação e utilitários |
| modulos/navegacao.js | cadastrosOpen, dadosCarregados, formMap, listas/filtros, alternância de painéis, sidebar e limpeza de formulário | Domínios para invalidar requisições e resetar seleção; sessão para perfil |
| modulos/sessao.js | sessaoAtual, identidade/permissões, inicializarSessao, logout e limpeza geral | API, navegação e limpadores dos domínios |
| modulos/projetos.js | edição/participantes/projetos acadêmicos, IDs e sequências de detalhe | API/sessão/navegação, documentos, subprojetos |
| modulos/subprojetos.js | contexto/IDs/sequências e CRUD de subprojeto | API/sessão/navegação, retorno ao projeto |
| modulos/documentos.js | preview/remoção de seleção, upload, lista e link de download autenticado | API/sessão, contexto atual de projeto e utilitários |
| modulos/quizzes.js | CRUD administrativo, disponibilidade, catálogo/atividade/submissão do aluno e validadores compartilhados | API/sessão/navegação, limpeza de desempenho |
| modulos/desempenho.js | sequências e telas de histórico próprio/acompanhamento professor | API/sessão/navegação e projeção/elementos de quiz |
| modulos/mensagens.js; mensagens.css | conversas/contatos, histórico, envio/leitura, polling visível, rascunhos em memória e layout responsivo | API/sessão/navegação; cadastro.js registra os eventos |

São módulos clássicos por responsabilidade, não ES modules: o HTML e as listas geradas já chamam handlers globais. Mantiveram-se os mesmos nomes/IDs, sem framework, bundler ou novo namespace global. let/const ficam no escopo lexical do documento; cada estado foi movido para o domínio proprietário. Não foram adicionadas globals para a extração. Remover essa compatibilidade exige migrar também HTML, handlers gerados e os consumidores; está fora desta extração.

O carregamento é uma sequência única sem imports, carregamento dinâmico, dupla inclusão ou execução antecipada de domínio. As funções são declaradas nos scripts e somente usadas depois de todos eles carregados, na entrada. Chamadas de colaboração entre domínios (por exemplo navegação invalidando atividade e atividade abrindo painel) ocorrem durante eventos; não são imports circulares nem inicializadores mutuamente dependentes. API depende de origemApi já carregada por assets/api.js. Nunca alterar scripts para async ou reordenar a entrada sem validar os contratos.

110 funções existentes conferidas por Function.toString antes/depois em contextos VM sem bootstrap real; sintaxe individual/conjunta aprovada. Extração incremental: API/sessão/navegação50/50; pessoas75/75; projetos/subprojetos57/57; documentos/quizzes106/106. Ensaios incluem Chrome, HTTP e mocks de SQL conforme as suítes; quizzes acadêmicos também usam MySQL real descartável. Matriz P44 é repetida após a extração, inclusive handlers inline e teclado, seguida de npm test completo. Resultado final no controle08; não somar testes repetidos ao total integrado.
