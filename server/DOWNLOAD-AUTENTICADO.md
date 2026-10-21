# Downloads por documento (P08)

`GET /documentos/:id/download` exige sessão, participação no projeto e autoria para alunos. Professor precisa acompanhar o projeto; administrador mantém gestão global. A autorização ocorre antes do acesso ao disco e reaproveita as regras dos metadados. Aluno com ID coincidente ao de professor/administrador ou autor legado incerto não ganha acesso. Retirar participação ou encerrar sessão revoga o download.

`/uploads` retorna 404 em vez de servir arquivos, inclusive staging e URLs antigas. Os metadados deixam de retornar `arquivo_caminho` e fornecem `download_url` por ID. A interface constrói o link para o endpoint conhecido usando ID validado; não transforma caminhos físicos ou URLs arbitrárias em links.

## Confinamento e resposta

O caminho vem somente do registro autorizado. Aceitam-se arquivos diretamente em uploads/documentos, no formato relativo conhecido ou absoluto interno compatível. São recusados traversal, subdiretórios, fluxos NTFS, nomes de dispositivos/controles, links simbólicos e raiz por junction. Paths inseguros/ausentes retornam 404 genérico, sem revelar localização.

Antes do streaming, o código confere o caminho canônico e compara dispositivo/inode do descritor aberto com o arquivo regular verificado. Nenhum byte é consumido do descritor se a identidade do arquivo mudou. A transmissão utiliza esse descritor, evitando nova resolução pelo nome; há fechamento também em falha ou interrupção do cliente. As APIs utilizadas estão na [documentação de FileHandle do Node 24](https://nodejs.org/docs/latest-v24.x/api/fs.html#class-filehandle).

O nome original tem controles/separadores removidos e é enviado como attachment, com filename* UTF-8 explícito. A resposta usa application/octet-stream, nosniff e private/no-store. Caminho interno, SQL, hashes e tokens não aparecem em erros. O documento ausente é 404; falta de autorização é 401/403; falhas operacionais inesperadas são 500 sanitizado.

## Validação e limites

`server/test/download-documentos.test.js`: 19 casos de confinamento/descritor e 24 de HTTP/MySQL/arquivos reais, somente em diretórios e instância descartáveis. Há junction real de diretório; o caso de link simbólico de arquivo e a troca entre lstat/open usam operações simuladas, sem exigir privilégios de symlink no Windows. Negativas verificam zero início de acesso ao arquivo quando não há permissão. Casos positivos conferem bytes, nome acentuado e headers. Interrupção real do cliente verifica descritores fechados. Há regressão Chrome do link e logout/listagem nas demais suítes.

Não se fez migração, saneamento ou teste com arquivos/banco reais do projeto. O marcador de contenção de P07 não resolve a autoria histórica P09. P16 passou a validar limite/conteúdo do upload (UPLOADS.md); P17 coordena exclusão e limpeza persistente de arquivos (LIMPEZA-ARQUIVOS.md), reutilizando o confinamento deste módulo. Origem da API, HTTPS e sessão de implantação permanecem em P03/D12. Nenhuma matriz móvel/de navegadores foi homologada nesta etapa.
