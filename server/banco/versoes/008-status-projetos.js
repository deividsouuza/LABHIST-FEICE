export default {
    versao:8,nome:'status-projetos',passos:[
        {tabela:'projeto',coluna:'status',sql:'ALTER TABLE projeto ADD COLUMN status VARCHAR(20) NULL DEFAULT NULL'},
        {check:'labhist_status_projeto',sql:"ALTER TABLE projeto ADD CONSTRAINT labhist_status_projeto CHECK (status IN ('finalizado','em andamento','cancelado'))"}
    ]
};
