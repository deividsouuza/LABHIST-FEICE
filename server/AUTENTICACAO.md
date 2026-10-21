# P01 — Autenticação e conversão das credenciais

Decisão do responsável em 18/10/2026: opção 1, preservar as senhas existentes convertendo seu armazenamento. A migração não cria contas, altera nomes/perfis ou associa pessoas. E-mail de recuperação e identificação/vínculos continuam pendentes de D10/D11, P06/P40.

## Configuração local

Com Node 24, copie `.env.example` para `.env` dentro de `server` e preencha localmente `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `SESSION_SECRET`. O segredo da sessão deve ser aleatório, exclusivo e ter pelo menos 32 bytes. Não reutilize os antigos valores embutidos no código; providencie a rotação das credenciais antigas no ambiente. Nenhuma credencial real foi alterada nesta implementação.

Arquivos `.env` são ignorados pelo Git. As variáveis podem também ser fornecidas pelo ambiente. Ausência de valores obrigatórios, segredo curto ou porta inválida impede o início com mensagem que identifica a configuração inválida, sem imprimir seu valor. Erros de conexão não imprimem objetos SQL/credenciais.

Antes de iniciar, instale/verifique o esquema com o [procedimento de banco do P04](BANCO-DE-DADOS.md). Execute a partir da pasta `server`:

```powershell
node --env-file=.env index.js
```

Não existe mais criação automática de administrador nem senha padrão. Instalações existentes usam suas contas migradas; em instalação vazia, o provisionamento administrativo deverá ser explícito e controlado. O esquema versionado foi implementado posteriormente no P04 e não faz parte da migração de senhas.

## Migração explícita

1. Pare o servidor e outros processos que gravam em `usuarios`. Confirme o destino no ambiente local e faça backup protegido do banco. O backup legado contém senhas em texto puro: restrinja seu acesso e retenção.
2. A tabela `usuarios` deve existir, usar InnoDB e ter a coluna `senha` com capacidade de pelo menos 182 caracteres (o schema atual usa VARCHAR(255)). Primeiro valide em cópia descartável.
3. Simule a conversão, sem gravações:

```powershell
node --env-file=.env scripts/migrar-credenciais.js --dry-run
```

4. Após conferir o backup e o resultado da simulação, aplique explicitamente no ambiente autorizado:

```powershell
node --env-file=.env scripts/migrar-credenciais.js --apply
```

5. Reinicie o servidor e verifique o acesso com a mesma senha. O login não aceita texto puro armazenado: contas não convertidas não entram. Para desfazer a migração em caso de incidente operacional, use o backup protegido com o servidor parado; o login seguro permanece exigindo hashes, portanto restaurar texto puro também exige reaplicar a migração antes de liberar acesso.

Sem argumento, o script também simula. Só são exibidos totais, nunca IDs, usuários, senhas, hashes ou SQL. Há uma única transação com bloqueio dos registros; falha provoca rollback de todas as conversões. Hashes scrypt válidos são preservados, permitindo repetir o comando. Credenciais vazias, inválidas ou com prefixos reservados de hash interrompem a migração para análise, sem conversão parcial nem redefinição automática. Nenhuma aplicação no banco real foi executada pelo agente.

## Contratos e política de proteção

- `POST /login` mantém o corpo `{usuario, senha}` e a resposta de sucesso existente. Credenciais incorretas, inexistentes ou inválidas recebem o mesmo 401 e mensagem. O perfil vem da conta no banco; campos de perfil/ID enviados no login não concedem privilégios.
- `POST /cadastro` continua restrito a administrador. A senha é convertida antes do INSERT e não volta na resposta.
- `GET /pessoas` e `POST /sessao/pessoa` respondem 410 sem SQL e sem criar sessão. Sessões com origem antiga `pessoa` também não passam em `requireAuth`. Seleção sem senha deixa de funcionar por decisão de segurança do P01; a substituição da interface e os vínculos acadêmicos dependem de P06/P13. Não há autenticação provisória por ID.
- O login bem-sucedido regenera o identificador, destrói a sessão anterior e salva a nova antes da resposta. Logout destrói a sessão e limpa o cookie.
- Hash versionado scrypt: N=65536, r=8, p=1, salt aleatório de 16 bytes, chave de 64 bytes e comparação com `timingSafeEqual`. A API aceita senha com até 1024 bytes UTF-8, sem remover espaços; não aceita formatos de hash como senha. Parâmetros de custo não vêm da requisição. Referência: [API crypto do Node](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).
- Limite fixo de 15 minutos: 10 requisições por usuário normalizado e 30 por IP, incluindo sucessos e corpos inválidos. Excesso recebe 429 e Retry-After de 900 segundos. Chaves de usuário ficam como SHA-256 em memória; mapas expiram a cada requisição e têm teto de 10 mil chaves. IP vem de `req.ip`, sem confiar em cabeçalho encaminhado. Sem store compartilhado, reiniciar o processo limpa os limites; múltiplas instâncias exigirão coordenação. Esta é uma política operacional local, não uma nova regra da ERS.
- Store de sessão em memória, CORS, HTTPS/proxy e expiração de cookies continuam dependentes do P03/D12. O uso em produção ainda exige essa configuração. Não foram antecipados P07/P08 nem seus filtros/download autenticado.

## Validação reproduzível

A partir da raiz do projeto:

```powershell
node --experimental-vm-modules --test --test-reporter=spec server/test/autenticacao.test.js server/test/migracao-credenciais.test.js server/test/autorizacao.test.js server/test/validacao-pessoas.test.js server/test/formulario-pessoas.test.js
```

A integração de migração usa `mysqld.exe` local em uma instância nova, isolada por `--no-defaults`, diretório temporário e porta própria, sem acessar serviço/dados do projeto. `MYSQLD_BIN` permite indicar outro executável; se indisponível, a suíte é explicitamente ignorada e não constitui evidência de persistência. O processo filho é encerrado e só seu diretório temporário é removido após validação do caminho. O navegador usa Chrome/Edge local; sua ausência também deve ser tratada como limitação, não como aprovação.

As regressões de autorização/validação usam banco simulado; os testes de migração usam MySQL real e incluem login HTTP de uma conta convertida. Nenhum teste usa conta, senha ou clipboard pessoal. `npm test` continua sendo o placeholder existente; sua organização geral pertence ao P43.

## Integração posterior P06/P13/P14/P07/P08

Os parágrafos anteriores registram a entrega original P01. O lote autorizado em 18/10/2026 implementou vínculo conta/pessoa, consulta de sessão e interface sem seletor/storage como identidade, restrição por participação e download privado. Login aceita o campo opcional perfil; se presente, precisa corresponder ao perfil real da conta. Contas acadêmicas exigem vínculo explícito. POST /cadastro acadêmico exige pessoa_id; novos cadastros de pessoa podem incluir credenciais transacionais. Consulte IDENTIDADE-ACADEMICA.md, SESSAO-INTERFACE.md, ACESSO-ACADEMICO.md e DOWNLOAD-AUTENTICADO.md. P03/D12, e-mail de recuperação e migração completa de autoria P09 continuam separados. A política de hash, preservação de senhas e limite de tentativas do P01 foi mantida.
