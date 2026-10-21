// quizzes: responsabilidades e dependências em ../MODULOS.md.
let quizAlunoAtivo=null,quizAlunoEnviando=false;
let catalogoQuizSequencia=0,catalogoQuizId=null;
let quizDisponibilidadeId=null,quizDisponibilidadeEnviando=false,quizSubprojetoSequencia=0,quizSubprojetoCarregando=false,quizDisponibilidadePronta=false;
let quizSequencia=0,quizEnviando=false,quizPerguntaChave=0,quizEditandoId=null,quizDetalheId=null,quizExcluindo=false;

function elementoQuiz(tag,classe='',texto=''){
    const el=document.createElement(tag);el.className=classe;el.textContent=texto;return el;
}
function renumerarPerguntasQuiz(){
    Array.from(document.getElementById('quizPerguntas').children).forEach((p,i)=>p.querySelector('legend').textContent='Pergunta '+(i+1));
}
function adicionarAlternativaQuiz(bloco,chave){
    if(perfilAtual()!=='administrador'||quizEnviando)return;
    const lista=bloco.querySelector('.quiz-alternativas');if(lista.children.length>=20){bloco.querySelector('.quiz-pergunta-erro').textContent='Limite de 20 alternativas por pergunta.';return;}
    const linha=elementoQuiz('div','quiz-alternativa'),rotulo=elementoQuiz('label','','Correta'),radio=document.createElement('input');
    radio.type='radio';radio.name='quiz-correta-'+chave;radio.className='quiz-correta';rotulo.prepend(radio);
    const texto=elementoQuiz('textarea','form-input quiz-alternativa-texto');texto.rows=2;texto.setAttribute('aria-label','Texto da alternativa');
    const remover=elementoQuiz('button','btn-ghost','Remover');remover.type='button';remover.onclick=()=>{if(!quizEnviando){linha.remove();document.getElementById('quizRevisao').replaceChildren();}};
    const erro=elementoQuiz('small','quiz-erro quiz-alternativa-erro');linha.append(rotulo,texto,remover,erro);lista.appendChild(linha);return linha;
}
function adicionarPerguntaQuiz(){
    if(perfilAtual()!=='administrador'||quizEnviando)return;
    const lista=document.getElementById('quizPerguntas');if(lista.children.length>=50){document.getElementById('quizFormAviso').textContent='Limite de 50 perguntas.';return;}
    const chave=++quizPerguntaChave,bloco=elementoQuiz('fieldset','quiz-pergunta'),legenda=elementoQuiz('legend'),rotulo=elementoQuiz('label','form-label','Texto da pergunta');
    const texto=elementoQuiz('textarea','form-input quiz-pergunta-texto');texto.id='quiz-pergunta-'+chave;texto.rows=3;rotulo.htmlFor=texto.id;
    const alternativas=elementoQuiz('div','quiz-alternativas'),erro=elementoQuiz('small','quiz-erro quiz-pergunta-erro');
    const adicionar=elementoQuiz('button','btn-ghost','+ Alternativa');adicionar.type='button';adicionar.onclick=()=>adicionarAlternativaQuiz(bloco,chave);
    const remover=elementoQuiz('button','btn-ghost','Remover pergunta');remover.type='button';remover.onclick=()=>{if(!quizEnviando){bloco.remove();renumerarPerguntasQuiz();document.getElementById('quizRevisao').replaceChildren();}};
    bloco.append(legenda,rotulo,texto,erro,alternativas,adicionar,remover);lista.appendChild(bloco);adicionarAlternativaQuiz(bloco,chave);adicionarAlternativaQuiz(bloco,chave);renumerarPerguntasQuiz();
    bloco.addEventListener('input',()=>document.getElementById('quizRevisao').replaceChildren());return bloco;
}
function novoQuiz(){
    if(perfilAtual()!=='administrador'||quizEnviando)return;
    hideAll();document.getElementById('quizFormTitulo').textContent='Criar quiz';document.getElementById('quizSalvar').textContent='Cadastrar quiz';for(const id of ['quizTitulo','quizDescricao'])document.getElementById(id).value='';
    for(const id of ['quizPerguntas','quizRevisao','quizFormAviso','quizTituloErro','quizDescricaoErro'])document.getElementById(id).replaceChildren();
    document.getElementById('formQuiz').style.display='block';document.getElementById('childQuizzes').classList.add('active');document.getElementById('breadcrumbCurrent').textContent='Criar quiz';adicionarPerguntaQuiz();
}
function capturarQuiz(){
    let valido=true;
    document.querySelectorAll('#quizCampos .quiz-erro').forEach(el=>el.textContent='');
    const validar=(input,erro,obrigatorio,curto=false)=>{
        const t=input.value.trim(),ruim=(obrigatorio&&!t)||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(t)||(curto?(Array.from(t).length>255||/[\r\n\t]/.test(t)):new TextEncoder().encode(t).length>65535);
        if(ruim){erro.textContent=curto?'Informe título de 1 a 255 caracteres.':'Confira o texto (até 65535 bytes UTF-8).';valido=false;}return t;
    };
    const dados={titulo:validar(document.getElementById('quizTitulo'),document.getElementById('quizTituloErro'),true,true),descricao:validar(document.getElementById('quizDescricao'),document.getElementById('quizDescricaoErro'),false),perguntas:[]};
    const blocos=Array.from(document.getElementById('quizPerguntas').children);if(!blocos.length||blocos.length>50)valido=false;
    for(const bloco of blocos){
        const erro=bloco.querySelector('.quiz-pergunta-erro'),p={descricao:validar(bloco.querySelector('.quiz-pergunta-texto'),erro,true),alternativas:[]};
        if(bloco.dataset.id)p.id=Number(bloco.dataset.id);
        for(const linha of bloco.querySelector('.quiz-alternativas').children){const a={descricao:validar(linha.querySelector('.quiz-alternativa-texto'),linha.querySelector('.quiz-alternativa-erro'),true),correta:linha.querySelector('.quiz-correta').checked};if(linha.dataset.id)a.id=Number(linha.dataset.id);p.alternativas.push(a);}
        if(p.alternativas.length<2||p.alternativas.length>20||p.alternativas.filter(a=>a.correta).length!==1){erro.textContent='Use 2 a 20 alternativas e marque exatamente uma correta.';valido=false;}
        dados.perguntas.push(p);
    }
    document.getElementById('quizFormAviso').textContent=valido?'':'Confira os campos indicados e inclua ao menos uma pergunta.';return valido?dados:null;
}
function renderEstruturaQuiz(container,dados){
    container.replaceChildren();container.appendChild(elementoQuiz('p','texto-projeto',dados.descricao||'Sem descrição'));
    dados.perguntas.forEach((p,i)=>{
        container.appendChild(elementoQuiz('h3','texto-projeto',`${i+1}. ${p.descricao}`));const lista=elementoQuiz('ul');
        for(const a of p.alternativas)lista.appendChild(elementoQuiz('li','texto-projeto',a.descricao+(a.correta?' (correta)':'')));container.appendChild(lista);
    });
}
function revisarQuiz(){
    if(perfilAtual()!=='administrador')return;
    const dados=capturarQuiz();if(dados)renderEstruturaQuiz(document.getElementById('quizRevisao'),dados);
}
function validarQuizResposta(q){
    if(!q||!Number.isInteger(q.id)||q.id<=0||typeof q.titulo!=='string'||typeof q.descricao!=='string'||!Array.isArray(q.perguntas)||!q.perguntas.length)formatoInvalido();
    const pids=new Set(),aids=new Set();
    for(const p of q.perguntas){
        if(!p||!Number.isInteger(p.id)||p.id<=0||pids.has(p.id)||typeof p.descricao!=='string'||!Array.isArray(p.alternativas)||p.alternativas.length<2)formatoInvalido();pids.add(p.id);
        for(const a of p.alternativas){if(!a||!Number.isInteger(a.id)||a.id<=0||aids.has(a.id)||typeof a.descricao!=='string'||typeof a.correta!=='boolean')formatoInvalido();aids.add(a.id);}
        if(p.alternativas.filter(a=>a.correta).length!==1)formatoInvalido();
    }return q;
}
async function showQuizzes(){
    if(perfilAtual()!=='administrador')return;
    hideAll();const seq=quizSequencia,lista=document.getElementById('quizLista');document.getElementById('listQuizzes').style.display='block';document.getElementById('childQuizzes').classList.add('active');document.getElementById('breadcrumbCurrent').textContent='Quizzes';lista.textContent='Carregando...';
    if(window.innerWidth<=768)closeSidebar();
    try{
        const dados=(await apiFetch(`${API}/quizzes`)).dados;
        if(!Array.isArray(dados)||dados.some(q=>!q||!Number.isInteger(q.id)||q.id<=0||typeof q.titulo!=='string'))formatoInvalido();if(seq!==quizSequencia)return;
        lista.replaceChildren();if(!dados.length)lista.textContent='Nenhum quiz cadastrado.';
        for(const q of dados){const botao=elementoQuiz('button','list-item subprojeto-item',q.titulo);botao.type='button';botao.onclick=()=>abrirQuiz(q.id);lista.appendChild(botao);}
    }catch(erro){if(seq!==quizSequencia||erro.sessaoExpirada)return;lista.textContent='Não foi possível carregar os quizzes.';mostrarErro(erro);}
}
async function abrirQuiz(id){
    if(perfilAtual()!=='administrador'||!Number.isInteger(id)||id<=0)return;
    const seq=++quizSequencia;
    try{const q=validarQuizResposta((await apiFetch(`${API}/quizzes/${id}`)).dados);if(q.id!==id)formatoInvalido();if(seq!==quizSequencia)return;
        hideAll();quizDetalheId=id;document.getElementById('quizDetalheAviso').textContent='';document.getElementById('detalheQuiz').style.display='block';document.getElementById('childQuizzes').classList.add('active');document.getElementById('quizDetalheTitulo').textContent=q.titulo;document.getElementById('breadcrumbCurrent').textContent=q.titulo;renderEstruturaQuiz(document.getElementById('quizDetalheCorpo'),q);return true;
    }catch(erro){if(seq!==quizSequencia||erro.sessaoExpirada)return;mostrarErro(erro);}
}
async function excluirQuiz(id=quizDetalheId){
    if(perfilAtual()!=='administrador'||quizExcluindo||quizEnviando||!Number.isInteger(id)||id!==quizDetalheId)return;
    const titulo=document.getElementById('quizDetalheTitulo').textContent;
    if(!confirm('Excluir o quiz “'+titulo+'”? Quizzes com histórico não podem ser excluídos.'))return;
    const seq=quizSequencia,botao=document.getElementById('quizExcluir');quizExcluindo=true;botao.disabled=true;
    try{confirmarOperacao(await apiFetch(API+'/quizzes/'+id,{method:'DELETE'}));if(seq!==quizSequencia)return;await showQuizzes();}
    catch(erro){if(seq!==quizSequencia||erro.sessaoExpirada)return;document.getElementById('quizDetalheAviso').textContent=erro.status===409?'Exclusão bloqueada por histórico ou dependentes protegidos. O quiz foi mantido.':'Não foi possível confirmar a exclusão. O quiz foi mantido.';mostrarErro(erro);}
    finally{quizExcluindo=false;botao.disabled=false;}
}
async function editarQuiz(id=quizDetalheId){
    if(perfilAtual()!=='administrador'||quizEnviando||!Number.isInteger(id)||id<=0)return;
    const seq=++quizSequencia;
    try{
        const q=validarQuizResposta((await apiFetch(API+'/quizzes/'+id)).dados);if(q.id!==id)formatoInvalido();if(seq!==quizSequencia)return;
        novoQuiz();quizEditandoId=id;document.getElementById('quizPerguntas').replaceChildren();
        document.getElementById('quizFormTitulo').textContent='Editar quiz';document.getElementById('quizSalvar').textContent='Salvar alterações';document.getElementById('breadcrumbCurrent').textContent='Editar quiz';
        document.getElementById('quizTitulo').value=q.titulo;document.getElementById('quizDescricao').value=q.descricao;
        for(const p of q.perguntas){
            const bloco=adicionarPerguntaQuiz();bloco.dataset.id=p.id;bloco.querySelector('.quiz-pergunta-texto').value=p.descricao;
            const botao=Array.from(bloco.querySelectorAll('button')).find(b=>b.textContent==='+ Alternativa');
            for(let i=2;i<p.alternativas.length;i++)botao.click();
            Array.from(bloco.querySelector('.quiz-alternativas').children).forEach((linha,i)=>{const a=p.alternativas[i];linha.dataset.id=a.id;linha.querySelector('.quiz-alternativa-texto').value=a.descricao;linha.querySelector('.quiz-correta').checked=a.correta;});
        }
        document.getElementById('quizFormAviso').textContent='A edição é bloqueada quando há respostas, resultados ou dependentes protegidos.';
    }catch(erro){if(seq!==quizSequencia||erro.sessaoExpirada)return;mostrarErro(erro);}
}
async function submitQuiz(){
    if(perfilAtual()!=='administrador'||quizEnviando)return;
    const dados=capturarQuiz();if(!dados)return;
    const editando=quizEditandoId,seq=quizSequencia,campos=Array.from(document.querySelectorAll('#quizCampos input,#quizCampos textarea,#quizCampos button')).map(el=>[el,el.disabled]);
    quizEnviando=true;campos.forEach(([el])=>el.disabled=true);document.getElementById('quizSalvar').disabled=true;document.getElementById('quizFormAviso').textContent='Salvando...';
    try{
        const resultado=confirmarOperacao(await apiFetch(`${API}/quizzes${editando?'/'+editando:''}`,{method:editando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)}));
        if(!editando&&(!Number.isInteger(resultado.id)||resultado.id<=0))formatoInvalido();if(seq!==quizSequencia)return;
        if(editando){const abriu=await abrirQuiz(editando);if(!abriu&&perfilAtual()==='administrador'&&quizEditandoId===editando)document.getElementById('quizFormAviso').textContent='Não foi possível atualizar a visualização. A edição foi preservada; consulte o quiz antes de reenviar.';}else{for(const id of ['quizTitulo','quizDescricao'])document.getElementById(id).value='';document.getElementById('quizPerguntas').replaceChildren();document.getElementById('quizRevisao').replaceChildren();await showQuizzes();}
    }catch(erro){if(seq!==quizSequencia||erro.sessaoExpirada)return;document.getElementById('quizFormAviso').textContent=erro.status===409?'Alteração bloqueada por histórico ou dependentes protegidos. A edição foi preservada.':'Não foi possível confirmar a gravação. O rascunho foi preservado.';mostrarErro(erro);}
    finally{quizEnviando=false;campos.forEach(([el,disabled])=>el.disabled=disabled);document.getElementById('quizSalvar').disabled=false;}
}

// ── CRUD Projeto ──────────────────────────────────────

function limparDisponibilidadeQuiz(){
    quizDisponibilidadeId=null;quizSubprojetoSequencia++;quizDisponibilidadePronta=false;
    for(const id of ['quizProjeto','quizSubprojeto'])document.getElementById(id).replaceChildren();
    document.getElementById('quizPublico').checked=false;document.getElementById('quizEstado').value='rascunho';document.getElementById('quizDisponibilidadeAviso').textContent='';
}
function limparCatalogoQuizzes(){
    limparResultadosProfessor();
    historicoAlunoSequencia++;document.getElementById('historicoAluno').style.display='none';document.getElementById('historicoAlunoLista').replaceChildren();document.getElementById('historicoAlunoAviso').textContent='';
    limparAtividadeQuizAluno();
    catalogoQuizSequencia++;catalogoQuizId=null;
    for(const id of ['catalogoQuizAviso','catalogoQuizLista','alunoQuizTitulo','alunoQuizIntroducao'])document.getElementById(id).replaceChildren();
    for(const id of ['catalogoQuizzesAluno','introducaoQuizAluno'])document.getElementById(id).style.display='none';
}
function limparDadosQuizzes(){
    limparCatalogoQuizzes();
    limparDisponibilidadeQuiz();
    quizSequencia++;quizEditandoId=null;quizDetalheId=null;
    for(const id of ['quizTitulo','quizDescricao'])document.getElementById(id).value='';
    for(const id of ['quizPerguntas','quizRevisao','quizLista','quizDetalheCorpo','quizDetalheTitulo'])document.getElementById(id).replaceChildren();
    for(const id of ['listQuizzes','formQuiz','detalheQuiz'])document.getElementById(id).style.display='none';
    document.getElementById('childQuizzes').classList.remove('active');
}

function opcaoDisponibilidade(select,valor,texto){const o=document.createElement('option');o.value=valor;o.textContent=texto;select.append(o);}
async function carregarSubprojetosDisponibilidade(selecionado=null){
    quizDisponibilidadePronta=false;
    const seq=++quizSubprojetoSequencia,quizId=quizDisponibilidadeId,pai=document.getElementById('quizProjeto').value,select=document.getElementById('quizSubprojeto');
    select.replaceChildren();opcaoDisponibilidade(select,'','Sem subprojeto');quizSubprojetoCarregando=!!pai;select.disabled=true;document.getElementById('quizDisponibilidadeSalvar').disabled=!!pai;
    if(!pai){quizSubprojetoCarregando=false;quizDisponibilidadePronta=true;return;}
    try{const dados=(await apiFetch(API+'/projetos/'+pai+'/subprojetos')).dados;
        if(!Array.isArray(dados)||dados.some(s=>!Number.isInteger(s.id)||s.id<=0||typeof s.titulo!=='string'))formatoInvalido();
        if(seq!==quizSubprojetoSequencia||quizId!==quizDisponibilidadeId)return;
        for(const sub of dados)opcaoDisponibilidade(select,String(sub.id),sub.titulo);
        if(selecionado!==null){select.value=String(selecionado);if(!select.value)formatoInvalido();}select.disabled=false;quizDisponibilidadePronta=true;
    }catch(erro){if(seq!==quizSubprojetoSequencia||erro.sessaoExpirada)return;document.getElementById('quizDisponibilidadeAviso').textContent='Não foi possível carregar os subprojetos. Selecione o projeto novamente.';select.disabled=true;}
    finally{if(seq===quizSubprojetoSequencia){quizSubprojetoCarregando=false;document.getElementById('quizDisponibilidadeSalvar').disabled=!quizDisponibilidadePronta||quizDisponibilidadeEnviando;}}
}
async function abrirDisponibilidadeQuiz(id=quizDetalheId){
    if(perfilAtual()!=='administrador'||quizDisponibilidadeEnviando||!Number.isInteger(id)||id<=0)return;
    const seq=quizSequencia;
    try{
        const [res,projetos]=await Promise.all([apiFetch(API+'/quizzes/'+id+'/disponibilidade'),apiFetch(API+'/projetos')]);const q=res.dados;
        if(!q||q.id!==id||!['rascunho','publicado','arquivado'].includes(q.estado)||typeof q.publico!=='boolean'||['projeto_id','subprojeto_id'].some(k=>q[k]!==null&&(!Number.isInteger(q[k])||q[k]<=0)))formatoInvalido();
        validarLista(projetos.dados,'projeto');if(seq!==quizSequencia)return;
        hideAll();quizDisponibilidadeId=id;document.getElementById('formQuizDisponibilidade').style.display='block';document.getElementById('breadcrumbCurrent').textContent='Vínculo e publicação';
        const select=document.getElementById('quizProjeto');select.replaceChildren();opcaoDisponibilidade(select,'','Sem projeto (rascunho privado)');
        for(const projeto of projetos.dados)opcaoDisponibilidade(select,String(projeto.id),projeto.nome);select.value=q.projeto_id===null?'':String(q.projeto_id);
        if(q.projeto_id!==null&&!select.value)formatoInvalido();document.getElementById('quizEstado').value=q.estado;document.getElementById('quizPublico').checked=q.publico;document.getElementById('quizDisponibilidadeAviso').textContent='';
        await carregarSubprojetosDisponibilidade(q.subprojeto_id);
    }catch(erro){if(!erro.sessaoExpirada)mostrarErro(erro);}
}
async function salvarDisponibilidadeQuiz(){
    if(perfilAtual()!=='administrador'||quizDisponibilidadeEnviando||quizSubprojetoCarregando||!quizDisponibilidadePronta||!quizDisponibilidadeId)return;
    const id=quizDisponibilidadeId,seq=quizSequencia,aviso=document.getElementById('quizDisponibilidadeAviso');
    const p=document.getElementById('quizProjeto').value,sub=document.getElementById('quizSubprojeto').value;
    const dados={projeto_id:p?Number(p):null,subprojeto_id:sub?Number(sub):null,estado:document.getElementById('quizEstado').value,publico:document.getElementById('quizPublico').checked};
    if(!dados.projeto_id&&dados.estado==='publicado'){aviso.textContent='Selecione um projeto para publicar.';return;}
    quizDisponibilidadeEnviando=true;const controles=Array.from(document.getElementById('formQuizDisponibilidade').elements),estados=controles.map(c=>c.disabled);controles.forEach(c=>c.disabled=true);aviso.textContent='Salvando...';
    try{confirmarOperacao(await apiFetch(API+'/quizzes/'+id+'/disponibilidade',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)}));if(seq===quizSequencia)aviso.textContent='Disponibilidade salva.';}
    catch(erro){if(seq===quizSequencia&&!erro.sessaoExpirada)aviso.textContent=erro.status===409?'Edição bloqueada por histórico ou dependentes. Dados preservados.':'Não foi possível confirmar. Dados preservados; consulte antes de tentar novamente.';}
    finally{quizDisponibilidadeEnviando=false;controles.forEach((c,i)=>c.disabled=estados[i]);}
}

function validarIntroducaoQuiz(q){
    if(!q||!Number.isInteger(q.id)||q.id<=0||typeof q.titulo!=='string'||typeof q.descricao!=='string')formatoInvalido();return q;
}
async function showCatalogoQuizzes(){
    if(perfilAtual()!=='aluno')return;
    hideAll();closeSidebar();const seq=catalogoQuizSequencia,lista=document.getElementById('catalogoQuizLista'),aviso=document.getElementById('catalogoQuizAviso');
    document.getElementById('catalogoQuizzesAluno').style.display='block';document.getElementById('breadcrumbCurrent').textContent='Quizzes disponíveis';lista.replaceChildren();aviso.textContent='Carregando...';
    try{const dados=(await apiFetch(API+'/aluno/quizzes')).dados;if(!Array.isArray(dados))formatoInvalido();dados.forEach(validarIntroducaoQuiz);if(seq!==catalogoQuizSequencia)return;
        aviso.textContent=dados.length?'':'Nenhum quiz disponível para seus projetos.';
        for(const q of dados){const b=elementoQuiz('button','list-item subprojeto-item',q.titulo);b.type='button';b.onclick=()=>abrirIntroducaoQuiz(q.id);lista.append(b);}
    }catch(erro){if(seq!==catalogoQuizSequencia||erro.sessaoExpirada)return;aviso.textContent='Não foi possível carregar os quizzes. Tente atualizar o catálogo.';}
}
async function abrirIntroducaoQuiz(id){
    if(perfilAtual()!=='aluno'||!Number.isInteger(id)||id<=0)return;const seq=++catalogoQuizSequencia;
    try{const q=validarIntroducaoQuiz((await apiFetch(API+'/aluno/quizzes/'+id)).dados);if(q.id!==id)formatoInvalido();if(seq!==catalogoQuizSequencia)return;
        hideAll();catalogoQuizId=id;document.getElementById('introducaoQuizAluno').style.display='block';document.getElementById('alunoQuizTitulo').textContent=q.titulo;document.getElementById('alunoQuizIntroducao').textContent=q.descricao||'Sem introdução';document.getElementById('breadcrumbCurrent').textContent=q.titulo;
    }catch(erro){if(seq!==catalogoQuizSequencia||erro.sessaoExpirada)return;mostrarErro(erro);}
}

function limparAtividadeQuizAluno(){
    quizAlunoAtivo=null;document.getElementById('atividadeQuizAluno').style.display='none';
    for(const id of ['atividadeQuizTitulo','atividadeQuizIntroducao','atividadeQuizPerguntas','atividadeQuizAviso','atividadeQuizResultado'])document.getElementById(id).replaceChildren();
    delete document.getElementById('atividadeQuizResultado').dataset.resultadoId;
}
function validarResultadoQuiz(r,quizId){
    if(!r||!Number.isInteger(r.id)||r.id<=0||r.quiz_id!==quizId||typeof r.quiz_titulo!=='string'||!Number.isInteger(r.pontuacao)||!Number.isInteger(r.total_perguntas)||r.total_perguntas<1||r.pontuacao<0||r.pontuacao>r.total_perguntas||!Number.isFinite(r.percentual)||r.percentual<0||r.percentual>100||typeof r.concluido_em!=='string'||!Number.isFinite(Date.parse(r.concluido_em)))formatoInvalido();return r;
}
function validarAtividadeQuiz(q,id){
    validarIntroducaoQuiz(q);if(q.id!==id||!Array.isArray(q.perguntas)||!q.perguntas.length||q.perguntas.length>50||new Set(q.perguntas.map(p=>p.id)).size!==q.perguntas.length)formatoInvalido();
    for(const p of q.perguntas){if(!Number.isInteger(p.id)||p.id<=0||typeof p.descricao!=='string'||!Array.isArray(p.alternativas)||p.alternativas.length<2||p.alternativas.length>20||new Set(p.alternativas.map(a=>a.id)).size!==p.alternativas.length)formatoInvalido();for(const a of p.alternativas)if(!Number.isInteger(a.id)||a.id<=0||typeof a.descricao!=='string'||Object.hasOwn(a,'correta'))formatoInvalido();}
    if(q.resultado!==null)validarResultadoQuiz(q.resultado,id);return q;
}
function mostrarResultadoQuiz(r){
    validarResultadoQuiz(r,quizAlunoAtivo.id);quizAlunoAtivo.resultado=r;
    const area=document.getElementById('atividadeQuizResultado');area.replaceChildren();area.dataset.resultadoId=String(r.id);
    area.append(elementoQuiz('h3','','Resultado registrado'),elementoQuiz('p','','Pontuação: '+r.pontuacao+' de '+r.total_perguntas),elementoQuiz('p','','Percentual de acertos: '+new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(r.percentual)+'%'),elementoQuiz('p','','Concluído em '+new Date(r.concluido_em).toLocaleString('pt-BR')));
    document.querySelectorAll('#atividadeQuizPerguntas input').forEach(i=>i.disabled=true);document.getElementById('atividadeQuizEnviar').disabled=true;
}
async function abrirAtividadeQuiz(id=catalogoQuizId){
    if(perfilAtual()!=='aluno'||!Number.isInteger(id)||id<=0)return;const seq=++catalogoQuizSequencia;
    try{const q=validarAtividadeQuiz((await apiFetch(API+'/aluno/quizzes/'+id+'/atividade')).dados,id);if(seq!==catalogoQuizSequencia)return;
        hideAll();quizAlunoAtivo=q;document.getElementById('atividadeQuizAluno').style.display='block';document.getElementById('atividadeQuizTitulo').textContent=q.titulo;document.getElementById('atividadeQuizIntroducao').textContent=q.descricao;document.getElementById('breadcrumbCurrent').textContent=q.titulo;
        const lista=document.getElementById('atividadeQuizPerguntas');
        for(const [i,p] of q.perguntas.entries()){
            const bloco=elementoQuiz('fieldset','quiz-pergunta');bloco.dataset.perguntaId=String(p.id);bloco.append(elementoQuiz('legend','texto-projeto',(i+1)+'. '+p.descricao));
            for(const a of p.alternativas){const rotulo=elementoQuiz('label','quiz-resposta-opcao'),input=document.createElement('input');input.type='radio';input.name='resposta-quiz-'+p.id;input.value=String(a.id);input.required=true;rotulo.append(input,elementoQuiz('span','',a.descricao));bloco.append(rotulo);}
            bloco.append(elementoQuiz('small','quiz-erro'));lista.append(bloco);
        }
        document.getElementById('atividadeQuizEnviar').disabled=false;document.getElementById('atividadeQuizConsultar').disabled=false;
        if(q.resultado)mostrarResultadoQuiz(q.resultado);
    }catch(erro){if(seq!==catalogoQuizSequencia||erro.sessaoExpirada)return;mostrarErro(erro);}
}
async function enviarRespostasQuiz(){
    if(perfilAtual()!=='aluno'||!quizAlunoAtivo||quizAlunoEnviando||quizAlunoAtivo.resultado)return;
    const respostas=[],aviso=document.getElementById('atividadeQuizAviso');let primeiro=null;
    for(const bloco of document.querySelectorAll('#atividadeQuizPerguntas fieldset')){const marcada=bloco.querySelector('input:checked');bloco.querySelector('.quiz-erro').textContent=marcada?'':'Selecione uma alternativa.';bloco.querySelectorAll('input').forEach(i=>i.setAttribute('aria-invalid',marcada?'false':'true'));if(!marcada)primeiro=primeiro||bloco.querySelector('input');else respostas.push({pergunta_id:Number(bloco.dataset.perguntaId),alternativa_id:Number(marcada.value)});}
    if(primeiro){aviso.textContent='Responda todas as perguntas antes de enviar.';primeiro.focus();return;}
    const id=quizAlunoAtivo.id,seq=catalogoQuizSequencia,controles=Array.from(document.getElementById('atividadeQuizAluno').elements),estados=controles.map(c=>c.disabled);quizAlunoEnviando=true;controles.forEach(c=>c.disabled=true);aviso.textContent='Enviando...';
    try{const res=await apiFetch(API+'/aluno/quizzes/'+id+'/respostas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({respostas})});confirmarOperacao(res);const r=validarResultadoQuiz(res.dados.resultado,id);if(seq!==catalogoQuizSequencia||quizAlunoAtivo?.id!==id)return;mostrarResultadoQuiz(r);aviso.textContent=res.dados.reenvio?'Resultado já estava registrado.':'Respostas e resultado registrados.';}
    catch(erro){if(seq!==catalogoQuizSequencia||erro.sessaoExpirada)return;aviso.textContent=erro.status===409?'Este quiz já foi concluído. Consulte o resultado salvo. Suas seleções foram mantidas.':'Não foi possível confirmar o envio. Suas seleções foram mantidas. Consulte o resultado salvo ou reenvie as mesmas respostas.';}
    finally{quizAlunoEnviando=false;if(seq===catalogoQuizSequencia&&quizAlunoAtivo?.id===id){controles.forEach((c,i)=>c.disabled=estados[i]);if(quizAlunoAtivo.resultado){document.querySelectorAll('#atividadeQuizPerguntas input').forEach(i=>i.disabled=true);document.getElementById('atividadeQuizEnviar').disabled=true;}}}
}
async function consultarResultadoQuiz(){
    if(perfilAtual()!=='aluno'||!quizAlunoAtivo||quizAlunoEnviando)return;const id=quizAlunoAtivo.id,seq=catalogoQuizSequencia,aviso=document.getElementById('atividadeQuizAviso');
    try{const q=validarAtividadeQuiz((await apiFetch(API+'/aluno/quizzes/'+id+'/atividade')).dados,id);if(seq!==catalogoQuizSequencia||quizAlunoAtivo?.id!==id)return;if(q.resultado){mostrarResultadoQuiz(q.resultado);aviso.textContent='Resultado salvo confirmado.';}else aviso.textContent='Nenhum resultado salvo. Suas seleções foram mantidas.';}
    catch(erro){if(seq!==catalogoQuizSequencia||erro.sessaoExpirada)return;aviso.textContent='Não foi possível consultar. Suas seleções foram mantidas.';}
}

