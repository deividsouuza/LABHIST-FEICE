import { ErroIntegridade, restricaoAplicada } from './integridade-projetos.js';
import identidade from './versoes/004-identidade.js';

export async function verificarIdentidades(banco) {
    for (const passo of identidade.passos.filter(p => p.tipo==='unique')) {
        if (!await restricaoAplicada(banco, passo)) throw new ErroIntegridade('Indice de identidade ausente.');
    }
    const [engines] = await banco.query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='conta_pessoa'");
    if (engines[0]?.ENGINE !== 'InnoDB') throw new ErroIntegridade('Tabela de identidade requer InnoDB.');
    const [cols] = await banco.query(`SELECT COLUMN_NAME AS nome, DATA_TYPE AS tipo, IS_NULLABLE AS nulo
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='conta_pessoa'`);
    for (const [nome, tipo, nulo] of [['id','int','NO'],['usuario_id','int','NO'],['perfil','varchar','NO'],['aluno_id','int','YES'],['professor_id','int','YES']]) {
        if (!cols.some(c => c.nome===nome && c.tipo===tipo && c.nulo===nulo)) throw new ErroIntegridade('Estrutura de identidade incompativel.');
    }
    for (const coluna of ['usuario_id','aluno_id','professor_id']) {
        if (!await restricaoAplicada(banco, { tipo:'unique', tabela:'conta_pessoa', colunas:[coluna] })) throw new ErroIntegridade('Unicidade de identidade ausente.');
    }
    const [fks] = await banco.query(`SELECT k.CONSTRAINT_NAME AS nome, k.COLUMN_NAME AS origem, k.REFERENCED_TABLE_NAME AS destino,
        k.REFERENCED_COLUMN_NAME AS coluna, (k.REFERENCED_TABLE_SCHEMA=DATABASE()) AS local_ok, r.DELETE_RULE AS exclusao, r.UPDATE_RULE AS atualizacao
        FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r
        ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME
        WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME='conta_pessoa'`);
    for (const [origem,destino,coluna] of [['usuario_id','usuarios','id'],['perfil','usuarios','perfil'],['aluno_id','aluno','id'],['professor_id','professor','id']]) {
        if (!fks.some(f => f.origem===origem && f.destino===destino && f.coluna===coluna && f.local_ok && ['RESTRICT','NO ACTION'].includes(f.exclusao) && ['RESTRICT','NO ACTION'].includes(f.atualizacao))) throw new ErroIntegridade('FK de identidade ausente ou incompativel.');
    }
    const [checks] = await banco.query(`SELECT c.CHECK_CLAUSE AS regra, t.ENFORCED AS enforced
        FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t
        ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME
        WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='conta_pessoa' AND c.CONSTRAINT_NAME='labhist_cp_perfil'`);
    const normalizar = v => v.toLowerCase().replace(/_utf8mb4|[\s\x60()\\]/g,'');
    const esperado = "perfil='aluno'andaluno_idisnotnullandprofessor_idisnullorperfil='professor'andprofessor_idisnotnullandaluno_idisnull";
    if (checks.length!==1 || checks[0].enforced!=='YES' || normalizar(checks[0].regra)!==esperado) throw new ErroIntegridade('Regra de perfil da identidade ausente ou incompativel.');
}
