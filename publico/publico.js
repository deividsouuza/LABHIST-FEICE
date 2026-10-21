let sequenciaPublica=0;
const el=id=>document.getElementById(id);
function validarProjetoPublico(p){
    if(!p||!Number.isInteger(p.id)||p.id<=0||typeof p.titulo!=='string'||typeof p.descricao!=='string'||typeof p.objetivo!=='string'||(p.status!==null&&!['em andamento','finalizado','cancelado'].includes(p.status)))throw new Error('Formato inválido');return p;
}
async function consultarPublico(caminho){
    const r=await fetch(origemApi()+'/publico/projetos'+caminho,{credentials:'omit',cache:'no-store'});
    if(!r.ok)throw new Error(r.status===404?'Projeto não encontrado. Atualize a lista.':'Não foi possível carregar os projetos. Tente novamente.');return r.json();
}
async function listarProjetosPublicos(){
    const seq=++sequenciaPublica;el('projetoDetalhe').hidden=true;el('projetos').hidden=false;el('projetosLista').replaceChildren();el('projetosAviso').textContent='Carregando projetos...';
    try{const dados=await consultarPublico('');if(!Array.isArray(dados))throw new Error('Resposta inválida. Tente novamente.');dados.forEach(validarProjetoPublico);if(seq!==sequenciaPublica)return;
        el('projetosAviso').textContent=dados.length?'':'Nenhum projeto disponível.';
        for(const p of dados){const card=document.createElement('article'),titulo=document.createElement('h3'),descricao=document.createElement('p'),botao=document.createElement('button');card.className='projeto-card';titulo.textContent=p.titulo;descricao.textContent=p.descricao||'Sem descrição';botao.type='button';botao.textContent='Ver projeto';botao.onclick=()=>abrirProjetoPublico(p.id);card.append(titulo,descricao,botao);el('projetosLista').append(card);}
    }catch(e){if(seq===sequenciaPublica)el('projetosAviso').textContent=e instanceof SyntaxError?'Resposta inválida. Tente novamente.':e.message;}
}
async function abrirProjetoPublico(id){
    if(!Number.isInteger(id)||id<=0)return;const seq=++sequenciaPublica;el('projetosAviso').textContent='Carregando projeto...';
    try{const p=validarProjetoPublico(await consultarPublico('/'+id));if(p.id!==id)throw new Error('Resposta inválida.');if(seq!==sequenciaPublica)return;
        el('projetoTitulo').textContent=p.titulo;el('projetoDescricao').textContent=p.descricao||'Sem descrição';el('projetoObjetivo').textContent=p.objetivo||'Sem objetivo informado';el('projetoStatus').textContent=p.status||'Não informado';el('projetosAviso').textContent='';el('projetos').hidden=true;el('projetoDetalhe').hidden=false;el('projetoDetalhe').scrollIntoView();
    }catch(e){if(seq===sequenciaPublica)el('projetosAviso').textContent=e instanceof SyntaxError?'Resposta inválida. Tente novamente.':e.message;}
}
el('projetosRecarregar').onclick=listarProjetosPublicos;el('projetoVoltar').onclick=listarProjetosPublicos;
listarProjetosPublicos();

let sequenciaQuizPublico=0;
function validarIntroducaoPublica(q){if(!q||!Number.isInteger(q.id)||q.id<=0||typeof q.titulo!=='string'||typeof q.descricao!=='string')throw new Error('Resposta inválida. Tente novamente.');return q;}
async function consultarQuizPublico(caminho=''){const r=await fetch(origemApi()+'/publico/quizzes'+caminho,{credentials:'omit',cache:'no-store'});if(!r.ok)throw new Error(r.status===404?'Quiz indisponível. Atualize o catálogo.':'Não foi possível carregar os quizzes. Tente novamente.');return r.json();}
async function listarQuizzesPublicos(){
    const seq=++sequenciaQuizPublico;el('quizPublicoDetalhe').hidden=true;el('quizzesPublicosLista').hidden=false;el('quizzesPublicosLista').replaceChildren();el('quizzesPublicosAviso').textContent='Carregando quizzes...';
    try{const dados=await consultarQuizPublico();if(!Array.isArray(dados))throw new Error('Resposta inválida.');dados.forEach(validarIntroducaoPublica);if(seq!==sequenciaQuizPublico)return;el('quizzesPublicosAviso').textContent=dados.length?'':'Nenhum quiz público disponível.';
        for(const q of dados){const b=document.createElement('button');b.type='button';b.className='quiz-publico-item';b.textContent=q.titulo;b.onclick=()=>abrirQuizPublico(q.id);el('quizzesPublicosLista').append(b);}
    }catch(e){if(seq===sequenciaQuizPublico)el('quizzesPublicosAviso').textContent=e instanceof SyntaxError?'Resposta inválida. Tente novamente.':e.message;}
}
async function abrirQuizPublico(id){
    if(!Number.isInteger(id)||id<=0)return;const seq=++sequenciaQuizPublico;
    try{const q=validarIntroducaoPublica(await consultarQuizPublico('/'+id));if(q.id!==id)throw new Error('Resposta inválida.');if(seq!==sequenciaQuizPublico)return;el('quizPublicoTitulo').textContent=q.titulo;el('quizPublicoDescricao').textContent=q.descricao||'Sem introdução';el('quizPublicoDetalhe').hidden=false;el('quizzesPublicosLista').hidden=true;el('quizzesPublicosAviso').textContent='';}
    catch(e){if(seq===sequenciaQuizPublico)el('quizzesPublicosAviso').textContent=e instanceof SyntaxError?'Resposta inválida. Tente novamente.':e.message;}
}
el('quizzesPublicosAbrir').onclick=listarQuizzesPublicos;el('quizzesPublicosCarregar').onclick=listarQuizzesPublicos;el('quizPublicoVoltar').onclick=listarQuizzesPublicos;
