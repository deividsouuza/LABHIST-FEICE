// projetos: responsabilidades e dependências em ../MODULOS.md.
let currentEditProjetoId = null;
let professoresDisponiveis = [];
let selectedProjetoProfessores = [];
let alunosDisponiveis = [];
let selectedProjetoAlunos = [];
let projetoFormularioSequencia=0;
let projetoEnviando=false;
function limparFormularioProjeto(){
    if(projetoEnviando)return;
    clearForm('formProjeto');
    if(perfilAtual()==='professor')carregarParticipantesProjetoProfessor();
}
function resetProjetoProfessores() {
    selectedProjetoProfessores = [];
    renderSelectedProfessores();
}

function resetProjetoAlunos() {
    selectedProjetoAlunos = [];
    renderSelectedAlunos();
}

function renderProfessoresSelect(preferredId = '') {
    const select = document.getElementById('proj-professor');
    if (!select) return;

    const selectedIds = new Set(selectedProjetoProfessores.map(prof => String(prof.id)));
    const options = professoresDisponiveis.filter(prof => !selectedIds.has(String(prof.id)));

    select.innerHTML = '<option value="">Selecione um professor...</option>';

    options.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof.id;
        opt.textContent = prof.nome || prof.usuario;
        if (preferredId && String(prof.id) === String(preferredId)) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderSelectedProfessores() {
    const container = document.getElementById('proj-professores-lista');
    if (!container) return;

    if (selectedProjetoProfessores.length === 0) {
        container.innerHTML = '<div class="selected-empty">Nenhum professor adicionado ao projeto.</div>';
    } else {
        container.innerHTML = selectedProjetoProfessores.map(prof => `
            <div class="selected-professor-item">
                <div class="selected-professor-info">
                    <div class="selected-professor-name">${escHtml(prof.nome || prof.usuario || 'Professor')}</div>
                    <div class="selected-professor-meta">${escHtml(prof.matricula || prof.email || 'Professor vinculado ao projeto')}</div>
                </div>
                ${perfilAtual()==='administrador'?`<button type="button" class="selected-professor-remove" onclick="removeProfessorFromProjeto(${prof.id})">Remover</button>`:''}
            </div>
        `).join('');
    }

    renderProfessoresSelect();
}

function addProfessorToProjeto() {
    if(perfilAtual()!=='administrador')return;
    const select = document.getElementById('proj-professor');
    const selectedId = select?.value;

    if (!selectedId) {
        alert('Selecione um professor antes de adicionar.');
        return;
    }

    if (selectedProjetoProfessores.some(prof => String(prof.id) === String(selectedId))) {
        alert('Esse professor já foi adicionado ao projeto.');
        return;
    }

    const professor = professoresDisponiveis.find(prof => String(prof.id) === String(selectedId));
    if (!professor) {
        alert('Professor não encontrado na lista.');
        return;
    }

    selectedProjetoProfessores.push(professor);
    renderSelectedProfessores();
}

function removeProfessorFromProjeto(id) {
    if(perfilAtual()!=='administrador')return;
    selectedProjetoProfessores = selectedProjetoProfessores.filter(prof => String(prof.id) !== String(id));
    renderSelectedProfessores();
}

function renderAlunosSelect(preferredId = '') {
    const select = document.getElementById('proj-aluno');
    if (!select) return;

    const selectedIds = new Set(selectedProjetoAlunos.map(aluno => String(aluno.id)));
    const options = alunosDisponiveis.filter(aluno => !selectedIds.has(String(aluno.id)));

    select.innerHTML = '<option value="">Selecione um aluno...</option>';

    options.forEach(aluno => {
        const opt = document.createElement('option');
        opt.value = aluno.id;
        opt.textContent = aluno.nome || aluno.usuario;
        if (preferredId && String(aluno.id) === String(preferredId)) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderSelectedAlunos() {
    const container = document.getElementById('proj-alunos-lista');
    if (!container) return;

    if (selectedProjetoAlunos.length === 0) {
        container.innerHTML = '<div class="selected-empty">Nenhum aluno adicionado ao projeto.</div>';
    } else {
        container.innerHTML = selectedProjetoAlunos.map(aluno => `
            <div class="selected-professor-item">
                <div class="selected-professor-info">
                    <div class="selected-professor-name">${escHtml(aluno.nome || aluno.usuario || 'Aluno')}</div>
                    <div class="selected-professor-meta">${escHtml(aluno.matricula || rotuloCurso(aluno.curso) || 'Aluno vinculado ao projeto')}</div>
                </div>
                <button type="button" class="selected-professor-remove" onclick="removeAlunoFromProjeto(${aluno.id})">Remover</button>
            </div>
        `).join('');
    }

    renderAlunosSelect();
}

function addAlunoToProjeto() {
    const select = document.getElementById('proj-aluno');
    const selectedId = select?.value;

    if (!selectedId) {
        alert('Selecione um aluno antes de adicionar.');
        return;
    }

    if (selectedProjetoAlunos.some(aluno => String(aluno.id) === String(selectedId))) {
        alert('Esse aluno já foi adicionado ao projeto.');
        return;
    }

    const aluno = alunosDisponiveis.find(item => String(item.id) === String(selectedId));
    if (!aluno) {
        alert('Aluno não encontrado na lista.');
        return;
    }

    selectedProjetoAlunos.push(aluno);
    renderSelectedAlunos();
}

function removeAlunoFromProjeto(id) {
    selectedProjetoAlunos = selectedProjetoAlunos.filter(aluno => String(aluno.id) !== String(id));
    renderSelectedAlunos();
}

function rotuloStatusProjeto(status){return ({finalizado:'Finalizado','em andamento':'Em andamento',cancelado:'Cancelado'})[status]||'Não informado';}
let projetosDaPessoaAtual = [];
let projetoAtualDetalheId = null;
let detalheProjetoSequencia = 0;
async function showMeusProjetos() {
    if (!['aluno','professor'].includes(perfilAtual())) return;
    hideAll();
    document.getElementById('navItemMeusProjetos').classList.add('open');
    document.getElementById('breadcrumbCurrent').textContent = 'Meus Projetos';
    document.getElementById('listMeusProjetos').style.display = 'block';
    document.getElementById('pessoaAtualNome').textContent = sessaoAtual.nome;
    await carregarMeusProjetos();
    if (window.innerWidth <= 768) closeSidebar();
}

async function carregarMeusProjetos() {
    const bodyEl = document.getElementById('meusProjetosListBody');
    const pessoaId = getPessoaAtualId();

    if (!pessoaId) {
        bodyEl.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">🙋</div>
            <div class="empty-state-title">Entre novamente para ver seus projetos</div>
            <div class="empty-state-sub">Sua identidade precisa ser confirmada.</div>
        </div>`;
        return;
    }

    const conteudoAnterior = bodyEl.innerHTML;
    bodyEl.innerHTML = '<div class="list-loading">Carregando...</div>';

    try {
        const res = await apiFetch(`${API}/projetos`);
        const projetos = validarLista(res.dados, 'projeto');
        projetosDaPessoaAtual = projetos;
        renderMeusProjetosList();
    } catch (erro) {
        mostrarErro(erro);
        bodyEl.innerHTML = conteudoAnterior || `<div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Erro ao carregar projetos</div>
            <div class="empty-state-sub">Verifique se o servidor está rodando</div>
        </div>`;
    }
}

function renderMeusProjetosList() {
    const bodyEl = document.getElementById('meusProjetosListBody');
    const perfil = perfilAtual();

    if (projetosDaPessoaAtual.length === 0) {
        bodyEl.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">Nenhum projeto vinculado ainda</div>
            <div class="empty-state-sub">Você aparecerá aqui assim que for adicionado a um projeto</div>
        </div>`;
        return;
    }

    bodyEl.innerHTML = `<div class="list-items">${projetosDaPessoaAtual.map(p => `
        <div class="list-item" onclick="abrirDetalheProjeto(${p.id})">
            <div class="list-item-avatar purple">📝</div>
            <div class="list-item-info">
                <div class="list-item-name">${escHtml(p.nome)}</div>
                <div class="list-item-sub">${escHtml(perfil === 'professor'
                    ? (p.alunos_texto || 'Nenhum aluno vinculado.')
                    : (p.professores_texto || 'Sem professor vinculado'))}</div>
                <div class="list-item-sub">Status: ${escHtml(rotuloStatusProjeto(p.status))}</div>
            </div>
        </div>`).join('')}</div>`;
}

async function abrirDetalheProjeto(projetoId) {
    if(!['aluno','professor'].includes(perfilAtual()))return;
    const perfil = perfilAtual();
    hideAll();
    const sequencia=detalheProjetoSequencia;
    projetoAtualDetalheId=null;
    document.getElementById('navItemMeusProjetos').classList.add('open');
    document.getElementById('breadcrumbCurrent').textContent = 'Projeto';
    document.getElementById('detalheProjeto').style.display = 'block';
    document.getElementById('detalheProjetoNome').textContent = 'Carregando projeto...';
    document.getElementById('detalheProjetoInfo').textContent='Carregando informações...';
    document.getElementById('detalheDocumentosBody').replaceChildren();
    document.getElementById('docUploadPainel').hidden=true;
    document.getElementById('docUploadEnviar').disabled=true;
    document.getElementById('btnSubprojetosParticipante').disabled=true;
    document.getElementById('detalheDocumentosTitulo').textContent = perfil === 'professor'
        ? 'Documentos enviados pela equipe'
        : 'Meus documentos enviados';
    document.getElementById('docUploadDescricao').value = '';
    document.getElementById('docUploadTexto').value='';
    document.getElementById('docUploadArquivo').value = '';
    document.getElementById('docUploadArquivo-chip').innerHTML = '';

    try{
        const res=await apiFetch(`${API}/projetos/${projetoId}`),p=validarRegistro(res.dados,'projeto');
        if(p.id!==Number(projetoId))formatoInvalido();
        for(const campo of ['professores','alunos'])if(!Array.isArray(p[campo])||p[campo].some(a=>!a||typeof a!=='object'||!Number.isInteger(a.id)||a.id<=0||typeof a.nome!=='string'))formatoInvalido();
        if(sequencia!==detalheProjetoSequencia)return;
        projetoAtualDetalheId=p.id;
        document.getElementById('detalheProjetoNome').textContent=p.nome;
        document.getElementById('breadcrumbCurrent').textContent=p.nome;
        document.getElementById('detalheProjetoInfo').innerHTML=`<p>Participação: você está vinculado a este projeto.</p>
            <h3>Descrição</h3><p class="texto-projeto">${escHtml(p.descricao||'Não informada')}</p>
            <h3>Objetivo</h3><p class="texto-projeto">${escHtml(p.objetivo||'Não informado')}</p>
            <p>Status: ${escHtml(rotuloStatusProjeto(p.status))}</p>
            <h3>Professores</h3><p>${escHtml(p.professores.map(a=>a.nome).join(', ')||'Nenhum professor vinculado.')}</p>
            <h3>${perfil==='aluno'?'Sua participação':'Alunos acompanhados'}</h3><p>${escHtml(p.alunos.map(a=>a.nome).join(', ')||'Nenhum aluno vinculado.')}</p>`;
        document.getElementById('docUploadPainel').hidden=false;
        document.getElementById('docUploadEnviar').disabled=false;
        document.getElementById('btnSubprojetosParticipante').disabled=false;
        await carregarDocumentosDoProjeto();
    }catch(erro){
        if(sequencia!==detalheProjetoSequencia||erro.sessaoExpirada)return;
        projetoAtualDetalheId=null;
        document.getElementById('detalheProjetoNome').textContent='Projeto indisponível';
        document.getElementById('detalheProjetoInfo').textContent='Não foi possível carregar este projeto.';
        mostrarErro(erro);
    }

    if (window.innerWidth <= 768) closeSidebar();
}

function backToMeusProjetos() {
    projetoAtualDetalheId = null;
    showMeusProjetos();
}

async function carregarProfessoresSelect(selectedId = null) {
    try {
        const res = await apiFetch(`${API}/usuarios?perfil=professor`);
        professoresDisponiveis = validarLista(res.dados, 'professor');
        renderProfessoresSelect(selectedId || '');
    } catch (erro) { mostrarErro(erro); }
}

async function carregarAlunosSelect(selectedId = null) {
    try {
        const res = await apiFetch(`${API}/usuarios?perfil=aluno`);
        alunosDisponiveis = validarLista(res.dados, 'aluno');
        renderAlunosSelect(selectedId || '');
    } catch (erro) { mostrarErro(erro); }
}

async function carregarParticipantesProjetoProfessor(){
    const seq=projetoFormularioSequencia,conta=sessaoAtual.conta_id;
    const botao=document.getElementById('btnSubmitProjeto'),aviso=document.getElementById('projetoFormAviso');
    alunosDisponiveis=[];renderAlunosSelect();botao.disabled=true;aviso.textContent='Carregando alunos...';
    try{
        const dados=(await apiFetch(`${API}/projetos/opcoes-criacao`)).dados;
        const professores=validarLista(dados.professores,'professor'),alunos=validarLista(dados.alunos,'aluno');
        if(seq!==projetoFormularioSequencia||sessaoAtual?.conta_id!==conta||perfilAtual()!=='professor')return;
        if(professores.length!==1||professores[0].id!==getPessoaAtualId())formatoInvalido();
        professoresDisponiveis=professores;alunosDisponiveis=alunos;
        selectedProjetoProfessores=professores;renderSelectedProfessores();renderAlunosSelect();
        aviso.textContent=alunos.length?'Você será vinculado automaticamente como professor responsável.':'Nenhum aluno cadastrado. Solicite o cadastro ao administrador antes de criar o projeto.';
        botao.disabled=!alunos.length;
    }catch(erro){
        if(seq!==projetoFormularioSequencia||erro.sessaoExpirada)return;
        aviso.textContent='Não foi possível carregar os alunos. Volte e abra o cadastro novamente.';mostrarErro(erro);
    }
}

// ── Núcleo administrativo de quizzes ──────────────────
async function editProjeto(id) {
    if(perfilAtual()!=='administrador')return;
    try {
        const res = await apiFetch(API + '/projetos/' + id);
        const p = validarRegistro(res.dados, 'projeto');
        // Carrega e valida tudo antes de alterar formulário, seleção ou ID de edição.
        const [resProf, resAluno] = await Promise.all([
            apiFetch(API + '/usuarios?perfil=professor'), apiFetch(API + '/usuarios?perfil=aluno')
        ]);
        const professores = validarLista(resProf.dados, 'professor');
        const alunos = validarLista(resAluno.dados, 'aluno');
        const selecionadosProf = p.professor_ids.map(id=>professores.find(item=>item.id===id));
        const selecionadosAluno = p.aluno_ids.map(id=>alunos.find(item=>item.id===id));
        if ([...selecionadosProf,...selecionadosAluno].some(item=>!item)) throw new Error('Não foi possível carregar todos os participantes. Tente novamente.');
        hideAll();
        professoresDisponiveis = professores;
        alunosDisponiveis = alunos;
        selectedProjetoProfessores = selecionadosProf;
        selectedProjetoAlunos = selecionadosAluno;
        document.getElementById('proj-nome').value = p.nome;
        document.getElementById('proj-descricao').value = p.descricao || '';
        document.getElementById('proj-objetivo').value = p.objetivo || '';
        document.getElementById('proj-status').value=p.status||'';
        document.getElementById('proj-status').dataset.legado=p.status==null?'1':'0';
        document.getElementById('proj-status').options[0].textContent=p.status==null?'Não informado (legado)':'Selecione um status...';
        renderSelectedProfessores(); renderSelectedAlunos();
        currentEditProjetoId = id;
        document.getElementById('btnSubmitProjeto').disabled=false;
        setSubmitLabel('projeto', true);
        document.getElementById('listProjeto').style.display = 'none';
        document.getElementById('formProjeto').style.display = 'block';
        document.getElementById('breadcrumbCurrent').textContent = 'Editar Projeto';
    } catch (erro) { mostrarErro(erro); }
}

async function submitProjeto() {
    if(!['administrador','professor'].includes(perfilAtual())||projetoEnviando||(perfilAtual()==='professor'&&currentEditProjetoId!==null))return;
    const nome         = document.getElementById('proj-nome').value.trim();
    const descricao    = document.getElementById('proj-descricao').value.trim();
    const objetivo     = document.getElementById('proj-objetivo').value.trim();
    const professor_ids = selectedProjetoProfessores.map(prof => prof.id);
    const aluno_ids = selectedProjetoAlunos.map(aluno => aluno.id);
    const professor_id = professor_ids[0] || null;
    const status=document.getElementById('proj-status').value||null;

    if (!nome) { alert('Informe o nome do projeto.'); return; }
    if(!status&&!(currentEditProjetoId!==null&&document.getElementById('proj-status').dataset.legado==='1')){alert('Escolha um status para o projeto.');return;}
    if (new Set(professor_ids.map(String)).size !== professor_ids.length) { alert('Há professores duplicados na lista do projeto.'); return; }
    if (new Set(aluno_ids.map(String)).size !== aluno_ids.length) { alert('Há alunos duplicados na lista do projeto.'); return; }
    if (professor_ids.length === 0) { alert('Adicione pelo menos um professor ao projeto.'); return; }
    if (aluno_ids.length === 0) { alert('Adicione pelo menos um aluno ao projeto.'); return; }

    const seq=projetoFormularioSequencia,conta=sessaoAtual.conta_id;
    projetoEnviando=true;document.getElementById('btnSubmitProjeto').disabled=true;
    try {
        let res;
        if (currentEditProjetoId !== null) {
            res = await apiFetch(`${API}/projetos/${currentEditProjetoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao, objetivo, professor_id, professor_ids, aluno_ids, status })
            });
        } else {
            res = await apiFetch(`${API}/projetos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, descricao, objetivo, professor_id, professor_ids, aluno_ids, status })
            });
        }
        const data = confirmarOperacao(res);
        if(seq!==projetoFormularioSequencia||sessaoAtual?.conta_id!==conta)return;
        if (res.ok) {
            clearForm('formProjeto');
            if(perfilAtual()==='professor')await abrirSubprojetosProjeto(data.id);
            else backToList('projeto');
        }
        else alert(data.erro || 'Erro ao salvar projeto.');
    } catch (erro) { if(seq===projetoFormularioSequencia)mostrarErro(erro); }
    finally {projetoEnviando=false;if(seq===projetoFormularioSequencia)document.getElementById('btnSubmitProjeto').disabled=false;}
}

async function deleteProjeto(event, id) {
    event.stopPropagation();
    if (!confirm('Tem certeza que deseja remover este projeto?')) return;
    try {
        const res = await apiFetch(`${API}/projetos/${id}`, { method: 'DELETE' });
        confirmarOperacao(res);
        if (res.status===202) alert(res.dados.mensagem);
        if (res.ok) showForm('projeto');
        else alert('Erro ao remover projeto.');
    } catch (erro) { mostrarErro(erro); }
}

// ── Utilitários ───────────────────────────────────────

