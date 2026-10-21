// Contenção de acesso: não converte nem atribui autoria aos registros antigos.
export default {
    versao: 5, nome: 'acesso-documentos-confirmados',
    passos: [{ tabela:'documentos', coluna:'autoria_confirmada',
        sql:'ALTER TABLE documentos ADD COLUMN autoria_confirmada INT NOT NULL DEFAULT 0' }]
};
