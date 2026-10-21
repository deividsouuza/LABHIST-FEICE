// documentos: responsabilidades e dependências em ../MODULOS.md.
function formatarTamanhoArquivo(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderPreviewArquivo(inputId, chipId) {
    const input = document.getElementById(inputId);
    const chip = document.getElementById(chipId);
    const arquivo = input.files[0];

    if (!arquivo) {
        chip.innerHTML = '';
        return;
    }

    chip.innerHTML = `
        <div class="selected-professor-item">
            <div class="selected-professor-info">
                <div class="selected-professor-name">${escHtml(arquivo.name)}</div>
                <div class="selected-professor-meta">${formatarTamanhoArquivo(arquivo.size)}</div>
            </div>
            <button type="button" class="selected-professor-remove" onclick="removerArquivoSelecionado('${inputId}','${chipId}')">Remover</button>
        </div>`;
}

function removerArquivoSelecionado(inputId, chipId) {
    document.getElementById(inputId).value = '';
    document.getElementById(chipId).innerHTML = '';
}

function configurarPreviewArquivo(inputId, chipId) {
    document.getElementById(inputId).addEventListener('change', () => renderPreviewArquivo(inputId, chipId));
}

async function carregarDocumentosDoProjeto() {
    const projetoId=projetoAtualDetalheId,sequencia=detalheProjetoSequencia;
    const bodyEl = document.getElementById('detalheDocumentosBody');
    const perfil = perfilAtual();
    const pessoaId = getPessoaAtualId();

    if (!pessoaId || !projetoAtualDetalheId) {
        bodyEl.innerHTML = '';
        return;
    }

    const conteudoAnterior = bodyEl.innerHTML;
    bodyEl.innerHTML = '<div class="list-loading">Carregando...</div>';

    try {
        // usuario_id/perfil não vão mais na URL -- o backend agora usa a
        // identidade confirmada na sessão autenticada.
        const res = await apiFetch(`${API}/documentos?projeto_id=${projetoId}`);
        const documentos = validarLista(res.dados, 'documento');
        if(projetoAtualDetalheId!==projetoId||sequencia!==detalheProjetoSequencia)return;
        if(documentos.some(d=>d.projeto_id!==projetoId))formatoInvalido();
        await renderDocumentosList(documentos, perfil);
    } catch (erro) {
        if(projetoAtualDetalheId!==projetoId||sequencia!==detalheProjetoSequencia||erro.sessaoExpirada)return;
        mostrarErro(erro);
        bodyEl.innerHTML = conteudoAnterior || `<div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">Erro ao carregar documentos</div>
            <div class="empty-state-sub">Verifique se o servidor está rodando</div>
        </div>`;
    }
}

async function renderDocumentosList(documentos, perfil, containerId = 'detalheDocumentosBody') {
    const bodyEl = document.getElementById(containerId);

    if (!documentos || documentos.length === 0) {
        bodyEl.innerHTML = `<div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <div class="empty-state-title">Nenhum documento enviado ainda</div>
            <div class="empty-state-sub">Os documentos enviados aparecerão aqui</div>
        </div>`;
        return;
    }

    // Professor e administrador veem documentos de outras pessoas, então só
    // nesses casos vale a pena buscar os nomes de alunos e professores pra
    // identificar quem enviou cada um.
    const mostrarAutor = perfil === 'professor' || perfil === 'administrador';

    bodyEl.innerHTML = `<div class="list-items">${documentos.map(d => {
        let sub = `Enviado em: ${formatarData(d.enviado_em)}`;

        if (mostrarAutor) {
            const rotulo={aluno:'Aluno',professor:'Professor',administrador:'Administrador'}[d.autor_perfil];
            const nomeAutor=d.autoria_confirmada&&rotulo&&typeof d.autor_nome==='string'&&d.autor_nome?rotulo+': '+d.autor_nome:'Autoria pendente de identificação';
            sub = `Enviado por ${escHtml(nomeAutor)} em ${formatarData(d.enviado_em)}`;
        }

        return `
        <div class="list-item" style="cursor:default;">
            <div class="list-item-avatar">📄</div>
            <div class="list-item-info">
                <div class="list-item-name">${escHtml(d.descricao)}</div>
                <div class="list-item-sub">${sub}</div>
                ${d.texto_explicativo?'<div class="texto-projeto">'+escHtml(d.texto_explicativo)+'</div>':''}
            </div>
            <a class="list-item-delete" style="opacity:1;" href="${API}/documentos/${d.id}/download" target="_blank" rel="noopener" title="Baixar arquivo">⬇️</a>
        </div>`;
    }).join('')}</div>`;
}

async function enviarDocumento() {
    const descricao = document.getElementById('docUploadDescricao').value.trim();
    const textoExplicativo=document.getElementById('docUploadTexto').value.trim();
    if(new TextEncoder().encode(textoExplicativo).length>65535||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(textoExplicativo)){alert('Texto explicativo inválido ou excessivo.');return;}
    const arquivoInput = document.getElementById('docUploadArquivo');
    const arquivo = arquivoInput.files[0];
    const pessoaId = getPessoaAtualId();

    if (!pessoaId) { alert('Entre novamente antes de enviar um documento.'); return; }
    if (!descricao) { alert('Informe uma descrição para o documento.'); return; }
    if (Array.from(descricao).length>255) { alert('A descrição deve ter até 255 caracteres.'); return; }
    if (!arquivo) { alert('Selecione um arquivo para enviar.'); return; }

    // enviado_por/enviado_por_perfil não vão mais no formulário -- o
    // backend usa a identidade da sessão autenticada.
    const formData = new FormData();
    formData.append('projeto_id', projetoAtualDetalheId);
    formData.append('descricao', descricao);
    if(textoExplicativo)formData.append('texto_explicativo',textoExplicativo);
    formData.append('arquivo', arquivo);

    try {
        const res = await apiFetch(`${API}/projetos/${projetoAtualDetalheId}/documentos`, { method: 'POST', body: formData });
        const data = confirmarOperacao(res);
        if (res.ok) {
            document.getElementById('docUploadDescricao').value = '';
            document.getElementById('docUploadTexto').value='';
            arquivoInput.value = '';
            document.getElementById('docUploadArquivo-chip').innerHTML = '';
            await carregarDocumentosDoProjeto();
        } else {
            alert(data.erro || 'Erro ao enviar documento.');
        }
    } catch (erro) {
        mostrarErro(erro);
    }
}

// ── CRUD Professor / Aluno ────────────────────────────

