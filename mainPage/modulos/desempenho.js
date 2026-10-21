// desempenho: responsabilidades e dependências em ../MODULOS.md.
let resultadosProfessorSequencia=0;
let historicoAlunoSequencia=0;
function resumoResultadoQuiz(r){
    const artigo=elementoQuiz('article','quiz-historico-item');artigo.dataset.resultadoId=String(r.id);
    artigo.append(elementoQuiz('h3','texto-projeto',r.quiz_titulo),elementoQuiz('p','','Pontuação: '+r.pontuacao+' de '+r.total_perguntas),elementoQuiz('p','','Percentual de acertos: '+new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(r.percentual)+'%'),elementoQuiz('p','','Concluído em '+new Date(r.concluido_em).toLocaleString('pt-BR')));return artigo;
}
async function showHistoricoAluno(){
    if(perfilAtual()!=='aluno')return;hideAll();closeSidebar();const seq=historicoAlunoSequencia,lista=document.getElementById('historicoAlunoLista'),aviso=document.getElementById('historicoAlunoAviso');
    document.getElementById('historicoAluno').style.display='block';document.getElementById('breadcrumbCurrent').textContent='Meu desempenho';lista.replaceChildren();aviso.textContent='Carregando histórico...';
    try{const dados=(await apiFetch(API+'/aluno/resultados')).dados;if(!Array.isArray(dados))formatoInvalido();dados.forEach(r=>validarResultadoQuiz(r,r.quiz_id));if(seq!==historicoAlunoSequencia)return;
        aviso.textContent=dados.length?'':'Você ainda não possui resultados registrados.';dados.forEach(r=>lista.append(resumoResultadoQuiz(r)));
    }catch(erro){if(seq!==historicoAlunoSequencia||erro.sessaoExpirada)return;aviso.textContent='Não foi possível carregar seu histórico. Tente atualizar.';}
}

function limparResultadosProfessor(){
    resultadosProfessorSequencia++;document.getElementById('resultadosProfessor').style.display='none';document.getElementById('resultadosProfessorLista').replaceChildren();document.getElementById('resultadosProfessorAviso').textContent='';
}
function validarResultadoAcompanhado(r){validarResultadoQuiz(r,r.quiz_id);if(!r.aluno||!Number.isInteger(r.aluno.id)||r.aluno.id<=0||typeof r.aluno.nome!=='string')formatoInvalido();return r;}
async function showResultadosProfessor(){
    if(perfilAtual()!=='professor')return;hideAll();closeSidebar();const seq=resultadosProfessorSequencia,lista=document.getElementById('resultadosProfessorLista'),aviso=document.getElementById('resultadosProfessorAviso');
    document.getElementById('resultadosProfessor').style.display='block';document.getElementById('breadcrumbCurrent').textContent='Resultados acompanhados';lista.replaceChildren();aviso.textContent='Carregando resultados...';
    try{const dados=(await apiFetch(API+'/professor/resultados')).dados;if(!Array.isArray(dados))formatoInvalido();dados.forEach(validarResultadoAcompanhado);if(seq!==resultadosProfessorSequencia)return;
        aviso.textContent=dados.length?'':'Nenhum resultado acompanhado disponível.';dados.forEach(r=>{const artigo=resumoResultadoQuiz(r);artigo.prepend(elementoQuiz('p','','Aluno: '+r.aluno.nome));const b=elementoQuiz('button','btn-ghost','Ver questões respondidas');b.type='button';b.onclick=()=>abrirResultadoProfessor(r.id);artigo.append(b);lista.append(artigo);});
    }catch(erro){if(seq!==resultadosProfessorSequencia||erro.sessaoExpirada)return;aviso.textContent='Não foi possível carregar os resultados. Tente atualizar.';}
}
async function abrirResultadoProfessor(id){
    if(perfilAtual()!=='professor')return;hideAll();closeSidebar();const seq=resultadosProfessorSequencia,lista=document.getElementById('resultadosProfessorLista'),aviso=document.getElementById('resultadosProfessorAviso');
    document.getElementById('resultadosProfessor').style.display='block';lista.replaceChildren();aviso.textContent='Carregando questões...';
    try{const r=validarResultadoAcompanhado((await apiFetch(API+'/professor/resultados/'+id)).dados);if(r.id!==id||!Array.isArray(r.respostas)||r.respostas.length!==r.total_perguntas||r.respostas.some(x=>!x.pergunta||!x.alternativa||!Number.isInteger(x.pergunta.id)||!Number.isInteger(x.alternativa.id)||typeof x.pergunta.descricao!=='string'||typeof x.alternativa.descricao!=='string'))formatoInvalido();if(seq!==resultadosProfessorSequencia)return;
        const artigo=resumoResultadoQuiz(r);artigo.prepend(elementoQuiz('p','','Aluno: '+r.aluno.nome));r.respostas.forEach(x=>{const sec=elementoQuiz('section');sec.append(elementoQuiz('h4','texto-projeto',x.pergunta.descricao),elementoQuiz('p','texto-projeto','Resposta escolhida: '+x.alternativa.descricao));artigo.append(sec);});lista.append(artigo);aviso.textContent='';
    }catch(erro){if(seq!==resultadosProfessorSequencia||erro.sessaoExpirada)return;aviso.textContent='Não foi possível consultar este resultado. Atualize a lista para verificar o acesso atual.';}
}
