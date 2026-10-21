# Sessão e interface (P13)

`GET /sessao` exige cookie autenticado e retorna somente `{conta_id, pessoa_id, perfil, nome}` com `Cache-Control: no-store`. Consulta novamente a conta e, para alunos/professores, a pessoa vinculada. Conta removida, perfil alterado, vínculo removido ou pessoa diferente invalidam a sessão. Falha de banco é erro de serviço; não vira identidade administrativa.

A página começa com o conteúdo e menus ocultos até confirmar a sessão. Não há perfil padrão nem seletor de pessoa. localStorage não participa da identidade; chaves antigas são removidas. Recarregar confirma novamente; retorno pelo cache de navegação também solicita confirmação. A seleção visual no login precisa corresponder ao perfil da conta validada, mas não concede permissões. Login sem seleção na interface é recusado; clientes antigos que omitem o campo ainda recebem o perfil real do servidor.

401 interrompe a chamada e encaminha ao login. Logout só informa saída depois de o servidor confirmar, limpando a identidade, formulários e estado local. A expiração esconde o conteúdo. O carregamento de sessão que falha permite tentar novamente sem abrir os menus.

Nomes de autores não dependem mais da enumeração pública de pessoas. A interface usa o nome autorizado retornado com o documento ou identifica o perfil/ID conhecido; autoria desconhecida não recebe perfil inventado. Restrições de recursos/download são P07/P08; o ID da sessão não constitui sozinho prova de participação em projeto.

Validação: `server/test/sessao-interface.test.js` contém 10 casos HTTP e 9 Chrome, com Express, páginas, JavaScript e cookies reais. MySQL é substituído por doubles. No navegador, apenas o endereço fixo da API é redirecionado para a porta aleatória da fixture; fontes externas são bloqueadas. Não se afirma integração com MySQL/nuvem ou homologação da matriz D12. Configuração de origens/cookies de implantação continua em P03.
