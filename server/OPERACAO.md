# Operação e sessões — P03

Decisão operacional D12 aprovada em 19/10/2026: frontend/API na mesma origem por padrão; produção HTTPS por proxy explicitamente confiável; sessões MySQL com expiração após 8 horas sem atividade. Desenvolvimento aceita HTTP. Não equivale à homologação física D12/P44.

O Express serve /configuracao-publica.js com somente API_PUBLIC_ORIGIN (ou vazio para usar a origem atual). Login, painel e visitante usam esse contrato, sem localhost fixo. Para frontend servido separadamente, o servidor de frontend deve fornecer esse mesmo script de configuração pública; cadastrar a origem exata em CORS_ORIGINS na API. Nenhum segredo entra no JavaScript público.

APP_ORIGIN e CORS_ORIGINS aceitam origens completas sem barra final, caminho, credenciais ou wildcard. Em produção somente HTTPS. Origem externa é recusada com 403 antes de sessão/SQL, inclusive preflight. Sem Origin seguem os controles normais de autenticação; CORS não substitui autorização. TRUST_PROXY contém IPs/subredes explícitos do proxy; não usar true ou número de saltos genérico. Restringir acesso de rede ao backend ao proxy configurado; APP_ORIGIN não deriva de Host de terceiros em produção. Não houve hospedagem/implantação nesta tarefa.

SESSION_STORE=mysql é o padrão; produção recusa memory. A opção memory existe apenas para desenvolvimento/testes explicitamente configurados e perde sessões ao encerrar processo. Cookies têm HttpOnly, SameSite=Lax, maxAge de 8 horas e renovação em atividade; Secure em produção. Proxy deve terminar HTTPS e enviar X-Forwarded-Proto corretamente. Logout remove registro e cookie. SID é armazenado como SHA-256, com dados mínimos de sessão sem senha/token de recuperação; TTL SQL usa UTC_TIMESTAMP, independente do fuso do driver. Leituras recusam sessão vencida; gravações limpam lotes limitados de vencidas, sem timer/serviço adicional.

Migração explícita 010 cria sessoes; versões antigas preservadas. Inicialização confere estrutura, sem DDL automático. Aplicação no banco real não executada. TLS local de teste usa exclusivamente os PEM de fixtures, sem validade de produção; chave publicada é deliberadamente exclusiva do teste. Nunca reutilizar esses arquivos na implantação.

Validação: P03/P04 22/22 HTTP/HTTPS/MySQL/esquema; confirmação UTC 8/8; navegador 51/51 incluindo host da página em desktop/mobile emulado, regressão de erros e área pública; autenticação/autorização 138/138. Sem dispositivo físico ou banco real. Comandos/logs no controle08.
