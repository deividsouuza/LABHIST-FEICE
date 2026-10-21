import { gerarHash, hashValido, senhaValida } from './credenciais.js';

// Executar com o servidor parado, em conexão dedicada. Não altera esquema/pessoas/vínculos.
export async function migrarCredenciais(banco, aplicar = false) {
    const [[tabela]] = await banco.query(
        "SELECT ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'"
    );
    if (tabela?.engine !== 'InnoDB') throw new Error('Migração exige tabela usuarios em InnoDB.');
    await banco.beginTransaction();
    try {
        const [rows] = await banco.query('SELECT id, senha FROM usuarios FOR UPDATE');
        let convertidas = 0;
        for (const row of rows) {
            if (hashValido(row.senha)) continue;
            if (!senhaValida(row.senha)) {
                throw new Error('Credencial incompatível. Migração cancelada sem revelar registros.');
            }
            if (aplicar) {
                const hash = await gerarHash(row.senha);
                const [result] = await banco.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, row.id]);
                if (result.affectedRows !== 1) throw new Error('Quantidade inesperada de registros.');
            }
            convertidas++;
        }
        if (aplicar) await banco.commit();
        else await banco.rollback();
        return { total: rows.length, convertidas, preservadas: rows.length - convertidas, aplicado: aplicar };
    } catch (erro) {
        await banco.rollback();
        throw erro;
    }
}
