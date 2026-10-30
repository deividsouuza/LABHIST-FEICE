# Subprojetos e alunos envolvidos

Migração explícita **007**, após 006. Não executada no banco real pelo agente. A partida verifica esquema e FK sem aplicar DDL; o responsável deve usar o fluxo de cópia, migração e verificação de BANCO-DE-DADOS.md.

Cada subprojeto pertence a um projeto existente. A FK é RESTRICT: projeto com subprojetos não pode ser excluído; a transação preserva seus documentos e a fila de limpeza. Não há associação nova com conteúdo, quiz ou envio de aluno.

| Método e caminho | Permissão | Resposta |
|---|---|---|
| POST /projetos/:id/subprojetos | Administrador ou professor atualmente vinculado ao projeto | 201, mensagem e id |
| GET /projetos/:id/subprojetos | Administrador ou acadêmico vinculado ao projeto | 200, lista ordenada por id |
| GET /subprojetos/:id | Mesma regra do projeto pai | 200, detalhe para consulta/edição |
| PUT /subprojetos/:id | Administrador | 200, mensagem; inclusive valores iguais |
| DELETE /subprojetos/:id | Administrador | 200, mensagem; somente o alvo |

A criação pelo professor foi acrescentada sem nova migração. Fluxo, vínculo automático ao criar o projeto e limites de permissão em [Criação pelo professor](CRIACAO-PROFESSOR.md).

POST/PUT recebem um objeto JSON com titulo, objetivo, descricao e temas_abordados. Título é obrigatório, texto após trim de 1–255 caracteres, sem controles/quebras de linha. Os demais campos são textos opcionais: omitidos viram texto vazio, null/objetos/arrays são recusados; cada campo admite até 65535 bytes UTF-8 (coluna TEXT). Linhas e tabulações são permitidas nesses textos. PUT substitui os quatro campos; preencher a partir do GET para preservar opcionais. Não se impõe unicidade de título não prevista na ERS.

O detalhe contém id, projeto_id, os quatro textos e alunos (id/nome), conforme extensão016 abaixo. Listas/detalhes usam no-store. ID e projeto pai são preservados no PUT; projeto_id opcional no corpo precisa corresponder ao pai atual (ou à URL no POST). Não existe transferência de pai.

401 indica ausência de sessão; 403 perfil/vínculo sem permissão; 400 ID/campos inválidos; 404 registro ausente; 409 dependência protegida/conflito. Falhas inesperadas retornam 500 sem SQL, dados do driver ou caminhos. Escritas usam conexão dedicada e transação, sem repetição automática.

Na exclusão, o registro é travado antes de consultar FKs existentes no catálogo do MySQL. Havendo dependente externo protegido, a operação retorna409 e preserva os dados, mesmo se a FK declarar CASCADE ou SET NULL. Os vínculos próprios de alunos introduzidos em016 têm remoção explícita descrita abaixo. Referência de outro esquema ou coluna não suportada também impede a operação. A política conservadora permanece até existir decisão explícita para os dependentes; não autoriza descarte futuro de conteúdo/quiz/arquivo. Exclusão repetida retorna 404. Não há ação de filesystem nessa API.

P18/P19/P23/P24 acrescentaram status, detalhe acadêmico, navegação e formulário de criação; P25/P26 completaram edição visual e exclusão confirmada administrativa. Contratos visuais em PROJETOS-INTERFACE.md. A proteção de dependentes e preservação de ID/pai continuam no servidor; não se criaram relações de conteúdo/quiz/envio.

## Verificação reproduzível

Na raiz do projeto:

```powershell
node --experimental-vm-modules --test --test-reporter=spec server/test/subprojetos.test.js
```

50 testes HTTP com MySQL e filesystem descartáveis reais: cadastro, limites, leitura por vínculo, upgrade 006→007, drift da FK, edição/campos/mesmo valor, tentativa de transferência, exclusão, dependentes RESTRICT/CASCADE/SET NULL, SQL com falha e preservação de pai/irmãos/documento/arquivo. Não usa banco, uploads ou .env reais, nem navegador. Fixtures de dependentes existem somente nos testes.

## Alunos envolvidos por núcleo —20/10/2026

Solicitação adicional do usuário após os46 prompts: registrar alunos de cada subprojeto/núcleo dentro do projeto principal. Cadastro/edição administrativos oferecem checkboxes apenas com alunos vinculados ao projeto. Um aluno pode participar de vários núcleos e um núcleo pode começar sem equipe. O detalhe mostra a equipe para administrador/professor autorizado; aluno vê apenas a própria participação, preservando a minimização de dados já adotada. Sem exposição de contatos/matrícula.

POST/PUT aceitam aluno_ids como array de inteiros positivos sem repetição. No POST, omissão cria equipe vazia; no PUT, omissão preserva os vínculos atuais e [] remove todos os vínculos desse núcleo. Aluno inexistente ou fora do projeto retorna400; campos/textos e equipe são gravados juntos em transação, revertendo integralmente em falha. A lista de subprojetos conserva o contrato anterior; GET/subprojetos/:id acrescenta alunos:[{id,nome}]. Não há atribuição por nome/dedução.

Migração016-alunos-subprojetos acrescenta subprojeto_aluno com PK(subprojeto_id,aluno_id) e FKs compostas para subprojeto(id,projeto_id) e projeto_aluno(projeto_id,aluno_id), ambas RESTRICT. As versões001–015 permanecem intactas. Atualização15→16 preserva cadastros/projetos/subprojetos e deixa a tabela nova vazia. Partida verifica tabela, unicidade e FKs; DDL permanece explícito.

Remover um aluno do núcleo mantém seu cadastro e seus demais vínculos. Excluir o núcleo remove seus próprios vínculos somente após conferir outros dependentes (quiz/externos continuam protegidos). Retirar do projeto principal um aluno ainda presente em um núcleo é recusado409; primeiro remova a participação nos núcleos. Edição do projeto preserva as linhas de alunos que continuam na equipe, permitindo manter os vínculos dos núcleos. Não há mudança das permissões de acesso/publicação de quizzes baseadas no projeto.

Interface: mainPage/modulos/subprojetos.js, campo subAlunosLista em menuCadastro.html e limpeza de nomes na sessão. Textos renderizados literalmente, checkboxes nativos com rótulos e lista rolável. Erro de envio preserva seleções/textos; requisições atrasadas são descartadas pelo controle de navegação existente.

Ativação no ambiente existente: faça uma cópia do banco, encerre o servidor com Ctrl+C, execute npm.cmd run db:migrate e npm.cmd run db:check dentro de server; depois node --env-file=.env index.js. O único passo novo esperado em banco015 é016. Nesta implementação a migração será validada em instâncias descartáveis; banco real não foi alterado pelo agente.

Validação em andamento: node --experimental-vm-modules --test --test-concurrency=2 server/test/integridade-projetos.test.js server/test/nucleos-interface.test.js server/test/esquema.test.js server/test/resultados-quizzes.test.js. Primeiro ensaio também incluiu subprojetos/projetos-interface; evidências finais serão acrescentadas após confirmação.

### Validação concluída —20/10/2026

- Núcleos/Chrome/HTTP/MySQL e sessão:41/41,3suítes,saída0,46894.1276ms (labhist-nucleos-interface-sessao-final.log). São20 casos da funcionalidade e21 de autenticação/sessão; inclui seleção/edição persistidas, nomes como texto literal, duas orientações móveis, rollback, permissões, dados mínimos e limpeza na troca de conta.
- Migrações legadas P10:12/12,1suíte,saída0,62339.2503ms (labhist-nucleos-legados-final.log). Filtro de nome selecionou a suíte afetada; as demais já haviam sido aprovadas. Sem falhas/cancelamentos/ignorados/todo nessas duas confirmações finais.
- Outros grupos aprovados em rodadas anteriores:50subprojetos,57interface de projetos,14esquema,130validação/integridadeP10 e20resultados de quizzes. Total324casos distintos cobertos por grupos, não uma nova execução integral de npm test. Não somar repetições dos mesmos casos.
- Primeiro ensaio269casos,257aprovados/12falhas; segundo196,185aprovados/11falhas. Falhas eram a preparação de schemas antigos (nova tabela filha ausente da ordem de DROP) e uma expressão de seletor na fixture de navegador. Preparação corrigida sem desligar FKs e seletor corrigido; todos os casos afetados confirmados acima. Logs iniciais labhist-alunos-nucleos.log e labhist-alunos-nucleos-confirmacao.log preservados no TEMP.
- Sintaxe dos arquivos modificados aprovada. Verificação de processos após testes sem MySQL/Chrome/Edge de fixture remanescentes. Nenhum acesso/migração ao banco real nesta extensão.

Arquivos de produto: server/subprojetos.js,projetos.js,banco/esquema.js,migracoes.js,migrador.js e nova versão016; mainPage/menuCadastro.html,menu.css,modulos/subprojetos.js,sessao.js. Testes/runner: nucleos-interface,subprojetos,projetos-interface,integridade-projetos,esquema,resultados-quizzes,helpers/fixture-projetos e scripts/testes.js. As versões publicadas001–015 não foram alteradas.
