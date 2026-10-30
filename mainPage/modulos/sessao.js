// sessao: responsabilidades e dependências em ../MODULOS.md.
let sessaoAtual = null;
function perfilAtual() { return sessaoAtual?.perfil || ''; }
function getPessoaAtualId() { return sessaoAtual?.pessoa_id || ''; }

function limparEstadoSessao() {
    limparQuizPinAluno();
    limparMensagens();
    limparDadosQuizzes();
    detalheProjetoSequencia++;
    subprojetoSequencia++;contextoSubprojeto=null;
    limparParticipantesSubprojeto();
    subprojetoEditandoId=subprojetoDetalheAtualId=null;
    for(const campo of ['titulo','objetivo','descricao','temas_abordados'])document.getElementById('sub-'+campo).value='';
    sessaoAtual = null;
    document.getElementById('btnNovoProjetoProfessor').hidden=true;
    dadosCarregados = {};
    projetosDaPessoaAtual = [];
    currentEditId = currentEditProjetoId = projetoAtualDetalheId = null;
    professoresDisponiveis = []; alunosDisponiveis = [];
    selectedProjetoProfessores = []; selectedProjetoAlunos = [];
    for (const chave of ['perfil','usuario','alunoAtualId','professorAtualId']) localStorage.removeItem(chave);
    document.body.dataset.sessao = 'pendente';
    for (const form of ['formProfessor','formAluno','formProjeto']) clearForm(form);
    document.getElementById('docUploadDescricao').value = '';
    removerArquivoSelecionado('docUploadArquivo','docUploadArquivo-chip');
    document.getElementById('identidadeAtual').textContent = '';
}

async function logout() {
    try {
        const res = await apiFetch(API + '/logout', { method:'POST' });
        confirmarOperacao(res);
        limparEstadoSessao();
        window.location.replace('../login/login.html');
    } catch (erro) { if (!erro.sessaoExpirada) alert(erro.message || 'Não foi possível sair.'); }
}

function aplicarPermissoes() {
    const perfil = perfilAtual();
    document.getElementById('navMensagens').style.display=['professor','aluno'].includes(perfil)?'':'none';
    if(['professor','aluno'].includes(perfil))iniciarResumoMensagens();else limparMensagens();
    document.getElementById('btnNovoProjetoProfessor').hidden=perfil!=='professor';
    document.getElementById("navResultadosProfessor").style.display=perfil==='professor'?'':'none';
    document.getElementById('navQuizzesProfessor').style.display=perfil==='professor'?'':'none';
    document.getElementById('navHistoricoAluno').style.display=perfil==='aluno'?'':'none';
    document.getElementById('navQuizzesAluno').style.display=perfil==='aluno'?'':'none';
    if(!['administrador','professor'].includes(perfil))limparDadosQuizzes();
    document.getElementById('navParent').style.display = perfil === 'administrador' ? '' : 'none';
    document.getElementById('navChildren').style.display = perfil === 'administrador' ? '' : 'none';
    document.getElementById('navItemMeusProjetos').style.display = ['aluno','professor'].includes(perfil) ? '' : 'none';
    if (perfil === 'administrador' && !cadastrosOpen) toggleCadastros();
    document.getElementById('identidadeAtual').textContent = sessaoAtual.nome + ' · ' + perfil;
}

async function inicializarSessao() {
    document.body.dataset.sessao = 'pendente';
    const aviso = document.getElementById('sessaoStatus');
    aviso.hidden = false;
    try {
        const res = await apiFetch(API + '/sessao');
        if (!res.ok) throw new Error('Não foi possível verificar seu acesso.');
        const dados = res.dados;
        if (!dados || !['administrador','aluno','professor'].includes(dados.perfil) || !Number.isInteger(dados.conta_id) || dados.conta_id<=0 || typeof dados.nome !== 'string' || (dados.perfil==='administrador' ? dados.pessoa_id!==null : !Number.isInteger(dados.pessoa_id)||dados.pessoa_id<=0)) throw new Error('Resposta de sessão inválida.');
        if(sessaoAtual&&(sessaoAtual.conta_id!==dados.conta_id||sessaoAtual.perfil!==dados.perfil||sessaoAtual.pessoa_id!==dados.pessoa_id))limparEstadoSessao();
        sessaoAtual = Object.freeze(dados);
        for (const chave of ['perfil','usuario','alunoAtualId','professorAtualId']) localStorage.removeItem(chave);
        aplicarPermissoes();
        document.body.dataset.sessao = 'confirmada';
        aviso.hidden = true;
        return true;
    } catch (erro) {
        limparMensagens();
        sessaoAtual = null;
        aviso.querySelector('span').textContent = erro.sessaoExpirada ? 'Sessão encerrada.' : 'Não foi possível verificar seu acesso. Tente novamente.';
        return false;
    }
}

