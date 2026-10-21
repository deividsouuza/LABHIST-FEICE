# Contas e pessoas (P06)

Regra aprovada pelo responsável em 18/10/2026: login com usuário globalmente único e senha. Nome continua sendo o único dado pessoal obrigatório do professor; e-mail/matrícula não ganham unicidade. A comparação de usuário segue a collation da coluna existente. As senhas seguem P01, sem alteração automática dos valores legados.

`conta_pessoa` (migração 004) associa uma conta a exatamente um aluno ou professor do mesmo perfil. UNIQUE impede duplicidade, FKs impedem órfãos e CHECK impede perfil/colunas incompatíveis. A FK composta impede mudar o perfil de uma conta vinculada para outro perfil. As versões 001–003 permanecem imutáveis. A partida apenas verifica o esquema; não aplica DDL.

- `POST /cadastro-dashboard`: dados pessoais existentes e, opcionalmente, `credenciais: {usuario, senha}`. Quando presentes, pessoa, conta e vínculo são gravados na mesma transação; falhas revertem tudo. O contrato sem credenciais permanece para manutenção de registros legados.
- `POST /cadastro`: conta administrativa mantém seu contrato; aluno/professor exige `pessoa_id` existente. Conta e vínculo na mesma transação.
- `GET /contas/pendencias`: somente administrador; contas acadêmicas e pessoas sem vínculo, com IDs/nome de usuário/nome/perfil necessários à revisão, sem hash ou senha. A lista não faz correspondências por nome.
- `PUT /contas/:id/vinculo`: somente administrador; `{perfil, pessoa_id}`. Cria associação explícita de uma conta ainda sem vínculo; não transfere associações existentes. Duplicidade é 409; incompatibilidade 400; ausência 404.

Login acadêmico sem vínculo é recusado com a mesma mensagem de credencial inválida. IDs de conta e pessoa são separados na sessão (`conta_id`, `pessoa_id`); o ID da conta não é um ID acadêmico. Administrador não precisa de pessoa. Ao remover uma pessoa pela API, seu vínculo é removido na mesma transação; a conta/senha são preservadas e ficam sem acesso acadêmico. Documentos antigos não são reatribuídos; P09 permanece separado.

## Atualização e regularização manual

Preparar backup e revisar em cópia antes da aplicação pelo responsável. Nenhuma migração real foi executada nesta implementação.

1. Aplicar `db:migrate` em ambiente apropriado, conforme BANCO-DE-DADOS.md; versão esperada 004.
2. Consultar pendências com sessão administrativa. Conferir cada correspondência fora do algoritmo, usando IDs e documentos administrativos pertinentes.
3. Aplicar o endpoint de vínculo ou preparar um JSON: `[{"conta_id":80,"perfil":"aluno","pessoa_id":42}]`.
4. `node --env-file=.env scripts/vincular-contas.js mapa.json` (a partir de server/) verifica o esquema e valida as escritas em transação, terminando com rollback. Não é leitura pura: adquire locks, requer permissão de escrita e pode avançar o contador AUTO_INCREMENT do vínculo; não é adequado executá-lo no banco real como inspeção informal.
5. Depois da revisão explícita: `node --env-file=.env scripts/vincular-contas.js mapa.json --apply`. Um mapa inteiro é atômico. Erro no último item reverte os anteriores; não há vinculação automática nem alteração de senhas. O relatório de execução exibe somente modo/quantidade.

A aplicação utiliza o pool já existente. O CLI usa conexão limitada ao banco configurado deliberadamente pelo operador; os testes criam sua própria instância e nunca carregam .env. E-mail de recuperação/transporte permanecem em D11/P40.

## Verificação

`node --experimental-vm-modules --test --test-reporter=spec server/test/identidades.test.js`, na raiz. Casos usam Express/sessão e MySQL descartável reais; o bootstrap do projeto é substituído. Não é teste de navegador. A execução e os resultados confirmados constam em docs/auditoria-ers/08-CONTROLE-DE-EXECUCAO.md.
