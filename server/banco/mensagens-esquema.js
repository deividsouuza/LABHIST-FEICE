import {restricaoAplicada,ErroIntegridade} from './integridade-projetos.js';
export async function verificarMensagens(banco){
    for(const [tabela,coluna,referencia] of [
        ['mensagem_conversa','professor_conta_id','usuarios'],['mensagem_conversa','aluno_conta_id','usuarios'],
        ['mensagem_conversa','professor_id','professor'],['mensagem_conversa','aluno_id','aluno'],
        ['mensagem','conversa_id','mensagem_conversa'],['mensagem','remetente_id','usuarios'],['mensagem','destinatario_id','usuarios']
    ])if(!await restricaoAplicada(banco,{tipo:'fk',tabela,coluna,referencia}))throw new ErroIntegridade('FK de mensagens ausente ou incompatível.');
    for(const [tabela,colunas,nome] of [
        ['mensagem_conversa',['professor_conta_id','professor_id','aluno_conta_id','aluno_id'],'labhist_uq_conversa'],
        ['mensagem',['remetente_id','cliente_id'],'labhist_uq_envio']
    ])if(!await restricaoAplicada(banco,{tipo:'unique',tabela,colunas,nome}))throw new ErroIntegridade('Unicidade de mensagens ausente.');
    for(const [tabela,nome,colunas] of [
        ['mensagem_conversa','labhist_conversa_aluno',['aluno_conta_id','aluno_id']],
        ['mensagem','labhist_mensagem_historico',['conversa_id','id']],
        ['mensagem','labhist_mensagem_leitura',['destinatario_id','lida_em','conversa_id','id']]
    ]){
        const [rows]=await banco.query('SELECT COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=? ORDER BY SEQ_IN_INDEX',[tabela,nome]);
        if(rows.map(r=>r.COLUMN_NAME).join(',')!==colunas.join(','))throw new ErroIntegridade('Índice de mensagens ausente ou incompatível.');
    }
    for(const [tabela,nome,esperada] of [
        ['mensagem_conversa','labhist_conversa_distinta','professor_conta_id<>aluno_conta_id'],
        ['mensagem','labhist_mensagem_valida','remetente_id<>destinatario_idandchar_lengthconteudobetween1and4000']
    ]){
        const [rows]=await banco.query(`SELECT c.CHECK_CLAUSE AS regra,t.ENFORCED AS enforced FROM information_schema.CHECK_CONSTRAINTS c JOIN information_schema.TABLE_CONSTRAINTS t ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME WHERE t.TABLE_SCHEMA=DATABASE() AND t.TABLE_NAME=? AND t.CONSTRAINT_NAME=?`,[tabela,nome]);
        if(rows.length!==1||rows[0].enforced!=='YES'||rows[0].regra.toLowerCase().replace(/[\s\x60()]/g,'')!==esperada)throw new ErroIntegridade('Regra de mensagens ausente ou incompatível.');
    }
}
