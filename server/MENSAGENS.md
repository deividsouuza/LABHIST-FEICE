# Mensagens privadas do LABHIST

Professores e alunos têm **Mensagens** no menu. Em **Nova conversa**, podem pesquisar pelo nome e escolher um participante autorizado. O histórico é armazenado no MySQL e permanece após sair, entrar novamente ou reiniciar a aplicação. Não existem mensagens de demonstração ou dados pré-carregados no produto.

## Vínculo e privacidade

Uma conversa reúne exatamente uma conta de professor e uma conta de aluno, com suas pessoas acadêmicas explícitas em `conta_pessoa`. Os dois precisam participar atualmente de pelo menos um mesmo projeto, por `projeto_professor` e `projeto_aluno`. Não se usa `projeto.professor_id` legado como autorização. O campo textual `aluno.turma` não define professores de uma turma; não se infere autorização a partir desse campo. Uma associação formal de professores a turmas exigiria outro domínio e sua própria política.

O backend verifica sessão, perfil, conta/pessoa atual e vínculo em cada acesso. Para criação, envio e leitura, confirma novamente a identidade e protege os vínculos com locks dentro da mesma transação. Terceiros recebem 404 para o ID de conversa; administradores, visitantes e anônimos não têm acesso ao chat. Alterar o perfil ou IDs no corpo/URL não concede permissão.

Remover o último projeto em comum revoga lista, contador, leitura e envio. O registro é preservado, mas fica inacessível pela API até que o vínculo seja restabelecido. Uma reassociação de conta não transfere o histórico para outra pessoa. A aplicação não oferece edição/exclusão de mensagens nem de conversas. FKs RESTRICT impedem apagar contas/pessoas participantes ou descartar mensagens em cascata, preservando o histórico. O administrador continua responsável pelos vínculos; esse perfil não recebe uma interface para ler o conteúdo privado.

Os contatos mostram somente nome, perfil e IDs necessários, sem telefone, matrícula, e-mail ou senha. Todas as respostas de mensagens têm `Cache-Control: no-store`. SQL usa parâmetros para dados externos. A interface constrói os balões com `textContent`, sem interpretar HTML. Não se grava conteúdo privado em localStorage, logs ou na configuração pública. Como os demais dados do sistema, as mensagens ficam acessíveis ao operador do banco: não se trata de criptografia ponta a ponta. Produção usa o HTTPS já previsto na operação do sistema.

## Envio, leitura e atualização

- Conteúdo textual de 1 a 4000 caracteres Unicode, após remover espaços externos; controles inválidos e surrogates isolados são recusados. Quebras de linha e emojis são permitidos. Não há anexos no chat.
- Cada tentativa tem UUID v4 do cliente. Se a resposta se perder após o commit, repetir o mesmo texto e UUID devolve a mensagem salva, sem duplicação. Reusar a chave com outro conteúdo/conversa recebe 409. O texto permanece no formulário quando não há confirmação.
- Limite operacional de 30 tentativas de criação de conversa/envio por conta a cada minuto. Excesso recebe 429 e Retry-After. O mapa em memória é limitado e expira; reiniciar limpa a janela. Este limite, como o do login existente, pressupõe uma instância. Múltiplas réplicas exigiriam um limitador compartilhado.
- A leitura é um POST explícito e afeta somente mensagens destinadas ao usuário até o ID exibido. GET não marca leitura. A interface registra leitura quando a conversa está aberta, a aba visível e o histórico próximo do fim. Ao rolar para cima, novas mensagens aguardam o retorno ao fim do histórico.
- Balões enviados ficam à direita e mostram **Enviada/Lida**. Recebidos ficam à esquerda; mensagens ainda não lidas são destacadas. Horários são gravados em UTC, retornados com `Z` e exibidos no fuso do navegador.
- Conversas ordenam pela última mensagem; contatos/conversas têm busca e páginas de até 50 itens. O histórico começa pelas 50 mais recentes; **Carregar mensagens anteriores** permite percorrê-lo integralmente sem um download ilimitado.
- A conversa aberta consulta novidades a cada 5 segundos, por cursor; não recarrega a página nem todo o histórico. O contador geral atualiza a cada 30 segundos e após leitura. Consultas periódicas não se sobrepõem dentro do ciclo e param na aba oculta; voltar à aba atualiza imediatamente. Sair do painel cancela pedidos de chat; sair da conta limpa DOM, rascunhos, contadores e timers. Requisições têm prazo de 15 segundos e respostas atrasadas são descartadas por geração/identidade.
- Índices atendem ao histórico, contagens, par de participantes e idempotência. Marcadores por conversa evitam recalcular a confirmação de leitura sobre o histórico completo em cada atualização. Não há WebSocket, dependência adicional ou serviço externo.

## Banco e ativação

A nova migração é **017 — mensagens-privadas**. Cria `mensagem_conversa` e `mensagem`, com índices, unicidade, FKs e CHECKs. Versões001–016 não foram alteradas. A inicialização verifica o novo contrato e recusa banco desatualizado; não executa DDL automaticamente.

Pare o servidor, faça backup protegido do banco e, na pasta `server`, com o `.env` local já configurado:

```powershell
npm.cmd run db:migrate
npm.cmd run db:check
node --env-file=.env index.js
```

Atualize o painel com Ctrl+F5. Não é necessário instalar dependências novas. Em ambiente que fornece variáveis diretamente, os comandos equivalentes são `node scripts/banco.js migrate`, `node scripts/banco.js check` e `node index.js`.

Esta implementação não migrou o banco real, não alterou `.env`/senhas, não criou contas reais e não publicou o sistema na internet. O backup normal do MySQL passa a incluir as mensagens. Não restaure apenas tabelas antigas sobre um esquema017: restauração e aplicação devem usar versões compatíveis.

## Rotas

Todas exigem professor/aluno autenticado e identidade atual.

| Método | Rota | Contrato |
|---|---|---|
| GET | `/mensagens/contatos` | `busca`, `pagina`, `limite`; contatos autorizados |
| GET | `/mensagens/resumo` | Total atual de mensagens recebidas e não lidas |
| GET | `/mensagens/conversas` | `busca`, `pagina`, `limite`; pares, prévia e não lidas |
| POST | `/mensagens/conversas` | `{destinatario_id}` (conta); cria ou devolve o mesmo par |
| GET | `/mensagens/conversas/:id/mensagens` | `antes` ou `apos`, `limite` até100; histórico e confirmação de leitura |
| POST | `/mensagens/conversas/:id/mensagens` | `{conteudo, cliente_id}`; remetente/destinatário e horário definidos no servidor |
| POST | `/mensagens/conversas/:id/leitura` | `{ate_id}`; confirma somente recebidas até esse marcador |

## Arquivos desta implementação

Criados: `server/mensagens.js`, `server/banco/versoes/017-mensagens.js`, `server/banco/mensagens-esquema.js`, `mainPage/modulos/mensagens.js`, `mainPage/mensagens.css`, `server/test/mensagens.test.js`, `server/test/mensagens-interface.test.js` e este guia.

Integrados/modificados: `server/index.js`; `server/banco/esquema.js`, `migracoes.js` e `migrador.js`; `mainPage/menuCadastro.html`, `cadastro.js`, `modulos/navegacao.js` e `modulos/sessao.js`; `server/scripts/testes.js`; `server/test/helpers/aplicacao.js`, `test/esquema.test.js`, `test/integridade-projetos.test.js` e `test/nucleos-interface.test.js`; `README.md`, `mainPage/MODULOS.md`, `server/MODULOS.md` e `server/TESTES.md`. Os ajustes nos testes legados preservam a ordem das FKs e usam a versão atual do manifesto; não desabilitam restrições. Alterações anteriores de criação de projetos pelo professor foram preservadas.

A regressão também identificou o fieldset de alunos do núcleo usando a classe `quiz-pergunta`. A classe foi separada em `sub-alunos`, com o mesmo estilo em `mainPage/menu.css`, para evitar que consumidores de perguntas de quiz incluam esse outro formulário.

## Resultados e cobertura

Validação local desta entrega, em fases separadas: **1042/1042** testes de segurança/banco (27 arquivos,34 suítes) e **322/322** de navegador (14 arquivos,16 suítes), sem casos ignorados/cancelados nas fases finais. Total de **1364** casos distintos; os31 casos específicos de mensagens estão incluídos nesse total. A fase de navegador foi repetida após separar a classe do fieldset de núcleos; também cobriu a repetição do timeout pontual `Page.navigate` do Edge. Não apresentar a primeira execução de `npm test` como exit0: a evidência final é a fase de backend aprovada, a matriz/quizzes47/47 e a fase completa de navegador repetida com exit0.

Logs locais em TEMP: `labhist-mensagens-regressao.log` (fase segurança/banco aprovada e primeira passagem de navegador), `labhist-mensagens-correcoes-regressao.log` (matriz/quizzes47/47) e `labhist-mensagens-navegador-final.log` (322/322, exit0). Sintaxe dos29 arquivos JavaScript criados/alterados e `git diff --check` aprovados; SHA-256 das16 migrações anteriores conferido contra HEAD sem diferenças. Nenhum teste adicional foi contado em duplicidade.

`test/mensagens.test.js`: migração16→17, repetição e preservação dos checksums/dados; contatos mínimos; par único e criação concorrente; comunicação nos dois sentidos; UTC; leitura parcial; ordenação e contadores; idempotência; histórico paginado; validação/SQL Injection; perfis, terceiros e reassociação; revogação/restabelecimento; rollback; persistência em outra instância da aplicação; limites e verificação de índices.

`test/mensagens-interface.test.js`: Chrome com duas sessões em navegadores isolados; envio/resposta e atualização automática; badge e confirmação de leitura; texto literal contra XSS; paginação e novo login; resposta perdida após commit sem duplicação; erro com preservação do rascunho; aba oculta; revogação; logout e respostas atrasadas; desktop/tablet/celular; captura visual com dados exclusivamente de fixture. Não equivale à homologação em celulares físicos ou em produção.

Os testes criam banco e perfis temporários, sem carregar o `.env` da aplicação. Integram os grupos de banco/navegador do executor existente. Regressão completa: `npm.cmd --prefix server --logs-max=0 test`.
