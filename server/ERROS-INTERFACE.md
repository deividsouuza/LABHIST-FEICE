# Tratamento HTTP na interface (P14)

`assets/api.js` é carregado antes dos scripts de login e painel. Centraliza cookies, falhas de rede, JSON inválido e status. A interface só recebe respostas 2xx com JSON válido; cada leitura valida o formato de lista/registro antes de renderizar. A confirmação de uma mutação exige mensagem de sucesso. Respostas 200 com objetos de erro não limpam formulários.

401 no painel interrompe imediatamente, esconde os dados, limpa estado e encaminha ao login. No login, 401 é mensagem de credencial/perfil inválido. 403/404/409/validação têm mensagens próprias. Falhas 5xx usam mensagem fixa, sem texto técnico retornado pelo serviço. Campos e seleção continuam disponíveis para correção e nova tentativa.

Listas que já tinham dados restauram o conteúdo após uma falha. Edição de pessoa não inicia com resposta inválida; edição de projeto só muda ID/campos/equipe após carregar e validar projeto, professores e alunos. Falha em uma dessas consultas conserva a edição anterior. A autenticação não depende dessas validações visuais; o backend continua responsável pelas permissões.

`server/test/erros-interface.test.js`: 41 casos Chrome com status/JSON/rede controlados; HTML, JS e envio multipart do navegador são reais. Busca/filtro/retorno, máscaras e estados de gravação/exclusão são exercitados nas regressões anteriores. Não é validação com MySQL ou matriz de navegadores/dispositivos homologada.
