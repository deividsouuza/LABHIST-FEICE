# P05 — Pool e transações isoladas

A aplicação usa `mysql2/promise.createPool`. Leituras e operações de uma única instrução usam `pool.query`, que administra a aquisição/devolução. Cada criação, edição ou exclusão de projeto e exclusão de aluno/professor usa `executarTransacao`: uma aquisição por operação, BEGIN, consultas da operação na conexão recebida, COMMIT ou ROLLBACK e liberação em finally. As funções de sincronização recebem essa conexão explicitamente; não consultam o pool dentro da transação. Referência: [pool e liberação de conexões no mysql2](https://sidorares.github.io/node-mysql2/docs#using-connection-pools).

O pool tem limite operacional local de 10 conexões, espera por conexão disponível e fila máxima de 100 aquisições. Esses valores controlam recursos do processo e não representam novos requisitos da ERS. Uma aplicação com múltiplos processos terá um pool por processo. A partida adquire uma conexão para verificar o esquema do P04, devolve-a em finally e só então disponibiliza o pool ao servidor; em falha, encerra o pool. Migrações de esquema e senhas continuam usando suas conexões dedicadas e explícitas, sem compartilhar transações com requisições.

Na criação de um projeto, os vínculos são inseridos sem DELETE anterior, porque o projeto ainda não tem participantes. O teste simultâneo revelou ER_LOCK_DEADLOCK quando duas transações apagavam faixas vazias antes de inserir vínculos. A remoção desse DELETE redundante evita esse conflito de criação sem mudar os membros, as regras de equipe ou a substituição dos vínculos na edição.

## Falhas e perda de conexão

- Falha antes da aquisição: a operação não começa e não existe conexão a devolver. O endpoint retorna seu erro JSON existente, sem repetição automática.
- Falha de SQL/operação com conexão utilizável: tenta rollback e devolve a conexão saudável ao pool, preservando o erro original.
- Falha no BEGIN, perda de conexão, rollback malsucedido ou COMMIT sem confirmação: a conexão é destruída/removida do pool no finally. Não pode ser reutilizada com uma transação possivelmente aberta. O pool pode criar outra conexão para uma requisição futura; isso não repete nem continua a transação interrompida.
- Falha no COMMIT pode ter resultado incerto: o servidor não presume que a escrita falhou nem tenta reproduzi-la. Antes de repetir uma operação, deve-se verificar o estado persistido. Não foram introduzidos retries de transação ou idempotência de negócio.
- Deadlock ou timeout de bloqueio de dados pode ocorrer entre operações que disputam os mesmos recursos. O erro encerra a operação com rollback, sem afetar a outra transação nem trocar de conexão para continuar. As mensagens HTTP das quatro rotas permanecem as existentes; seus logs de falha são genéricos e não imprimem SQL/parâmetros.

Não foram alterados esquema, credenciais, autorização, regras de membros, autoria, arquivos ou contratos HTTP. Diagnóstico e reparo de legados continuam no fluxo de migrações e nas tarefas correspondentes. D10/D11 permanecem pendentes para o vínculo de credenciais do P06.

## Validação

Da raiz do projeto:

```powershell
node --experimental-vm-modules --test --test-reporter=spec server/test/transacoes.test.js
```

Há testes de falhas do ciclo transacional com doubles para aquisição, BEGIN, operação, COMMIT, ROLLBACK e perda de conexão. As garantias de isolamento/persistência são verificadas separadamente em MySQL 8.0.46 descartável real, com esquema P04 instalado, pool real, HTTP Express e sessões reais. A barreira de concorrência mantém uma operação aberta enquanto a outra confirma ou reverte; IDs de conexão distintos e visibilidade dos registros são verificados diretamente pelo banco observador. Outro teste inicia duas criações abertas simultaneamente e exige sucesso de ambas.

Triggers de teste provocam falhas intermediárias de gravação/remoção. Uma conexão da própria instância temporária é encerrada por KILL CONNECTION para comprovar descarte e ausência de repetição. Depois de cada caso real, os testes adquirem simultaneamente as dez conexões do pool e as devolvem, verificando que nenhuma ficou reservada. Há regressões de CRUD de projeto e de aluno/professor, conta de leitura na partida, pool encerrado e versão de esquema inválida.

A instância temporária usa `--no-defaults`, porta própria e diretório com prefixo `labhist-p05-`, validado antes da exclusão. O processo filho e os pools são encerrados. Nenhuma credencial, consulta ou alteração do banco real do projeto é usada. Ausência do executável MySQL gera teste ignorado explícito e não constitui aprovação de persistência. Nenhum teste manual indispensável foi identificado para esses critérios; implantação/homologação e demais tarefas não foram antecipadas.
