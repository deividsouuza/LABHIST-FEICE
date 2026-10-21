# P10 — Participantes e integridade dos projetos

A criação e edição de projetos validam todas as entradas de IDs antes de consultar o banco. Dentro de uma única transação P05, a API confirma a existência de todos os professores/alunos e mantém bloqueios compartilhados até o commit. A edição também bloqueia e confirma o projeto antes de alterar seus vínculos. Participante inexistente recebe 400 e projeto inexistente recebe 404, sem gravações parciais.

## Contrato da API

- `professor_ids` e `aluno_ids` são listas de inteiros positivos. Cada entrada pode ser número inteiro ou string de dígitos decimais, com espaços externos removidos. O intervalo é 1 a 2147483647, compatível com INT do esquema. Booleanos, objetos, arrays como entrada, vazio, zero, negativos, decimais, notação exponencial/hexadecimal em texto e números fora do intervalo são rejeitados; não há filtragem silenciosa.
- Strings como `"041"` e número `41` representam o mesmo ID. Pares repetidos na lista são recusados com 400, conforme a rejeição de duplicatas já existente. A ordem da seleção válida é preservada.
- As duas listas continuam exigindo pelo menos um membro. Se `professor_ids` for omitido, o campo singular legado `professor_id` ainda é aceito como fallback. Quando ambos forem enviados, `professor_id` deve ser válido e igual ao primeiro professor da lista, mantendo a escolha de responsável já usada pela interface/API. Um valor inválido ou divergente não é ignorado.
- O corpo deve ser objeto JSON e conter nome não vazio. O ID do projeto na edição também deve ser um inteiro positivo válido. Formato inválido é recusado antes de adquirir conexão ou consultar SQL.
- Consultas de existência usam a mesma conexão da transação, em ordem estável, com FOR SHARE. A versão 003 protege a persistência mesmo contra corrida ou escrita SQL direta. Falhas intermediárias revertem projeto e participantes pelo executor do P05.

Não foram alterados os mínimos de equipe, o cadastro administrativo, a seleção da interface ou a política de exclusão de pessoas. A definição de participação/quantidades continua em D09; a identidade de credenciais continua em P06/D10/D11.

## Migração 003 e diagnóstico do legado

As versões 001 e 002 permanecem imutáveis. O backend agora espera a versão 003; o banco real ainda não recebeu esta migração. Após backup protegido e validação em cópia descartável, o operador pode usar os comandos do [guia de banco](BANCO-DE-DADOS.md). Na pasta `server`, com `.env` preenchido localmente:

```powershell
npm run db:diagnose
npm run db:migrate
npm run db:check
```

Sem arquivo `.env`, fornecendo as variáveis pelo ambiente:

```powershell
node scripts/banco.js diagnose
node scripts/banco.js migrate
node scripts/banco.js check
```

`diagnose` usa somente leitura e pressupõe as tabelas/colunas da base 002. Ele imprime contagens por relação órfã e grupos de pares duplicados, sem IDs, nomes, linhas, senhas ou SQL. `incidencias` soma essas contagens e pode contar mais de uma inconsistência na mesma linha. Retorno zero do comando significa que o diagnóstico executou, não que os dados estejam aprovados: confira as contagens. Em legado anterior/incompleto, o migrador aplica a base compatível antes de alcançar o diagnóstico da versão 003; nenhuma limpeza de dados ocorre.

Antes do primeiro ALTER da versão 003, o migrador diagnostica todas as relações e duplicatas e verifica FKs já existentes. Encontrando inconsistência, interrompe sem marcar a versão 003, sem apagar, deduplicar, vincular, preencher ou reatribuir qualquer registro. A correção deve ser proposta e autorizada com base nos dados da cópia; não há política automática de reparo. Nenhum comando deste procedimento foi executado contra o banco do projeto pelo agente.

As restrições adicionadas são:

| Tabela/campo | Referência/proteção |
|---|---|
| projeto_professor.projeto_id | projeto.id |
| projeto_professor.professor_id | professor.id |
| projeto_aluno.projeto_id | projeto.id |
| projeto_aluno.aluno_id | aluno.id |
| projeto.professor_id | professor.id, preservando NULL existente |
| pares de projeto_professor/projeto_aluno | UNIQUE dos dois IDs, preservado ou adicionado se ausente |

As FKs usam RESTRICT nas exclusões/alterações, sem nova cascata ou correção automática. As rotas existentes já removem vínculos e anulam a referência de responsável antes de excluir a pessoa; continuam funcionando em transação. Excluir por SQL um membro ainda referenciado falha. Não foi criada relação entre credencial e pessoa, nem vínculo composto circular entre responsável e equipe; no legado, a FK garante que o professor referenciado existe, sem reinterpretar sua participação.

FK equivalente sob outro nome é preservada; referência para outro destino/schema, FK composta ou ação divergente é recusada para revisão explícita. Índices UNIQUE equivalentes são preservados, inclusive com ordem inversa das duas colunas. O verificador de partida exige as FKs e os índices, além do histórico: remover uma FK manualmente não é encoberto pela versão registrada.

DDL tem commit implícito. Uma falha operacional após alguns ALTERs pode deixar restrições parciais com a versão 003 pendente. A retomada verifica as restrições já aplicadas e executa somente as faltantes; não há rollback ou remoção automática de DDL. Pare aplicação/gravadores durante a migração e preserve backup. Referência: [restrições FOREIGN KEY do MySQL](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).

## Testes

Na raiz do projeto:

```powershell
node --experimental-vm-modules --test --test-reporter=spec server/test/integridade-projetos.test.js
```

Os testes HTTP de formatos usam sessões/Express reais e banco simulado para provar ausência de SQL nas recusas. As suítes de persistência usam instâncias MySQL 8.0.46 descartáveis com esquema e pool reais: múltiplos membros, preservação da equipe na edição, existência/rollback, escrita SQL órfã/duplicada, exclusão consistente e detecção de FK removida. Outra instância testa atualização 002→003, órfãos nas cinco referências, duplicatas legadas, índice ausente, FK divergente/equivalente, retomada parcial e CLI de diagnóstico com usuário somente leitura, preservando snapshots dos dados.

O executor temporário usa `--no-defaults`, porta e diretório próprios, com prefixo `labhist-p10-`. Pools, processos e diretórios próprios são encerrados/removidos; nenhum banco, arquivo ou credencial real do projeto é usado. A ausência de MySQL gera suíte ignorada explícita e não prova persistência. Não há teste manual indispensável identificado para estes critérios; implantação e correção de dados reais permanecem separadas.
