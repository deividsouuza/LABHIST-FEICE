# Criação de projetos e subprojetos pelo professor

O professor pode abrir **Meus Projetos → Cadastrar projeto**, preencher os textos, escolher um dos estados existentes e selecionar alunos já cadastrados. O professor autenticado é o responsável e participante automático. O cadastro mantém a exigência existente de pelo menos um aluno. Após salvar, a interface abre os subprojetos do novo projeto.

Em qualquer projeto em que esteja atualmente vinculado, o professor pode abrir **Subprojetos → Novo subprojeto**, informar os textos e selecionar alunos do projeto principal para o núcleo. O vínculo do professor é conferido no servidor e bloqueado para leitura dentro da transação de criação. Remover o vínculo revoga novas criações. Não se concede acesso a outros projetos pelo ID, pelo responsável histórico ou por campos enviados pelo cliente.

Edição e exclusão de projetos/subprojetos permanecem administrativas. Professores não recebem os cadastros administrativos de pessoas, quizzes ou contas. Alunos e visitantes não recebem criação de projetos ou subprojetos. A extensão não muda as regras de consulta pública ou de publicação/acesso dos quizzes.

## Contratos

- `GET /projetos/opcoes-criacao`: administrador ou professor com identidade válida; retorna `{professores, alunos}` com somente `id` e `nome`, sem contatos, matrículas ou credenciais. Para professor, `professores` contém apenas sua pessoa acadêmica. A seleção de alunos usa os alunos cadastrados no sistema. Resposta `no-store`; `/usuarios` continua administrativo.
- `POST /projetos`: aceita o professor autenticado. Quando `professor_ids` e `professor_id` são omitidos, o servidor usa `pessoa_id` da identidade atual. Se forem enviados, devem identificar exclusivamente esse professor; tentar atribuir outro professor recebe 403. A inclusão de outros professores continua com o administrador. A criação de projeto e vínculos permanece transacional.
- `POST /projetos/:id/subprojetos`: aceita professor vinculado ao projeto e administrador. O vínculo é validado novamente na transação. Os alunos selecionados continuam obrigatoriamente vinculados ao projeto pai; erro reverte o subprojeto inteiro.

Não há alteração de esquema nem nova migração. Para usar, reinicie o servidor e atualize a página para carregar os módulos JavaScript. Nenhum `.env`, senha, configuração de MySQL ou dado real foi alterado nesta implementação. O envio para GitHub ou publicação na internet não faz parte desta mudança.

## Validação

`test/criacao-professor-interface.test.js` usa instância MySQL descartável, HTTP real e Chrome, sem carregar o `.env`. Cobre criação e vínculo automático, IDs distintos de conta e pessoa, minimização do catálogo, falsificação de professor/perfil, validações existentes, rollback, projetos sem vínculo, revogação, equipes de subprojetos, limites de edição/exclusão, criação pela interface, erro com preservação de dados e resposta atrasada após encerrar sessão.

O teste integra o grupo `npm run test:navegador`. As regressões afetadas incluem autorização, integridade/transações de projetos, subprojetos, formulários e sessões.
