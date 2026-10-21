# Homologação local aprovada — P44

19/10/2026. Aprovação explícita do usuário em07 (D12). Ensaio descartável HTTP/MySQL8.0.46, Node24.19, Windows; sem configurações/dados reais. Limites:100 projetos,100 alunos,20 quizzes em rascunho,uploadPDF1MiB. Volume não é limite comercial da aplicação.

| Navegador instalado (headless) | Desktop | Toque emulado | Resultado |
|---|---|---|---|
| Chrome/155.0.8059.80 |1280×900;1920×1080|360×800;390×844;768×1024|5/5 combinações funcionais|
| Edg/155.0.4283.62 |1280×900;1920×1080|360×800;390×844;768×1024|5/5 combinações funcionais|

Toque nativo DevTools para hamburger/overlay, Escape para fechar. Campos recebem foco e texto por Input.insertText; viewport reduzido simula área útil com teclado e orientação é invertida nas três resoluções móveis. Essa simulação não mede teclado/IME nem viewport visual de Android/iOS físicos. Rede de produção não ensaiada. Fontes externas substituídas por CSS vazio no teste para isolar dependência externa; tamanhos/fallback efetivamente renderizados são verificados.

Tarefas: login por perfil/usuário/senha/Enter (4 entradas); listar alunos; abrir edição do professor/preencher/salvar; listar projetos/abrir edição/alterar descrição/salvar; login aluno/abrir projeto/preencher descrição/escolher PDF/enviar. Os handlers de operações são chamados pela automação, com HTTP e persistência reais; toque/teclado são eventos nativos. Verifica retorno salvo/limpeza,100 itens, texto literal, geometria de todos controles do painel, rotação e retomada após erro de rede. Suítes de regressão complementam criação/exclusão e sessão. Não é teste humano de usabilidade.

## Medições antes da extração P46

Ensaio labhist-p44-final.log; dados completos em10-HOMOLOGACAO-LOCAL.json. API:20 amostras sequenciais por rota, leitura integral do JSON, autenticação já feita. Ações: handler completo e dois frames de renderização, sem tempo humano de digitação;40 medições por navegador incluindo5 uploads. Sem extrapolação para produção ou concorrência.

| Medição | Resultado(ms) | Meta local |
|---|---:|---:|
|P95 /projetos|23.56|≤1000|
|P95 /usuarios?perfil=aluno|16.33|≤1000|
|P95 /quizzes|16.39|≤1000|
|Máxima ação Chrome|149.86|≤2000|
|Máximo upload Chrome|68.32|≤5000|
|Máxima ação Edge|450.15|≤2000|
|Máximo upload Edge|70.72|≤5000|

Defeitos reproduzidos: títulos longos alargavam flex/página; exclusão opacity0 permanecia invisível no foco; campos projeto/upload tinham labels sem for. Correções restritas à quebra/min-width, rodapé/topbar, visibilidade com foco/toque, rótulos e botões nativos no menu com IDs/handlers preservados. Sem redesenho.

Não declara homologação de dispositivos físicos, rede de produção ou todos os RNFs. Critério de P44 é exclusivamente a matriz e as metas locais aprovadas. Repetição após P46 será registrada no controle08.

## Repetição após P46

labhist-p46-matriz.log:13/13,3suítes,saída0,56366.0542ms,zero falhas/cancelamentos/ignorados/todo. Inclui conferência de todos os handlers inline e Enter em item do menu, nas duas instalações.10combinações aprovadas após os dez módulos clássicos;110 funções preservadas. Dados completos em10-HOMOLOGACAO-LOCAL-POS-P46.json.

| Medição após extração | Resultado(ms) | Meta local |
|---|---:|---:|
|P95/projetos|20.72|≤1000|
|P95/usuarios?perfil=aluno|16.10|≤1000|
|P95/quizzes|16.56|≤1000|
|Máxima ação Chrome|170.30|≤2000|
|Máxima ação Edge|196.08|≤2000|
|Máximo upload Chrome|220.48|≤5000|
|Máximo upload Edge|78.80|≤5000|

Variações de ensaios sequenciais locais não demonstram melhora/piora estatística; ambos dentro da meta. Regressão integral posterior registrada em08, sem substituir estes dados ou multiplicar amostras.
