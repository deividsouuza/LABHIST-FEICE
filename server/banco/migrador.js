import { quizFkAplicada, verificarDisponibilidade } from './quizzes-esquema.js';
import alunosSubprojetos from './versoes/016-alunos-subprojetos.js';
import { tabelas, adicoesLegadas } from './esquema.js';
import { migracoes, versaoEsperada } from './migracoes.js';
import { prepararIntegridade, restricaoAplicada, verificarIntegridade, ErroIntegridade } from './integridade-projetos.js';
import { verificarIdentidades } from './identidade-esquema.js';

export class ErroEsquema extends Error {}
const falhar = mensagem => { throw new ErroEsquema(mensagem); };

async function inspecionar(banco) {
    const [colunas] = await banco.query(`SELECT TABLE_NAME AS tabela, COLUMN_NAME AS coluna,
        DATA_TYPE AS tipo, COLUMN_TYPE AS definicao, CHARACTER_MAXIMUM_LENGTH AS tamanho,
        IS_NULLABLE AS nulo, COLUMN_KEY AS chave, EXTRA AS extra, COLUMN_DEFAULT AS padrao
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`);
    const [engines] = await banco.query('SELECT TABLE_NAME AS tabela, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
    return { colunas, engines };
}

async function validarEstrutura(banco, permitirAusentes = false) {
    const { colunas, engines } = await inspecionar(banco);
    for (const [tabela, campos] of Object.entries(tabelas)) {
        const engine = engines.find(t => t.tabela === tabela);
        if (!engine) { if (permitirAusentes) continue; falhar(`Tabela ausente: ${tabela}. Execute db:migrate.`); }
        if (engine.engine !== 'InnoDB') falhar(`Tabela incompatível: ${tabela}; esperado InnoDB.`);
        for (const [coluna, definicao] of Object.entries(campos)) {
            const atual = colunas.find(c => c.tabela === tabela && c.coluna === coluna);
            if (!atual) {
                if (permitirAusentes && adicoesLegadas.some(([t, c]) => t === tabela && c === coluna)) continue;
                falhar(`Coluna ausente: ${tabela}.${coluna}.`);
            }
            const esperado = definicao.match(/^(INT|VARCHAR|TEXT|TIMESTAMP|DATETIME|DATE|DOUBLE)(?:\((\d+)\))?/);
            const tipo = esperado[1].toLowerCase();
            if (atual.tipo !== tipo || (tipo === 'varchar' && Number(atual.tamanho) < Number(esperado[2])) ||
                (definicao.includes('NOT NULL') && atual.nulo !== 'NO') ||
                (tipo === 'int' && /unsigned/i.test(atual.definicao)) ||
                (tabela==='contatos_recuperacao'&&coluna==='usuario_id'&&atual.chave!=='PRI') ||
                (tabela==='recuperacao_senha'&&coluna==='token_hash'&&atual.chave!=='UNI') ||
                (tabela==='sessoes'&&coluna==='sid'&&atual.chave!=='PRI') ||
                (coluna === 'autoria_confirmada' && String(atual.padrao)!=='0') ||
                (tabela === 'projeto' && coluna === 'status' && atual.padrao!==null) ||
                (coluna === 'id' && (atual.chave !== 'PRI' || !atual.extra.includes('auto_increment'))) ||
                (definicao.includes(' NULL') && !definicao.includes('NOT NULL') && atual.nulo === 'NO' && !['created_at', 'updated_at', 'enviado_em', 'enviado_por_perfil'].includes(coluna))) {
                falhar(`Coluna incompatível: ${tabela}.${coluna}; revisão explícita necessária.`);
            }
        }
    }
}

async function lerHistorico(banco, aceitarAusente = false) {
    const [existe] = await banco.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations'");
    if (!existe.length) {
        if (aceitarAusente) return [];
        falhar('Histórico de migrações ausente. Execute db:migrate antes de iniciar.');
    }
    const [rows] = await banco.query('SELECT versao, nome, checksum FROM schema_migrations ORDER BY versao');
    rows.forEach((row, i) => {
        const esperada = migracoes[i];
        if (!esperada || row.versao !== esperada.versao || row.nome !== esperada.nome || row.checksum !== esperada.checksum) {
            falhar('Histórico/versão de esquema incompatível. Não alterar versões já aplicadas.');
        }
    });
    return rows;
}

export async function verificarEsquema(banco) {
    const historico = await lerHistorico(banco);
    if (historico.length !== migracoes.length) falhar(`Esquema desatualizado; esperado versão ${versaoEsperada}. Execute db:migrate.`);
    await validarEstrutura(banco);
    await verificarIntegridade(banco);
    await verificarIdentidades(banco);
    await verificarSubprojetos(banco);
    await verificarStatusProjetos(banco);
    await verificarQuizzes(banco);
    await verificarAutoria(banco);
    await verificarRecuperacao(banco);
    await verificarDisponibilidade(banco);
    await verificarResultados(banco);
    await verificarAlunosSubprojetos(banco);
    return { versao: versaoEsperada };
}

// Conexão dedicada; GET_LOCK serializa executores. DDL MySQL tem commit implícito:
// cada passo pode ser repetido após falha, e a versão só é registrada ao terminar.
export async function executarMigracoes(banco, ate = versaoEsperada) {
    if (!Number.isInteger(ate) || ate < 1 || ate > versaoEsperada) falhar('Versão de destino inválida.');
    const [[lock]] = await banco.query("SELECT GET_LOCK(SHA2(CONCAT('labhist:', DATABASE()), 256), 0) AS obtido");
    if (lock.obtido !== 1) falhar('Outra migração está em execução.');
    try {
        const historico = await lerHistorico(banco, true);
        if (historico.length > ate) falhar('Downgrade de esquema não permitido.');
        await validarEstrutura(banco, true); // Diagnóstico antes do primeiro DDL.
        await banco.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            versao INT NOT NULL PRIMARY KEY, nome VARCHAR(100) NOT NULL,
            checksum CHAR(64) NOT NULL, aplicado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`);
        const aplicadas = [];
        for (const migracao of migracoes.filter(m => m.versao > historico.length && m.versao <= ate)) {
            if (migracao.versao === 3) await prepararIntegridade(banco);
            for (const passo of migracao.passos) {
                if(passo.check){
                    const [checks]=await banco.query('SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME=? AND CONSTRAINT_TYPE=\'CHECK\'',[passo.checkTabela||'projeto',passo.check]);
                    if(checks.length)continue;
                }
                if(passo.quizFk && await quizFkAplicada(banco,passo))continue;
                if (passo.tipo && await restricaoAplicada(banco, passo)) continue;
                if (passo.coluna && !passo.tipo) {
                    const [existente] = await banco.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [passo.tabela, passo.coluna]);
                    if (existente.length) continue;
                }
                await banco.query(passo.sql);
            }
            if (migracao.versao === versaoEsperada) await validarEstrutura(banco);
            if (migracao.versao === 3) await verificarIntegridade(banco);
            if (migracao.versao === 4) await verificarIdentidades(banco);
            if (migracao.versao === 7) await verificarSubprojetos(banco);
            if (migracao.versao === 8) await verificarStatusProjetos(banco);
            if (migracao.versao === 9) await verificarQuizzes(banco);
            if (migracao.versao === 11) await verificarAutoria(banco);
            if (migracao.versao === 13) await verificarRecuperacao(banco);
            if (migracao.versao === 14) await verificarDisponibilidade(banco);
            if (migracao.versao === 15) await verificarResultados(banco);
            if (migracao.versao === 16) await verificarAlunosSubprojetos(banco);
            await banco.query('INSERT INTO schema_migrations (versao, nome, checksum) VALUES (?, ?, ?)', [migracao.versao, migracao.nome, migracao.checksum]);
            aplicadas.push(migracao.versao);
        }
        if (ate === versaoEsperada) await verificarEsquema(banco);
        return { versao: ate, aplicadas };
    } finally {
        await banco.query("SELECT RELEASE_LOCK(SHA2(CONCAT('labhist:', DATABASE()), 256))");
    }
}

async function verificarSubprojetos(banco) {
    if(!await restricaoAplicada(banco,{tipo:'fk',tabela:'subprojeto',coluna:'projeto_id',referencia:'projeto'}))falhar('FK de subprojeto ausente.');
}

async function verificarAlunosSubprojetos(banco){
    if(!await restricaoAplicada(banco,{tipo:'unique',tabela:'subprojeto_aluno',colunas:['subprojeto_id','aluno_id'],nome:'PRIMARY'}))falhar('Unicidade de aluno no subprojeto ausente.');
    for(const p of alunosSubprojetos.passos.filter(p=>p.quizFk))if(!await quizFkAplicada(banco,p))falhar('FK de aluno no subprojeto ausente.');
}

async function verificarQuizzes(banco){
    for(const [tabela,coluna,referencia] of [['quiz_pergunta','quiz_id','quiz'],['quiz_alternativa','pergunta_id','quiz_pergunta']]){
        if(!await restricaoAplicada(banco,{tipo:'fk',tabela,coluna,referencia}))falhar('FK de quiz ausente ou incompativel.');
    }
    const [checks]=await banco.query(`SELECT c.CHECK_CLAUSE AS regra,t.ENFORCED AS enforced
        FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t
        ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME
        WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='quiz_alternativa' AND c.CONSTRAINT_NAME='labhist_quiz_correta'`);
    if(checks.length!==1||checks[0].enforced!=='YES'||checks[0].regra.toLowerCase().replace(/[\s\x60()]/g,'')!=='corretain0,1')falhar('Regra de alternativa correta ausente ou incompativel.');
}

async function verificarStatusProjetos(banco) {
    const [checks]=await banco.query(`SELECT c.CHECK_CLAUSE AS regra,t.ENFORCED AS enforced
        FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t
        ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME
        WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='projeto' AND c.CONSTRAINT_NAME='labhist_status_projeto'`);
    const normalizar=v=>v.toLowerCase().replace(/_utf8mb4|[\s\x60()\\]/g,'');
    if(checks.length!==1||checks[0].enforced!=='YES'||normalizar(checks[0].regra)!=="statusin'finalizado','emandamento','cancelado'")falhar('Regra de status do projeto ausente ou incompativel.');
}

export function diagnosticoBanco(erro) {
    if (erro instanceof ErroEsquema || erro instanceof ErroIntegridade) return erro.message;
    const mensagens = {
        ER_ACCESS_DENIED_ERROR: 'Acesso ao banco negado. Confira as credenciais localmente.',
        ER_DBACCESS_DENIED_ERROR: 'Permissão de acesso ao banco negada.',
        ER_TABLEACCESS_DENIED_ERROR: 'Permissão SQL insuficiente para a operação.',
        ER_SPECIFIC_ACCESS_DENIED_ERROR: 'Permissão SQL insuficiente para a operação.',
        ER_BAD_DB_ERROR: 'Banco ausente. Crie o banco antes de executar.',
        ECONNREFUSED: 'Banco indisponível. Confira host e porta localmente.'
    };
    return mensagens[erro?.code] || 'Falha ao verificar/aplicar esquema. Confira permissões e compatibilidade; detalhes SQL omitidos.';
}

async function verificarAutoria(banco){if(!await restricaoAplicada(banco,{tipo:'fk',tabela:'documentos',coluna:'autor_conta_id',referencia:'usuarios'}))falhar('FK de autoria ausente ou incompatível.');}

async function verificarRecuperacao(banco){for(const tabela of ['contatos_recuperacao','recuperacao_senha'])if(!await restricaoAplicada(banco,{tipo:'fk',tabela,coluna:'usuario_id',referencia:'usuarios'}))falhar('FK de recuperação ausente ou incompatível.');}

async function verificarResultados(banco){
    for(const [tabela,coluna,referencia] of [['quiz_resultado','quiz_id','quiz'],['quiz_resultado','aluno_id','aluno'],['quiz_resultado','conta_id','usuarios'],['quiz_resposta','resultado_id','quiz_resultado'],['quiz_resposta','pergunta_id','quiz_pergunta'],['quiz_resposta','alternativa_id','quiz_alternativa']])if(!await restricaoAplicada(banco,{tipo:'fk',tabela,coluna,referencia}))falhar('FK de resposta/resultado ausente ou incompatível.');
    for(const [tabela,colunas,nome] of [['quiz_resultado',['quiz_id','aluno_id'],'labhist_uq_tentativa'],['quiz_resposta',['resultado_id','pergunta_id'],'labhist_uq_resposta']])if(!await restricaoAplicada(banco,{tipo:'unique',tabela,colunas,nome}))falhar('Unicidade de tentativa/resposta ausente.');
    const [rows]=await banco.query(`SELECT c.CHECK_CLAUSE AS regra,t.ENFORCED AS enforced FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME='quiz_resultado' AND t.CONSTRAINT_NAME='labhist_quiz_resultado_valido'`);
    if(rows.length!==1||rows[0].enforced!=='YES'||rows[0].regra.toLowerCase().replace(/[\s\x60()]/g,'')!=='pontuacao>=0andtotal_perguntas>=1andpontuacao<=total_perguntasandpercentual>=0andpercentual<=100')falhar('Regra de resultado ausente ou incompatível.');
}
