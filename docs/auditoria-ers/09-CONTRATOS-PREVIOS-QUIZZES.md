# Contratos prévios de quizzes — aprovados em 19/10/2026

Complementa as dependências já previstas em P34/P35 no arquivo 05. Não renumera nem substitui os 46 prompts. Aprovação explícita registrada em 07. Execução prevista depois da validação de P45, uma etapa por vez.

## Vínculo e publicação — antes de P34

Quiz possui projeto obrigatório para publicação e subprojeto opcional desse projeto. Legados continuam sem vínculo e privados; migração não associa projetos por dedução. Administrador pode definir rascunho, publicado, arquivado e autorização explícita de introdução pública. Nenhum quiz novo torna-se público automaticamente. Vínculo/subprojeto/publicação usam configuração administrativa explícita. Mudanças não apagam histórico; regra existente de bloquear edição inteira com respostas/resultados abrange essa configuração. Relações persistidas com FKs restritivas.

Aluno precisa de identidade atual e vínculo atual no projeto; somente publicado é disponível. Visitante recebe exclusivamente ID, título e introdução de quiz publicado com autorização pública explícita. Gabarito permanece exclusivo dos contratos administrativos. Professor não responde. A implementação desta etapa oferece serviço de disponibilidade reutilizado em P34/P35. Não cria tentativas ou resultados.

Aceite: atualização administrativa com projeto existente/subprojeto compatível; recusa de perfil não administrativo, IDs inválidos, projeto inexistente, subprojeto alheio e publicação sem vínculo. Legados privados após migração; rollback integral; edição/exclusão anterior preservadas. Testar em MySQL descartável, sem banco real.

## Correção — antes de P35

Serviço recebe perguntas/alternativas do servidor e conjunto de respostas validadas; exige todas as perguntas exatamente uma vez e alternativa pertencente à pergunta. Um ponto por resposta correta, zero por incorreta; pontuação máxima = quantidade de perguntas; percentual = acertos / perguntas × 100. Não recebe nota do navegador. Testar acerto total, zero, parcial, fração, perguntas faltantes/duplicadas, alternativas alheias e gabarito inconsistente. Não fornece gabarito ao aluno.

P35 consumirá esse serviço e persistirá respostas e resultado na mesma transação. Uma tentativa concluída por aluno/quiz, inclusive sob concorrência. Respostas idênticas, independentemente de ordem do JSON, retornam o resultado já persistido; conjunto diferente é recusado. Identidade provém da sessão vinculada. Falha parcial reverte tudo.

## Limites

Sem implantação, migração real, ranking, gráfico, tentativas extras ou aprovação implícita de D06/D12. Etapas prévias não contam como conclusão de P34/P35. Evidências e estado de cada etapa serão registrados no controle 08 antes do consumidor seguinte.

## Execução registrada

Vínculo/publicação implementado e validado antes de P34: 11/11 HTTP/MySQL, 68/68 regressão de esquema/admin e 4/4 Chrome/HTTP/MySQL. Correção implementada/testada antes de P35: 9/9 unitários. P34/P35/P36 concluídos, regressão completa1262/1262 com saída0. Integração da FK composta na exclusão de subprojetos corrigida e validada: proteção por dependente existente, sem bloqueio de irmãos vazios. Resultados completos e limitações em 08; nenhuma migração real executada.
