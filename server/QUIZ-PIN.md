# PIN do Quiz

Novos quizzes do professor recebem automaticamente um PIN numérico de8 dígitos, preservando zeros à esquerda. Após salvar, o detalhe mostra **PIN do Quiz**, copiar código, link para participação, renovar e encerrar. Quizzes anteriores não são abertos automaticamente: o autor pode clicar em **Gerar PIN**.

O PIN é um convite para responder esse quiz. Alunos e visitantes com o código podem participar sem vínculo ao projeto; isso não os cadastra no projeto nem concede acesso a documentos, mensagens ou outros quizzes. O rascunho continua descrevendo a publicação no catálogo: **um PIN ativo permite responder sem esperar publicação no catálogo**. A listagem pública continua restrita às introduções explicitamente publicadas; não divulga PINs ou gabaritos.

## Uso

- Professor: **Meus quizzes → Criar quiz → salvar → PIN do Quiz**. Pode compartilhar código/link e renovar/encerrar convites dos próprios quizzes enquanto mantém o vínculo autorizado. O administrador mantém edição, exclusão e publicação no catálogo e também possui a API de gestão do PIN.
- Aluno: **Quizzes disponíveis → PIN do Quiz**. Nota/respostas entram nas tabelas e no histórico da conta. A tentativa única por aluno/quiz é compartilhada com o fluxo normal: outro acesso/PIN não permite sobrescrever a conclusão.
- Visitante: **Área pública → PIN do Quiz**, sem criar conta. O link compartilhado já abre o quiz. Resultado é uma participação anônima, sem matrícula, conta provisória ou nome deduzido.

Todas as perguntas são obrigatórias e de escolha única. Correção usa `corrigirQuiz`: um ponto por acerto, zero por erro e percentual. A API de participação retorna somente título, descrição, perguntas, alternativas e resultado próprio; nunca `correta`, autoria ou dados de equipes. Não mostra gabarito após concluir. Reenvio idêntico devolve o mesmo resultado; respostas diferentes após a conclusão recebem409. Erro de rede preserva a seleção e consultar resultado recupera um commit cuja confirmação se perdeu.

## Segurança e ciclo do acesso

Código gerado por `crypto.randomInt`, com UNIQUE no banco e tentativas limitadas em caso de colisão. Somente autor autorizado/administrador consulta ou gerencia PINs. Trata-se de convite, não senha de login: compartilhar o código permite a terceiros conhecer as perguntas e responder como visitantes.

A entrada confere o modo solicitado e a identidade real. `aluno` exige sessão válida: expiração não vira participação anônima silenciosamente. A página pública faz requisições sem cookies para manter a participação de visitante independente de uma área autenticada no navegador.

O acesso é assinado por HMAC-SHA-256 com chave derivada de `SESSION_SECRET` para a finalidade exclusiva de PIN. Inclui quiz, versão do PIN, modo, identidade autenticada quando aplicável, nonce aleatório de192 bits e validade de2 horas. Verificação constante e assinatura canônica; informações do cliente não definem nota ou identidade. O acesso só é enviado no corpo JSON, nunca no link/URL. Aluno exige também sua sessão/versão atuais. O banco guarda somente SHA-256 desse acesso para identificar o resultado de visitante.

Renovar/encerrar invalida código anterior e acessos abertos. Arquivar o quiz, remover o vínculo atual do professor com o projeto ou reassociar sua conta também bloqueia o uso. Editar antes de haver respostas mantém o PIN e invalida acessos à estrutura anterior. Submissão revalida tudo e trava o quiz na mesma transação da correção, serializando com as edições existentes.

Limite operacional por IP:300 requisições/minuto e bloqueio de novas consultas após30 falhas de PIN observadas na janela. Mapa limitado a10000 IPs com expiração. O IP segue o proxy confiável da operação existente. O limitador é local ao processo; múltiplas instâncias exigiriam coordenação. Origem/CORS, HTTPS e erros sanitizados seguem o sistema existente; respostas usam `no-store`. Não se registram PIN, acesso ou respostas em logs.

O componente usa DOM/textContent para renderizar e sessionStorage da aba para retomar a mesma participação após atualizar a página. Chaves são separadas por modo e identidade acadêmica. Sair/trocar a conta limpa acesso de aluno, PIN do professor e conteúdo carregado; respostas tardias são descartadas. A página pública reutiliza a participação válida ao recarregar o mesmo link.

**Limite do anonimato:** outro navegador, limpeza de armazenamento ou nova participação podem gerar outra tentativa. Não se promete uma tentativa por pessoa real. Após expirar o acesso não há recuperação de visitante por nome/contato. Não há dados fictícios no produto.

## Banco e ativação

Migração nova **019 — quiz-pin**: `quiz_pin`, `quiz_resultado_visitante`, `quiz_resposta_visitante`, com UNIQUE, FKs RESTRICT e CHECKs. Versões001–018 permanecem intactas. Respostas de visitantes persistem e bloqueiam edição/exclusão/configuração estrutural, como os resultados acadêmicos. Convite sem respostas é relação interna removida explicitamente quando um quiz elegível é excluído; nenhum resultado é apagado em cascata.

Histórico de visitante fica separado do acadêmico e não é apresentado como resposta de integrante do projeto. Esta alteração entrega participação/nota; não acrescenta ranking ou identificação de visitantes.

Pare o servidor, faça backup e execute em `server`, com o `.env` existente:

```powershell
npm.cmd run db:migrate
npm.cmd run db:check
node --env-file=.env index.js
```

Atualize com Ctrl+F5. Não há dependências novas. A implementação não migrou o banco real, alterou credenciais ou criou dados reais.

## Rotas

| Método | Caminho | Entrada/permissão |
|---|---|---|
| GET | `/quizzes/:id/pin` | Autor com vínculo atual ou administrador |
| POST | `/quizzes/:id/pin` | `{acao: 'gerar' ou 'desativar'}`; mesma autorização |
| POST | `/quizzes/pin/entrar` | `{pin, modo: 'aluno' ou 'visitante'}`; identidade conferida no servidor |
| POST | `/quizzes/pin/atividade` | `{acesso}`; acesso assinado válido, sessão se aluno |
| POST | `/quizzes/pin/respostas` | `{acesso,respostas}`; correção/persistência transacionais |

Nenhuma rota pública lista PINs ou consulta resultados de outra participação. Guards das rotas antigas permanecem.

## Arquivos e testes

Novos: `server/quiz-pin.js`, `server/banco/versoes/019-quiz-pin.js`, `server/banco/pin-esquema.js`, `assets/quiz-pin.js`, `assets/quiz-pin.css`, `mainPage/modulos/quiz-pin.js`, `server/test/quiz-pin.test.js`, `server/test/quiz-pin-interface.test.js` e este guia.

Integrações: bootstrap, manifesto/contrato/verificador do banco, cadastro do professor, serviço de resultados/histórico de quizzes, menu/navegação/sessão do painel, página pública, executor/helpers/reset dos testes e versões dinâmicas. `resultados-quizzes.js` compartilha correção/persistência do aluno e projeção sem gabarito entre os fluxos.

Os testes usam HTTP, MySQL e Chrome descartáveis, sem `.env`. Cobrem migração/idempotência/legados; unicidade/zeros/colisões; geração e autorização; aluno fora do projeto; visitante; notas0/100%; gabarito protegido; reenvios concorrentes; acessos adulterados/não canônicos/expirados; modos/sessão; renovação/encerramento/arquivamento/revogação; edição e retenção; rollback; limites; interface; atualização da página; confirmação perdida; logout; texto literal; dimensões móveis. Testes locais/emulação não equivalem a produção ou celulares físicos.

### Verificação local em 29/10/2026

Passaram **265 testes distintos de regressão direcionada**, sem contar repetições: API de PIN, quizzes/resultados, esquema, disponibilidade, catálogo, histórico, executor e interfaces de professor, aluno, visitante e sessão. A suíte completa do repositório não foi executada nesta alteração.

O fechamento repetiu os **28 testes específicos do PIN** (19 de API/MySQL e 9 de interface/Chrome): 28 aprovados, zero falhas e zero ignorados. Também passaram a verificação de sintaxe dos 29 arquivos JavaScript alterados/criados e `git diff --check`; hashes confirmaram as 18 migrações históricas intactas.

Logs locais em `%TEMP%`: `labhist-pin-seguranca-final.log` (93), `labhist-pin-api-final.log` (75, incluindo os mesmos 19 testes de API do PIN), `labhist-pin-navegador-final.log` (116) e `labhist-pin-verificacao-final.log` (28 repetidos). Uma execução inicial do navegador apresentou timeout de `Page.navigate` em teste público antigo; a repetição final passou, sem ampliar o timeout.
