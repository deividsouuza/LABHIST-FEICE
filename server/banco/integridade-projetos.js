import versao from './versoes/003-integridade-projetos.js';

export class ErroIntegridade extends Error {}

export async function diagnosticarProjetos(banco) {
    const orfaos = {}, duplicados = {};
    for (const passo of versao.passos) {
        if (passo.tipo === 'fk') {
            const [[row]] = await banco.query(`SELECT COUNT(*) AS total FROM ${passo.tabela} c
                LEFT JOIN ${passo.referencia} p ON p.id=c.${passo.coluna}
                WHERE c.${passo.coluna} IS NOT NULL AND p.id IS NULL`);
            orfaos[`${passo.tabela}.${passo.coluna}`] = Number(row.total);
        } else {
            const [[row]] = await banco.query(`SELECT COUNT(*) AS total FROM (
                SELECT ${passo.colunas.join(',')} FROM ${passo.tabela}
                GROUP BY ${passo.colunas.join(',')} HAVING COUNT(*) > 1) pares`);
            duplicados[passo.tabela] = Number(row.total);
        }
    }
    return { orfaos, duplicados, incidencias: [...Object.values(orfaos), ...Object.values(duplicados)].reduce((a, b) => a + b, 0) };
}

// Aceita restrições equivalentes sob outros nomes; não substitui FK divergente.
export async function restricaoAplicada(banco, passo) {
    if (passo.tipo === 'unique') {
        const [rows] = await banco.query(`SELECT INDEX_NAME AS nome, COLUMN_NAME AS coluna, SUB_PART AS prefixo
            FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND NON_UNIQUE=0 ORDER BY SEQ_IN_INDEX`, [passo.tabela]);
        const grupos = Map.groupBy(rows, row => row.nome);
        if ([...grupos.values()].some(cols => cols.length === passo.colunas.length && cols.every(c => !c.prefixo && passo.colunas.includes(c.coluna)))) return true;
        if (rows.some(row => row.nome === passo.nome)) throw new ErroIntegridade(`Índice incompatível em ${passo.tabela}.`);
        return false;
    }
    const [rows] = await banco.query(`SELECT k.CONSTRAINT_NAME AS nome, k.COLUMN_NAME AS coluna,
        k.REFERENCED_TABLE_NAME AS destino, k.REFERENCED_COLUMN_NAME AS chave,
        (k.REFERENCED_TABLE_SCHEMA=DATABASE()) AS local_ok,
        r.DELETE_RULE AS exclusao, r.UPDATE_RULE AS atualizacao
        FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r
          ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME
        WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL`, [passo.tabela]);
    const grupos = Map.groupBy(rows, row => row.nome);
    const relacionados = [...grupos.values()].filter(g => g.some(r => r.coluna === passo.coluna));
    if (relacionados.some(g => g.length !== 1 || !g[0].local_ok || g[0].destino !== passo.referencia || g[0].chave !== 'id' ||
        !['RESTRICT', 'NO ACTION'].includes(g[0].exclusao) || !['RESTRICT', 'NO ACTION'].includes(g[0].atualizacao))) {
        throw new ErroIntegridade(`FK incompatível em ${passo.tabela}.${passo.coluna}; revisão explícita necessária.`);
    }
    return relacionados.length > 0;
}

export async function prepararIntegridade(banco) {
    const diagnostico = await diagnosticarProjetos(banco);
    if (diagnostico.incidencias) throw new ErroIntegridade(`Legados incompatíveis: ${JSON.stringify(diagnostico)}. Nenhum registro foi removido ou corrigido; execute db:diagnose e revise a cópia do banco.`);
    // Verifica todas antes de aplicar qualquer restrição desta versão.
    for (const passo of versao.passos) await restricaoAplicada(banco, passo);
}

export async function verificarIntegridade(banco) {
    for (const passo of versao.passos) {
        if (!await restricaoAplicada(banco, passo)) throw new ErroIntegridade(`Restrição ausente: ${passo.tabela}.${passo.coluna || passo.colunas.join('+')}. Execute db:migrate ou revise o esquema.`);
    }
}
