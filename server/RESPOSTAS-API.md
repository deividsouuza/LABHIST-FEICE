# P15 — Recursos ausentes e erros da API

O contrato continua JSON: sucesso mantém `mensagem` e demais campos existentes; falha usa `{ erro: string }`. A validação de pessoas preserva também `campos`. Não foram alterados filtros de autorização, identidade, frontend, esquema ou migrações.

## Estados

| Estado | Uso |
|---|---|
| 200 | Operação concluída, inclusive edição com valores idênticos. |
| 400 | ID/corpo/formato inválido, campo incompatível ou erro conhecido de envio. Validações existentes permanecem em 400; não há alternância arbitrária com 422. |
| 401/403 | Autenticação/autorização existentes, preservadas. |
| 404 | Pessoa/projeto/documento ausente, projeto inexistente na consulta de documentos ou rota desconhecida. |
| 409 | Duplicidade SQL, referência que impede a operação, deadlock ou timeout de bloqueio. Verificar o estado antes de tentar novamente; não há retry automático. |
| 410 | Seleção de identidade sem senha continua desativada pelo P01. |
| 413/415 | Limite de corpo/envio ou codificação não suportada reconhecidos pelo middleware. Nenhum novo limite de upload foi configurado. |
| 429 | Limite de tentativas do login, preservado do P01. |
| 500 | Erro interno desconhecido/SQL/IO. Resposta e registro não contêm mensagem, stack, SQL ou parâmetros do erro. |

Os estados 503 já usados pela autenticação indisponível permanecem. O código de status arbitrário de um objeto de erro desconhecido não é aceito como justificativa para classificá-lo como falha do cliente. Erros conhecidos de parser e Multer são classificados pelo tipo/código, com mensagens públicas fixas. O filtro existente de extensão produz erro de validação conhecido, sem transformar falha operacional de disco em 400. Referências: [erros no Express](https://expressjs.com/en/guide/error-handling/), [tipos do body-parser](https://expressjs.com/en/resources/middleware/body-parser/#errors) e [Multer](https://github.com/expressjs/multer#error-handling).

## Existência e concorrência

Os IDs nas rotas de pessoa/projeto/documento são validados antes de SQL, depois das mesmas verificações de autenticação/autorização. O intervalo segue INT positivo do esquema/P10. Perfis de pessoa continuam limitados a aluno/professor.

Editar uma pessoa agora usa uma conexão transacional do P05: SELECT FOR UPDATE confirma e bloqueia a pessoa, seguido do UPDATE. Edição de projeto preserva o bloqueio que já existia no P10. Um UPDATE com zero linhas alteradas não significa ausência, pois o recurso foi encontrado sob bloqueio; salvar valores iguais continua 200. Ausência gera 404 antes de qualquer mutação.

Excluir pessoa/projeto confirma existência sob bloqueio antes de remover vínculos ou registros. A exclusão final confere affectedRows; zero gera 404 e rollback, sem anunciar sucesso. Valor inesperado gera falha interna. Exclusão de documento também usa conexão dedicada, bloqueia a linha, confere a exclusão e só solicita remoção do arquivo depois do commit. Se houver rollback ou commit sem confirmação, o arquivo não é removido por esse fluxo. A coordenação geral de arquivos, falhas de remoção e exclusão de projeto continua no P17; não foi implementada política nova de limpeza.

As mensagens e permissões de sucesso permanecem as anteriores. Conflito/inconsistência provoca rollback e liberação/descarte conforme P05. Falha no COMMIT ainda pode ter resultado incerto e não é reproduzida automaticamente. Nenhuma correção de registros reais foi executada.

## Registro e interface

Falhas internas tratadas registram evento sanitizado com a operação pública e classificação INTERNO. Não são registrados objetos do driver, SQL, corpo, caminhos, mensagens/stack originais ou segredos. O middleware geral passa a responder 500 para erro inesperado, preservando JSON também em JSON inválido, tamanho/codificação inválidos e rotas desconhecidas. Quando cabeçalhos já foram enviados, registra evento genérico e encaminha ao Express um erro novo sanitizado para encerrar a conexão, sem tentar enviar outro JSON nem expor o erro original.

A interface atual já verifica `res.ok` nos formulários e exclusões exercitados. Os testes em Chrome verificam 400, 403, 404, 409 e 500: edição mantém campos/equipe e informa erro; exclusão não atualiza a lista como se tivesse sido concluída. As exclusões mantêm sua mensagem genérica existente. 401 continua redirecionando para login. Não houve mudança de HTML/JS nem antecipação da revisão geral de respostas/identidade de P13/P14; outros fluxos futuros continuam dependendo dessas tarefas.

## Testes

A partir da raiz:

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/respostas-api.test.js server/test/respostas-api-navegador.test.js
```

A suíte HTTP usa Express/sessões reais e doubles de SQL/arquivos para ausências, affectedRows zero, conflitos, falha SQL/commit, registro sanitizado, parser, Multer e rotas desconhecidas. A persistência usa MySQL 8.0.46 descartável real, esquema 003 e pool real: edição idêntica/real, ausência, exclusão/repetição, conflito por FK e rollback após trigger de falha. Mesmo nesses testes, as operações físicas de upload/remoção são simuladas.

Os testes de interface usam HTML/JS originais e Chrome real com respostas HTTP controladas por DevTools; não constituem integração do navegador com MySQL. São 31 casos de interface, sem perfil, clipboard ou dados pessoais. O helper SQL inicia somente sua instância própria, `--no-defaults`, porta/diretório temporários com prefixo `labhist-p15-`, e encerra pools/processo antes da limpeza validada. Ausência de MySQL/Chrome produz suíte explicitamente ignorada, não evidência de aprovação.

Para a suíte completa com várias instâncias MySQL/Chrome, use também `--test-concurrency=2` para limitar a carga simultânea de arquivos. Isso não altera as requisições concorrentes verificadas dentro dos testes transacionais. Uma execução sem esse limite excedeu o timeout de navegação do DevTools durante a inicialização; os casos da interface haviam passado isoladamente.

O MySQL temporário usa `--no-monitor --console` para manter a instância no processo filho controlado pelo helper, sem o processo supervisor do Windows, e aguarda prontidão por até 60 segundos. Referência: [opção no-monitor do MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/server-options.html#option_mysqld_no-monitor). Antes desse ajuste, uma execução deixou o diretório temporário bloqueado por um processo auxiliar; o processo exclusivo foi encerrado após confirmar PID, porta e diretório de teste. O diretório `labhist-p10-Jk2vqy` ficou preservado em TEMP porque a revisão automática bloqueou o comando combinado de encerramento/limpeza, sem detalhar o motivo. Isso não envolve o banco do projeto.

Nenhum banco real foi consultado. Nenhum teste manual indispensável identificado para esses critérios; implantação e homologação permanecem separadas. `npm test` continua placeholder até o P43; use os comandos específicos documentados.
