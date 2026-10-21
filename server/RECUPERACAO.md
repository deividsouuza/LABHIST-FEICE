# Recuperação de senha — P40

Política D11 aprovada em 19/10/2026: contato de recuperação separado por conta, confirmado pelo administrador inclusive para conta administrativa; SMTP configurável; token aleatório de 256 bits, hash SHA-256 no banco, 30 minutos e uso único; todas as sessões da conta revogadas ao redefinir a senha. Não herda e-mail de aluno/professor nem atribui contatos legados. Migração explícita 013 cria contatos_recuperacao/recuperacao_senha e usuarios.sessao_versao, sem dados de contato inventados. Nenhuma migração real aplicada. FKs RESTRICT exigem limpeza explícita desses registros operacionais antes de remover conta; conta autora continua protegida independentemente por P09.

## Contratos

- PUT /contas/:id/recuperacao: sessão administrativa; corpo {email, confirmado:true}. Admin atesta que o contato foi conferido fora do sistema. Não equivale a desafio automático de verificação de caixa postal. Alterar contato invalida links anteriores.
- POST /recuperacao/solicitar: {usuario,email}. Mesmo status/mensagem para conta inexistente, contato ausente ou incompatível, sem token na resposta. Usuário identifica a conta globalmente, permitindo contatos compartilhados sem inferir unicidade de e-mail. Transporte/origem não configurados retornam 503 uniforme antes de consultar contas.
- POST /recuperacao/redefinir: {token,novaSenha}. Token inválido/vencido/reutilizado e senha inválida retornam 400; válida retorna 200 após commit. Política da senha reutiliza P01 (não impõe novo mínimo por presunção).

A resposta uniforme da solicitação precede a consulta e o SMTP; processamento assíncrono é limitado a 100 jobs por processo e falhas são registradas somente por mensagem fixa sem contato/token/driver. A fila em memória não é entrega durável: reinício/falha SMTP exige solicitar novamente após restaurar configuração. Nova solicitação invalida links anteriores, e a resposta pública não confirma se uma mensagem foi entregue. Nenhuma caixa postal real foi acessada nos testes.

Limites por processo: 30/IP e 10/usuário por 15 minutos nas solicitações; redefinições têm limite separado por IP. Não é limite distribuído entre instâncias. TRUST_PROXY de P03 deve refletir os proxies reais; o patch de proxy-addr está registrado em DEPENDENCIAS.md.

Redefinição bloqueia conta e token em transação, grava hash scrypt, consome tokens, incrementa versão da sessão e remove sessões MySQL. Store consulta existência/versão da conta em cada leitura e impede uma requisição antiga de recriar sessão com versão anterior. MemoryStore explícito de desenvolvimento/teste tem sessões removidas por conta. Se a conta redefinida for a da requisição, seu cookie também é removido. Erro SQL reverte senha, versão, consumo e sessões; não há replay de transação.

## Configuração local, sem segredos no repositório

SMTP_HOST, SMTP_PORT (587 STARTTLS obrigatório ou 465 TLS direto), SMTP_USER, SMTP_PASSWORD, SMTP_FROM. RECOVERY_PUBLIC_ORIGIN define a origem pública do frontend; pode usar APP_ORIGIN como fallback. Produção exige HTTPS; não deriva endereço de redefinição de Host/Origin fornecidos pelo cliente. Link usa /login/redefinir.html#token=..., mantendo token fora da requisição HTTP/referrer. A tela é P41. Consulte [SMTP Nodemailer](https://nodemailer.com/smtp); certificados são validados, logs/debug e acesso a arquivos/URLs de anexos ficam desabilitados. Nenhum transporte alternativo arbitrário é aceito pelo ambiente.

SMTP/origem ausentes deixam a recuperação indisponível, sem impedir login normal. Configuração parcial inválida falha antes da partida; ferramentas CLI de banco continuam exigindo apenas parâmetros do banco e nunca precisam de SMTP/configuração web. Testes injetam transporte fictício e relógio dos limitadores, com configuração/SMTP reais desativados no helper. Relatórios em controle08: 21/21 HTTP/HTTPS/MySQL/configuração, sem e-mail real. Guia de suíte em TESTES.md.

## P41 — formulários e integração local

Esqueceu sua senha abre /login/recuperar.html, com usuário/e-mail do contato confirmado. /login/redefinir.html recebe token no fragmento, captura apenas em memória e remove o fragmento da barra de endereço; não usa localStorage, logs ou analytics para token/senha. Formulários validam campos, confirmação de senha e erros da API/rede, preservando dados em falha. Sucesso de reset limpa as senhas e desabilita reenvio; login e entrada de visitante permanecem acessíveis. Link aberto novamente na mesma aba recarrega o documento para reler o novo fragmento; API continua rejeitando tokens consumidos.

Integração local P41: nove casos com Chrome, HTTP, cookies e MySQL reais descartáveis, SMTP fictício, incluindo solicitar → abrir o link recebido → redefinir → autenticar nova senha, sessão antiga recusada, resposta uniforme, e-mail inválido, teclado, token ausente/vencido/reutilizado, senha divergente, rede/transporte fora e viewport de 390px. Essa é uma integração local de navegador+MySQL, diferente dos testes antigos de navegador com API/SQL controlados. Não equivale a SMTP real, implantação ou homologação de dispositivos P44. Comando: node --experimental-vm-modules --test --test-reporter=spec server/test/recuperacao-interface.test.js; 9/9, saída 0, 53994.5393 ms no log labhist-p41-final.log.
