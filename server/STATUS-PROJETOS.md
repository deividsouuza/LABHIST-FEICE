# Status dos projetos — P18

Decisão do responsável registrada em 07-DUVIDAS-DA-ERS.md em 18/10/2026: preservar projetos existentes com NULL, exibido como “Não informado”; novos projetos exigem um dos três estados da ERS. O administrador pode classificar os antigos. Datas/período continuam fora do escopo D05.

A migração explícita008 acrescenta projeto.status, VARCHAR(20) NULL DEFAULT NULL e CHECK para finalizado, em andamento ou cancelado. Não há UPDATE de classificação. As versões001–007 permanecem imutáveis. Partida confere coluna/default/restrição aplicada sem DDL. Nenhuma migração no banco real foi executada.

POST /projetos exige status exatamente finalizado, em andamento ou cancelado. NULL, ausente e estados arbitrários retornam 400. PUT /projetos/:id aceita os mesmos estados. Omissão mantém o estado atual, preservando compatibilidade de edição; NULL explícito só mantém legado ainda não classificado e retorna 400 quando o estado já está definido. Não existe operação para apagar classificação.

GET /projetos e GET /projetos/:id incluem status (texto válido ou NULL). Apenas administrador escreve; identidade/vínculo e documentos continuam regidos por P06/P07/P08. Atualização mantém transação, título, objetivo, descrição e membros conforme o payload existente.

Cadastro/edição administrativos têm seletor e a lista exibe rótulo. Novos exigem escolha, sem padrão deduzido; edição de legado mantém opção vazia/Não informado até escolha explícita. Erros preservam os campos. A exibição acadêmica completa é P19.

Testes novos:18 HTTP/MySQL descartáveis reais e6 Chrome com respostas controladas, incluindo os três estados, criação sem estado, edição sem classificação, classificação explícita, proibição de apagar estado conhecido, perfis/forja, upgrade007→008 e drift de CHECK. Evidências finais e comandos em08-CONTROLE-DE-EXECUCAO.md. Não confundir o teste Chrome com integração navegador+MySQL.
