// navegacao: responsabilidades e dependências em ../MODULOS.md.
function toggleCadastros() {
    cadastrosOpen = !cadastrosOpen;
    document.getElementById('navParent').setAttribute('aria-expanded',String(cadastrosOpen));
    document.getElementById('navParent').classList.toggle('open', cadastrosOpen);
    document.getElementById('navChildren').classList.toggle('open', cadastrosOpen);
}

function hideAll() {
    pausarMensagens();
    projetoFormularioSequencia++;
    resultadosProfessorSequencia++;document.getElementById("resultadosProfessor").style.display="none";
    historicoAlunoSequencia++;document.getElementById('historicoAluno').style.display='none';
    limparAtividadeQuizAluno();
    catalogoQuizSequencia++;catalogoQuizId=null;
    for(const id of ['catalogoQuizzesAluno','introducaoQuizAluno'])document.getElementById(id).style.display='none';
    quizSequencia++;quizEditandoId=null;quizDetalheId=null;quizDisponibilidadeId=null;quizSubprojetoSequencia++;
    document.getElementById('childQuizzes').classList.remove('active');
    for(const id of ['listQuizzes','formQuiz','detalheQuiz','formQuizDisponibilidade'])document.getElementById(id).style.display='none';
    detalheProjetoSequencia++;
    subprojetoSequencia++;
    subprojetoEditandoId=null;subprojetoDetalheAtualId=null;
    document.getElementById('listaSubprojetos').style.display='none';
    document.getElementById('detalheSubprojeto').style.display='none';
    document.getElementById('formSubprojeto').style.display='none';
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('listMeusProjetos').style.display = 'none';
    document.getElementById('detalheProjeto').style.display = 'none';
    document.getElementById('navItemMeusProjetos').classList.remove('open');
    Object.values(formMap).forEach(f => {
        document.getElementById(f.listId).style.display = 'none';
        document.getElementById(f.formId).style.display = 'none';
        document.getElementById(f.child).classList.remove('active');
    });
}

async function showForm(type) {
    hideAll();
    const map = formMap[type];
    document.getElementById(map.child).classList.add('active');
    document.getElementById('breadcrumbCurrent').textContent = map.listLabel;
    document.getElementById(map.listId).style.display = 'block';

    // Limpa busca ao trocar de listagem
    const searchEl = document.getElementById(type === 'professor' ? 'searchProf' : type === 'aluno' ? 'searchAluno' : null);
    if (searchEl) searchEl.value = '';
    if (type === 'aluno') {
        document.querySelectorAll('#cursoChips .chip').forEach(c => c.classList.remove('active'));
    }

    const bodyEl = document.getElementById(map.listBodyId);
    const conteudoAnterior = bodyEl.innerHTML;
    bodyEl.innerHTML = '<div class="list-loading">Carregando...</div>';

    try {
        const res = await apiFetch(`${API}${map.apiPath}`);
        const data = validarLista(res.dados, type);
        dadosCarregados[type] = data;
        filtrarLista(type);
    } catch (erro) {
        mostrarErro(erro);
        bodyEl.innerHTML = conteudoAnterior || `<div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Erro ao carregar dados</div>
            <div class="empty-state-sub">Tente novamente usando o menu ou o botão de voltar</div>
        </div>`;
    }

    if (window.innerWidth <= 768) closeSidebar();
}

function filtrarLista(type) {
    const dados = dadosCarregados[type] || [];
    const map = formMap[type];
    const bodyEl = document.getElementById(map.listBodyId);

    const searchId = type === 'professor' ? 'searchProf' : type === 'aluno' ? 'searchAluno' : null;
    const termo = searchId ? (document.getElementById(searchId)?.value.toLowerCase().trim() || '') : '';

    let filtrado = dados.filter(item => {
        const nome = (item.nome || item.usuario || '').toLowerCase();
        return nome.includes(termo);
    });

    if (type === 'aluno') {
        const cursosAtivos = [...document.querySelectorAll('#cursoChips .chip.active')].map(c => c.dataset.curso);
        if (cursosAtivos.length > 0) {
            filtrado = filtrado.filter(a => cursosAtivos.includes(a.curso));
        }
    }

    bodyEl.innerHTML = filtrado.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon">${map.icon}</div>
            <div class="empty-state-title">${termo || (type === 'aluno' && document.querySelectorAll('#cursoChips .chip.active').length) ? 'Nenhum resultado encontrado' : map.emptyMsg}</div>
            <div class="empty-state-sub">${termo || (type === 'aluno' && document.querySelectorAll('#cursoChips .chip.active').length) ? 'Tente outro termo ou filtro' : map.emptyHint}</div>
           </div>`
        : `<div class="list-items">${renderList(type, filtrado)}</div>`;
}

function toggleCurso(btn) {
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('#cursoChips .chip').forEach(c => c.classList.remove('active'));
    if (!isActive) btn.classList.add('active');
    filtrarLista('aluno');
}

function showRegisterForm(type) {
    if(perfilAtual()!=='administrador'&&!(type==='projeto'&&perfilAtual()==='professor'))return;
    hideAll();
    currentEditId = null;
    currentEditProjetoId = null;
    clearForm(formMap[type].formId);
    if (type !== 'projeto') document.getElementById((type === 'professor' ? 'prof' : 'aluno') + '-acesso').hidden = false;
    setSubmitLabel(type, false);

    const map = formMap[type];
    document.getElementById(map.listId).style.display = 'none';
    document.getElementById(map.formId).style.display = 'block';
    document.getElementById('breadcrumbCurrent').textContent = `Cadastrar ${map.formLabel}`;

    if (type === 'projeto') {
        if(perfilAtual()==='professor')carregarParticipantesProjetoProfessor();
        else {carregarProfessoresSelect();carregarAlunosSelect();}
    }
}

function backToList(type) {
    currentEditId = null;
    currentEditProjetoId = null;
    setSubmitLabel(type, false);
    if(type==='projeto'&&perfilAtual()==='professor')showMeusProjetos();
    else showForm(type);
}

function setSubmitLabel(type, isEdit) {
    const labels = {
        professor: ['Cadastrar Professor', 'Salvar Alterações'],
        aluno:     ['Cadastrar Aluno',     'Salvar Alterações'],
        projeto:   ['Cadastrar Projeto',   'Salvar Alterações']
    };
    const ids = { professor: 'btnSubmitProf', aluno: 'btnSubmitAluno', projeto: 'btnSubmitProjeto' };
    document.getElementById(ids[type]).textContent = labels[type][isEdit ? 1 : 0];
}

// ── Renderização da lista ─────────────────────────────

function clearForm(formId) {
    const panel = document.getElementById(formId);
    panel.querySelectorAll('input:not([type="radio"]), textarea').forEach(el => el.value = '');
    panel.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
    panel.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
    if (formId === 'formProjeto') {
        projetoFormularioSequencia++;
        document.getElementById('projetoFormAviso').textContent='';
        document.getElementById('btnSubmitProjeto').disabled=false;
        document.getElementById('proj-professor-escolha').hidden=perfilAtual()==='professor';
        document.getElementById('proj-status').dataset.legado='0';
        document.getElementById('proj-status').options[0].textContent='Selecione um status...';
        resetProjetoProfessores();
        resetProjetoAlunos();
        if(perfilAtual()==='professor'){
            selectedProjetoProfessores=[{id:getPessoaAtualId(),nome:sessaoAtual.nome}];
            renderSelectedProfessores();
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const btn     = document.getElementById('hamburger');
    const isOpen  = sidebar.classList.toggle('open');
    overlay.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded',String(isOpen));
    btn.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('hamburger').setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
}


let cadastrosOpen = false;
let dadosCarregados = {};
const formMap = {
    professor: {
        listId: 'listProfessor', formId: 'formProfessor', child: 'childProfessor',
        listLabel: 'Professores', formLabel: 'Professor',
        apiPath: '/usuarios?perfil=professor', listBodyId: 'profListBody',
        icon: '👨‍🏫', avatarClass: '',
        emptyMsg: 'Nenhum professor cadastrado',
        emptyHint: 'Adicione o primeiro professor ao sistema'
    },
    aluno: {
        listId: 'listAluno', formId: 'formAluno', child: 'childAluno',
        listLabel: 'Alunos', formLabel: 'Aluno',
        apiPath: '/usuarios?perfil=aluno', listBodyId: 'alunoListBody',
        icon: '👨‍🎓', avatarClass: 'green',
        emptyMsg: 'Nenhum aluno cadastrado',
        emptyHint: 'Adicione o primeiro aluno ao sistema'
    },
    projeto: {
        listId: 'listProjeto', formId: 'formProjeto', child: 'childProjeto',
        listLabel: 'Projetos', formLabel: 'Projeto',
        apiPath: '/projetos', listBodyId: 'projetoListBody',
        icon: '📝', avatarClass: 'purple',
        emptyMsg: 'Nenhum projeto cadastrado',
        emptyHint: 'Crie o primeiro projeto do laboratório'
    }
};

// ── Navegação ──────────────────────────────────────────

function renderList(type, data) {
    if (type === 'projeto') {
        return data.map(p => `
            <div class="list-item" onclick="editProjeto(${p.id})">
                <div class="list-item-avatar purple">📝</div>
                <div class="list-item-info">
                    <div class="list-item-name">${escHtml(p.nome)}</div>
                    <div class="list-item-sub">${escHtml(p.descricao || 'Sem descrição')}</div>
                    <div class="list-item-sub">Status: ${escHtml(rotuloStatusProjeto(p.status))}</div>
                    <div class="list-item-sub">Professores: ${escHtml(p.professores_texto || 'Nenhum professor vinculado.')}</div>
                    <div class="list-item-sub">Alunos: ${escHtml(p.alunos_texto || 'Nenhum aluno vinculado.')}</div>
                </div>
                <button type="button" class="btn-ghost" onclick="event.stopPropagation();abrirSubprojetosProjeto(${p.id})">Subprojetos</button>
                <button class="list-item-delete" onclick="deleteProjeto(event,${p.id})" title="Remover">🗑</button>
            </div>`).join('');
    }

    const map = formMap[type];
    return data.map(u => {
        let sub;
        if (type === 'aluno') {
            const parts = [u.turma, rotuloCurso(u.curso)].filter(Boolean);
            sub = parts.length ? parts.join(' · ') : 'Aluno';
        } else {
            sub = u.matricula || '';
        }
        return `
            <div class="list-item" onclick="editUser(${u.id},'${type}')">
                <div class="list-item-avatar ${map.avatarClass}">${map.icon}</div>
                <div class="list-item-info">
                    <div class="list-item-name">${escHtml(u.nome || u.usuario)}</div>
                    <div class="list-item-sub">${escHtml(sub)}</div>
                </div>
                <button class="list-item-delete" onclick="deleteUser(event,${u.id},'${type}')" title="Remover">🗑</button>
            </div>`;
    }).join('');
}

