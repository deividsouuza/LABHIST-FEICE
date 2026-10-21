# Uploads de documentos — P16

Mantêm-se PDF, DOC, DOCX, JPG/JPEG e PNG. O MIME enviado pelo navegador não é usado como prova. Nome original é apenas metadado (UTF-8); gravação usa UUID e extensão permitida. Extensão final inválida, intermediária executável (como exe.pdf) ou controles no nome são recusados; pontos de versão como relatorio.v2.pdf permanecem válidos.

Política operacional configurável (não requisito novo da ERS):

| Variável | Padrão | Faixa |
|---|---|---|
| UPLOAD_MAX_BYTES | 10485760 (10 MiB) | 1024–104857600 |
| UPLOAD_MAX_FIELDS | 8 | 2–32 |
| UPLOAD_FIELD_MAX_BYTES | 8192 | 1024–65536 |
| UPLOAD_MULTIPART_MAX_BYTES | arquivo + campos × campo + 65536 | pelo menos arquivo+1024, até 134217728 |
| UPLOAD_EXPANDED_MAX_BYTES | 67108864 (64 MiB) | 1024–134217728 |

O total de bytes é contado também em transferência chunked, sem depender de Content-Length. Apenas um arquivo por envio; partes/campos e nomes de campos são limitados, sem objetos aninhados. Configuração inválida impede a partida com mensagem sem valores sensíveis. Descrição precisa ser texto único, após trim, entre 1 e 255 caracteres. O frontend replica o limite de descrição; o servidor é a autoridade. O exemplo .env contém apenas limites e campos vazios de credenciais.

Verificação estrutural mínima: PDF tem cabeçalho de versão e encerramento; JPEG tem SOI/EOI e cabeçalhos de quadro/scan; PNG tem assinatura, chunks obrigatórios, CRC e dados zlib limitados. A [especificação PNG](https://www.w3.org/TR/png-3/) descreve os chunks/CRC usados. DOC exige contêiner CFB e stream WordDocument com identificação FIB (incluindo mini-stream), conforme [MS-DOC](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-doc/d7fae142-670d-4cd5-869a-708366984a71). DOCX exige ZIP consistente, CRC, expansão limitada, content types, relationship e XML principal de Word; ZIP genérico, traversal, entradas duplicadas/encriptadas/ZIP64 e DTD são recusados. Não se executam documentos nem se declara que todo o conteúdo foi renderizado/validado por Office ou decodificador de imagens.

Autorização P07 precede recebimento na rota com projeto. A compatibilidade multipart antiga mantém staging privado. Conteúdo/descrição são verificados antes da promoção; locks de conta/equipe e transação permanecem. Storage próprio fecha streams antes de limpar em erro/aborto. Erros de validação são 400/415 e limites 413; falha SQL não confirma sucesso. Confirmação de COMMIT perdida segue a conciliação documentada em ACESSO-ACADEMICO.md, preservando bytes possivelmente já referenciados.

Testes: uploads.test.js tem casos de formato/limites e HTTP/multipart/arquivos reais com SQL simulado. JPEG/PNG mínimos foram gerados por System.Drawing; DOC/DOCX são fixtures estruturais sintéticas, não documentos pessoais. acesso-academico.test.js mantém MySQL real descartável e verifica persistência, rollback e autorização. Resultados confirmados no controle 08. Nenhum banco/upload real do projeto foi utilizado.
