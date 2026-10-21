# Identidade, participação e documentos (P07)

As contas usam o vínculo P06. Aluno/professor têm a conta e pessoa revalidadas a cada acesso acadêmico. Parâmetros, headers, localStorage e IDs de URL não alteram a identidade. Administrador mantém gestão global. `/usuarios` é administrativo; detalhe de pessoa acadêmica é limitado à própria pessoa e perfil.

Lista e detalhe de projeto usam exclusivamente `projeto_aluno`/`projeto_professor`. O responsável legado em `projeto.professor_id` não substitui participação na relação. Não há autoinscrição nem alteração do mínimo de membros. Participantes recebem nomes/IDs necessários à equipe; e-mail, telefone e matrícula dos colegas não são retornados. Alunos recebem sua própria participação e os professores; professores recebem os nomes dos alunos do projeto acompanhado.

Professor vinculado consulta documentos daquele projeto; aluno consulta somente seus envios confirmados. Mesmo ID numérico com perfil diferente não confere autoria. A migração 005 adiciona `autoria_confirmada` com default 0, preservando todos os dados históricos e sua incerteza. A API só grava 1 em novos envios autenticados. Não existe endpoint que aceite esse campo como prova de autoria. Registros antigos continuam acessíveis ao administrador e professor responsável, mas não são liberados ao aluno por coincidência numérica. O marcador é uma contenção de autorização: não substitui a referência estável/migração de autoria histórica de P09 nem resolve D07.

## Envio

`POST /projetos/:id/documentos` exige sessão/participação antes do Multer. O ID do corpo, quando informado, precisa coincidir. `/documentos` permanece por compatibilidade com o contrato multipart antigo, inclusive arquivo antes dos campos; usa área `.temporarios` (ignorada pelo servidor estático) e só promove após validar os dados e o vínculo. A interface usa a rota com projeto na URL.

Conta/pessoa e participação são novamente verificadas com locks na transação antes da promoção e INSERT. O autor vem da pessoa da sessão; administrador mantém seu perfil e ID de conta. Falhas conhecidas revertem e removem o arquivo novo. Se a confirmação do COMMIT for perdida, a conexão é descartada e o arquivo preservado: a operação pode ter sido confirmada e não é repetida automaticamente. A mensagem sanitizada informa necessidade de conciliação operacional; nenhum caminho/segredo vai à resposta. O operador deve verificar os metadados antes de remover arquivo possivelmente órfão. Não há rotina automática de remoção de dados reais.

Em legados que ainda tenham FK polimórfica de autor para usuarios, um envio cujo ID de pessoa não satisfaça essa FK pode retornar conflito. Não se troca o autor para forçar aceitação. A compatibilização dessa FK/autoria é P09. Limites e conteúdo do upload foram implementados em P16 (UPLOADS.md); exclusão coordenada e recuperação de limpeza em P17 (LIMPEZA-ARQUIVOS.md). O acesso estático e download autenticado são tratados em P08. Subprojetos de P20–P22 reutilizam a autorização do projeto pai e não acrescentam associações de envio (SUBPROJETOS.md).

## Verificação

`server/test/acesso-academico.test.js` usa MySQL, HTTP, sessões, multipart e arquivos reais em instâncias/diretórios descartáveis. IDs de conta e pessoa são deliberadamente distintos. Testa escopo das listas/detalhes/envios, redução de dados pessoais, colisão de perfis, autoria incerta, remoção concorrente de participação, rollback e COMMIT com resposta perdida. Não usa o banco, uploads ou credenciais do projeto. Os resultados e comandos confirmados ficam no controle 08.
