# Listagem de projetos — P42

GET /projetos filtra projetos pela identidade da sessão antes de buscar membros. Em lista não vazia, usa uma consulta de projetos e duas de membros por conjunto de IDs. Aluno recebe apenas sua própria participação e nomes/IDs dos professores; professor recebe nomes/IDs da equipe acompanhada; administrador preserva os campos administrativos anteriores. Parâmetros de perfil/ID na URL não concedem acesso. Cache-Control: no-store.

Em projetos legados sem professores na relação, o administrador mantém o fallback de professor_id: uma única consulta adicional atende todos os responsáveis ausentes. Esse fallback não concede participação acadêmica. Lista vazia faz somente a consulta de projetos. Falha em qualquer consulta retorna erro sanitizado, sem lista parcial.

descricao e objetivo preservam o conteúdo original. Resumos de nomes ficam em professores_texto e alunos_texto, exibidos em linhas próprias na listagem administrativa, com escape de HTML. Os arrays e IDs de membros continuam disponíveis; o detalhe usa o mesmo mapeador. Não há cache de dados pessoais nem consultas HTTP individuais por projeto.

## Medição controlada

MySQL8.0.46 descartável, Express/HTTP real, Node24.19.0. Mesmo gerador de dados antes/depois: um professor e dois alunos por projeto. Cronômetro cobre a resposta HTTP completa, incluindo serialização. Leituras únicas locais, sem pretensão de benchmark de produção; execuções antes/depois tiveram condições de carga diferentes.

| Projetos | Consultas antes | Consultas depois | Tempo antes (ms) | Tempo depois (ms) |
|---:|---:|---:|---:|---:|
| 0 | 1 | 1 | 16.382 | 8.834 |
| 1 | 3 | 3 | 16.723 | 13.506 |
| 12 | 25 | 3 | 21.427 | 8.391 |
| 40 | 81 | 3 | 29.602 | 10.049 |

Essas contagens são da listagem administrativa, sem consultas de login. Acadêmicos também fazem a revalidação constante de conta/pessoa de P06/P07. O teste confirma que as consultas de membros incluem apenas os IDs previamente autorizados. Não se promete redução percentual de latência, carga suportada ou homologação D12.

Logs temporários: labhist-p42-antes.log e labhist-p42.log. A medição anterior foi feita carregando o código original antes de sua alteração; o teste atual exige a contagem constante e falha se N+1 voltar.

```powershell
node --experimental-vm-modules --test --test-concurrency=2 --test-reporter=spec server/test/listagem-projetos.test.js server/test/acesso-academico.test.js server/test/erros-interface.test.js server/test/autorizacao.test.js
```

190 testes aprovados: dez novos HTTP/MySQL descartáveis e um Chrome de renderização escapada, além das regressões. Banco e uploads reais não são usados; Chrome usa respostas controladas. Migração e implantação não fazem parte desta alteração.
