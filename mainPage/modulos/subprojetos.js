// subprojetos: responsabilidades e dependências em ../MODULOS.md.
let subprojetoSequencia=0;
let contextoSubprojeto=null;
let subprojetoEnviando=false;
let subprojetoEditandoId=null;
let subprojetoDetalheAtualId=null;
let subprojetoExcluindo=false;

function validarSubprojetoTela(s,pai) {
    if(!s||!Number.isInteger(s.id)||s.id<=0||!Number.isInteger(s.projeto_id)||s.projeto_id!==pai)formatoInvalido();
    for(const c of ['titulo','objetivo','descricao','temas_abordados'])if(typeof s[c]!=='string')formatoInvalido();
    if(s.alunos!==undefined)validarAlunosSubprojeto(s.alunos);
    return s;
}

function validarAlunosSubprojeto(alunos){
    if(!Array.isArray(alunos)||alunos.some(a=>!Number.isInteger(a.id)||a.id<=0||typeof a.nome!=='string')||new Set(alunos.map(a=>a.id)).size!==alunos.length)formatoInvalido();
    return alunos;
}
function renderAlunosSubprojeto(selecionados=[]){
    const lista=document.getElementById('subAlunosLista');lista.replaceChildren();
    const alunos=contextoSubprojeto?.alunos||[];
    if(!alunos.length){lista.textContent='Nenhum aluno vinculado ao projeto principal. Adicione alunos ao projeto para selecioná-los aqui.';return;}
    for(const a of alunos){const label=document.createElement('label'),input=document.createElement('input'),nome=document.createElement('span');label.className='quiz-resposta-opcao';input.type='checkbox';input.id='sub-aluno-'+a.id;input.value=String(a.id);input.checked=selecionados.includes(a.id);nome.textContent=a.nome;label.append(input,nome);lista.append(label);}
}
function limparParticipantesSubprojeto(){
    subprojetoSequencia++;contextoSubprojeto=null;
    document.getElementById('subAlunosLista').replaceChildren();
    document.getElementById('subprojetoCampos').replaceChildren();
    for(const id of ['listaSubprojetos','detalheSubprojeto','formSubprojeto'])document.getElementById(id).style.display='none';
}

async function abrirSubprojetosProjeto(id) {
    if(!Number.isInteger(id)||id<=0||!['administrador','aluno','professor'].includes(perfilAtual()))return;
    hideAll();const seq=subprojetoSequencia;
    contextoSubprojeto={projetoId:id,nome:'Projeto',origem:perfilAtual()==='administrador'?'admin':'academico',carregado:false};
    document.getElementById('btnNovoSubprojeto').hidden=true;
    document.getElementById('listaSubprojetos').style.display='block';
    document.getElementById('subprojetosProjetoNome').textContent='Carregando projeto...';
    document.getElementById('subprojetosAviso').textContent='Carregando subprojetos...';
    document.getElementById('subprojetosListBody').replaceChildren();
    document.getElementById('breadcrumbCurrent').textContent='Subprojetos';
    if(window.innerWidth<=768)closeSidebar();
    try{
        const res=await apiFetch(`${API}/projetos/${id}`),p=validarRegistro(res.dados,'projeto');if(p.id!==id)formatoInvalido();
        if(seq!==subprojetoSequencia)return false;
        const lista=(await apiFetch(`${API}/projetos/${id}/subprojetos`)).dados;
        if(!Array.isArray(lista))formatoInvalido();lista.forEach(s=>validarSubprojetoTela(s,id));
        if(seq!==subprojetoSequencia)return false;
        contextoSubprojeto.nome=p.nome;
        contextoSubprojeto.alunos=validarAlunosSubprojeto(p.alunos||[]).map(a=>({id:a.id,nome:a.nome}));
        contextoSubprojeto.carregado=true;
        document.getElementById('btnNovoSubprojeto').hidden=!['administrador','professor'].includes(perfilAtual());
        document.getElementById('subprojetosProjetoNome').textContent=p.nome;
        document.getElementById('breadcrumbCurrent').textContent=p.nome+' / Subprojetos';
        document.getElementById('subprojetosAviso').textContent='';
        const container=document.getElementById('subprojetosListBody');
        if(!lista.length)container.textContent='Nenhum subprojeto cadastrado neste projeto.';
        for(const s of lista){
            const botao=document.createElement('button');botao.type='button';botao.className='list-item subprojeto-item';botao.textContent=s.titulo;botao.onclick=()=>abrirDetalheSubprojeto(s.id);container.appendChild(botao);
        }
        return true;
    }catch(erro){
        if(seq!==subprojetoSequencia||erro.sessaoExpirada)return false;
        document.getElementById('subprojetosProjetoNome').textContent='Projeto indisponível';
        document.getElementById('subprojetosAviso').textContent='Não foi possível carregar os subprojetos.';mostrarErro(erro);return false;
    }
}

async function abrirDetalheSubprojeto(id) {
    if(!contextoSubprojeto)return;
    const contexto={...contextoSubprojeto},seq=++subprojetoSequencia;
    document.getElementById('subprojetosAviso').textContent='Carregando subprojeto...';
    try{
        const s=validarSubprojetoTela((await apiFetch(`${API}/subprojetos/${id}`)).dados,contexto.projetoId);if(s.id!==id)formatoInvalido();
        if(seq!==subprojetoSequencia)return;
        hideAll();document.getElementById('detalheSubprojeto').style.display='block';
        subprojetoDetalheAtualId=s.id;
        document.getElementById('btnEditarSubprojeto').hidden=perfilAtual()!=='administrador';
        document.getElementById('btnExcluirSubprojeto').hidden=perfilAtual()!=='administrador';
        document.getElementById('btnExcluirSubprojeto').disabled=subprojetoExcluindo;
        document.getElementById('subprojetoDetalheAviso').textContent='';
        document.getElementById('subprojetoTitulo').textContent=s.titulo;
        document.getElementById('breadcrumbCurrent').textContent=contexto.nome+' / '+s.titulo;
        const campos=document.getElementById('subprojetoCampos');campos.replaceChildren();
        for(const [campo,rotulo] of [['objetivo','Objetivo'],['descricao','Descrição'],['temas_abordados','Temas abordados']]){
            const titulo=document.createElement('h3'),texto=document.createElement('p');titulo.textContent=rotulo;texto.textContent=s[campo]||'Não informado';texto.className='texto-projeto';campos.append(titulo,texto);
        }
        const tituloEquipe=document.createElement('h3'),equipe=document.createElement('ul');tituloEquipe.textContent=perfilAtual()==='aluno'?'Minha participação':'Alunos envolvidos';
        const alunos=s.alunos||[];
        if(!alunos.length){const vazio=document.createElement('li');vazio.textContent=perfilAtual()==='aluno'?'Você não está vinculado a este subprojeto.':'Nenhum aluno vinculado a este subprojeto.';equipe.append(vazio);}
        for(const a of alunos){const item=document.createElement('li');item.className='texto-projeto';item.textContent=a.nome;equipe.append(item);}
        campos.append(tituloEquipe,equipe);
    }catch(erro){if(seq!==subprojetoSequencia||erro.sessaoExpirada)return;document.getElementById('subprojetosAviso').textContent='Não foi possível abrir este subprojeto.';mostrarErro(erro);}
}

function voltarListaSubprojetos(){if(contextoSubprojeto)return abrirSubprojetosProjeto(contextoSubprojeto.projetoId);}

async function excluirSubprojeto(){
    if(perfilAtual()!=='administrador'||!contextoSubprojeto?.carregado||!subprojetoDetalheAtualId||subprojetoExcluindo)return;
    const id=subprojetoDetalheAtualId,pai=contextoSubprojeto.projetoId,seq=subprojetoSequencia;
    if(!confirm('Excluir o subprojeto "'+document.getElementById('subprojetoTitulo').textContent+'"?'))return;
    const botao=document.getElementById('btnExcluirSubprojeto');subprojetoExcluindo=true;botao.disabled=true;
    document.getElementById('subprojetoDetalheAviso').textContent='Excluindo...';
    try{
        confirmarOperacao(await apiFetch(`${API}/subprojetos/${id}`,{method:'DELETE'}));
        if(seq!==subprojetoSequencia||contextoSubprojeto?.projetoId!==pai)return;
        await abrirSubprojetosProjeto(pai);
    }catch(erro){
        if(seq!==subprojetoSequencia||erro.sessaoExpirada)return;
        document.getElementById('subprojetoDetalheAviso').textContent=erro.status===409?'Exclusão impedida por conflito ou dependentes protegidos.':'Não foi possível confirmar a exclusão. O item foi mantido na tela.';
        mostrarErro(erro);
    }finally{subprojetoExcluindo=false;botao.disabled=false;}
}

function novoSubprojeto(){
    if(!['administrador','professor'].includes(perfilAtual())||!contextoSubprojeto?.carregado||subprojetoEnviando)return;
    hideAll();
    for(const campo of ['titulo','objetivo','descricao','temas_abordados'])document.getElementById('sub-'+campo).value='';
    document.getElementById('subprojetoFormProjeto').textContent=contextoSubprojeto.nome;
    document.getElementById('subprojetoFormAviso').textContent='';
    document.getElementById('subprojetoFormModo').textContent='novo subprojeto em';
    document.getElementById('btnSalvarSubprojeto').textContent='Cadastrar subprojeto';
    document.getElementById('breadcrumbCurrent').textContent=contextoSubprojeto.nome+' / Novo subprojeto';
    document.getElementById('formSubprojeto').style.display='block';
    renderAlunosSubprojeto();
}

async function editarSubprojeto(id){
    if(perfilAtual()!=='administrador'||!contextoSubprojeto?.carregado||!Number.isInteger(id)||id<=0||subprojetoEnviando)return;
    const pai=contextoSubprojeto.projetoId,seq=++subprojetoSequencia;
    try{
        const s=validarSubprojetoTela((await apiFetch(`${API}/subprojetos/${id}`)).dados,pai);if(s.id!==id)formatoInvalido();
        const projeto=validarRegistro((await apiFetch(`${API}/projetos/${pai}`)).dados,'projeto');
        const alunos=validarAlunosSubprojeto(projeto.alunos||[]);
        if(projeto.id!==pai||(s.alunos||[]).some(a=>!alunos.some(m=>m.id===a.id)))formatoInvalido();
        if(seq!==subprojetoSequencia)return;
        contextoSubprojeto.alunos=alunos.map(a=>({id:a.id,nome:a.nome}));
        hideAll();subprojetoEditandoId=s.id;
        for(const campo of ['titulo','objetivo','descricao','temas_abordados'])document.getElementById('sub-'+campo).value=s[campo];
        document.getElementById('subprojetoFormProjeto').textContent=contextoSubprojeto.nome;
        document.getElementById('subprojetoFormModo').textContent='editar subprojeto em';
        document.getElementById('btnSalvarSubprojeto').textContent='Salvar alterações';
        document.getElementById('subprojetoFormAviso').textContent='';
        document.getElementById('breadcrumbCurrent').textContent=contextoSubprojeto.nome+' / Editar subprojeto';
        document.getElementById('formSubprojeto').style.display='block';
        renderAlunosSubprojeto((s.alunos||[]).map(a=>a.id));
    }catch(erro){if(seq!==subprojetoSequencia||erro.sessaoExpirada)return;mostrarErro(erro);}
}

async function submitSubprojeto(){
    if(!['administrador','professor'].includes(perfilAtual())||(perfilAtual()==='professor'&&subprojetoEditandoId!==null)||!contextoSubprojeto?.carregado||subprojetoEnviando)return;
    const dados={};
    for(const campo of ['titulo','objetivo','descricao','temas_abordados']){
        dados[campo]=document.getElementById('sub-'+campo).value.trim();
        if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(dados[campo])||(campo==='titulo'?(!dados[campo]||Array.from(dados[campo]).length>255||/[\r\n\t]/.test(dados[campo])):new TextEncoder().encode(dados[campo]).length>65535)){
            document.getElementById('subprojetoFormAviso').textContent=campo==='titulo'?'Informe um título válido de até 255 caracteres.':'Verifique o tamanho e os caracteres dos textos.';return;
        }
    }
    const pai=contextoSubprojeto.projetoId,seq=subprojetoSequencia,id=subprojetoEditandoId;
    dados.aluno_ids=Array.from(document.querySelectorAll('#subAlunosLista input:checked'),i=>Number(i.value));
    const botao=document.getElementById('btnSalvarSubprojeto');subprojetoEnviando=true;botao.disabled=true;document.getElementById('subprojetoFormAviso').textContent='Salvando...';
    try{
        const res=await apiFetch(id===null?`${API}/projetos/${pai}/subprojetos`:`${API}/subprojetos/${id}`,{method:id===null?'POST':'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(id===null?dados:{...dados,projeto_id:pai})});
        const resultado=confirmarOperacao(res);if(id===null&&(!Number.isInteger(resultado.id)||resultado.id<=0))formatoInvalido();
        if(seq!==subprojetoSequencia||contextoSubprojeto?.projetoId!==pai)return;
        for(const campo of ['titulo','objetivo','descricao','temas_abordados'])document.getElementById('sub-'+campo).value='';
        const carregou=await abrirSubprojetosProjeto(pai);
        if(carregou&&id!==null)await abrirDetalheSubprojeto(id);
    }catch(erro){if(seq!==subprojetoSequencia||erro.sessaoExpirada)return;document.getElementById('subprojetoFormAviso').textContent='Não foi possível confirmar a operação. Os dados foram preservados.';mostrarErro(erro);}
    finally{subprojetoEnviando=false;botao.disabled=false;}
}
function voltarDoSubprojetoAoProjeto(){
    if(!contextoSubprojeto)return;
    const contexto=contextoSubprojeto;
    if(contexto.origem==='admin')return editProjeto(contexto.projetoId);
    return abrirDetalheProjeto(contexto.projetoId);
}

