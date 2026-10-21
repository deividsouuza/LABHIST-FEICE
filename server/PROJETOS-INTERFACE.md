# Projetos e subprojetos na interface — P19/P23/P24

Aluno/professor abre detalhe consultando GET /projetos/:id. Só após resposta válida a tela mostra descrição, objetivo, status, membros permitidos e participação existente. Dados da lista local não concedem acesso. Submissões/downloads continuam nas APIs P07/P08; aluno recebe seus documentos e professor identifica envios acompanhados. Falha no detalhe limpa o contexto anterior e impede envio. Não há autoinscrição.

Administrador abre subprojetos pelo botão na lista de projetos; aluno/professor, pelo detalhe autorizado. A navegação consulta o projeto e GET /projetos/:id/subprojetos, depois GET /subprojetos/:id no detalhe. IDs e pai são conferidos também no cliente para impedir associação visual errada; a autorização permanece no servidor. Listas têm carregando/vazio/erro; erro de detalhe mantém a lista, sem abrir detalhe vazio. Voltar preserva o projeto selecionado. Textos usam textContent ou escape HTML, com quebras de linha preservadas.

P24 acrescenta botão/formulário só para administrador, após carregar o pai com sucesso. Título é obrigatório de 1–255 caracteres; demais campos são opcionais, com limite de 65535 bytes UTF-8 por TEXT, seguindo P20. O pai vem do contexto validado e não pode ser editado no formulário. POST usa /projetos/:id/subprojetos. Mensagem e ID válidos confirmam sucesso antes de limpar os campos e recarregar a lista do mesmo pai. Em erro, mantém dados e contexto. Não há reenvio automático; clique repetido durante requisição não duplica cadastro.

Respostas antigas de detalhe/documentos/subprojetos são descartadas ao mudar de tela, projeto ou sessão. Logout/401 limpa campos/contexto; 401 encaminha ao login. A API ainda confere sessão/perfil/vínculo e é a autoridade para escrita e leitura.

P25 reutiliza o formulário para edição administrativa. O registro é consultado e validado antes de substituir os campos; falha no GET mantém a tela/rascunho. PUT preserva ID e pai e só atualiza a lista/detalhe após confirmação válida. Trocar de tela, criar outro registro ou encerrar sessão limpa a seleção de edição. Falha de gravação preserva os textos.

P26 acrescenta exclusão administrativa no detalhe, com confirmação explícita incluindo o título. Cancelar não envia DELETE. O frontend aguarda a API e recarrega a lista do mesmo pai apenas no sucesso, limpando seleções.403/404/409/500 mantêm o item visível; conflito/dependentes protegidos são sinalizados sem remover filhos, arquivos ou outros registros no cliente. A política de proteção permanece na API P22. Clique duplo não duplica requisição; respostas antigas não trocam a tela atual.

Não foram criados conteúdos didáticos, quizzes, atividades ou vínculos de envio a subprojeto. Períodos D05 e políticas futuras permanecem abertos. P25/P26 não alteram esquema nem política de dependentes.

## Testes

```powershell
node --experimental-vm-modules --test --test-concurrency=1 --test-reporter=spec server/test/projetos-interface.test.js
```

55 testes Chrome com respostas controladas (6 P18,8 P19,9 P23,12 P24,11 P25,9 P26). Cobrem estados, perfis, dados escapados, documentos/autores, pai correto,401/403/404/409/500, validações, preservação do formulário, edição, confirmação/cancelamento, clique duplo, irmãos e navegação. P07 e P20–P22 têm testes separados de HTTP/MySQL descartáveis reais; não declarar E2E navegador+MySQL. Emulação móvel confere menu/fluxo, sem homologar aparelho Android/iOS ou D12. Banco, .env e uploads reais não são utilizados.
