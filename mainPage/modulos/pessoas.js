// pessoas: responsabilidades e dependências em ../MODULOS.md.
let currentEditId = null;
function formatarTelefonePessoa(valor) {
    // Preserve caracteres inesperados e dígitos excedentes para a validação:
    // uma colagem inválida não pode virar silenciosamente outro telefone válido.
    if (/[^\d()\s-]/.test(valor)) return valor;
    const digitos = valor.replace(/\D/g, '');
    if (!digitos) return '';
    if (digitos.length <= 2) return '(' + digitos;
    const inicio = '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 7);
    return digitos.length > 7 ? inicio + '-' + digitos.slice(7) : inicio;
}

function configurarMascaraTelefone(id) {
    const input = document.getElementById(id);
    const aplicar = event => {
        if (event.isComposing) return;
        const valor = input.value;
        const cursor = input.selectionStart ?? valor.length;
        const digitosAntes = valor.slice(0, cursor).replace(/\D/g, '').length;
        const formatado = formatarTelefonePessoa(valor);
        if (formatado === valor) return;
        input.value = formatado;
        let posicao = 0;
        let encontrados = 0;
        while (posicao < formatado.length && encontrados < digitosAntes) {
            if (/\d/.test(formatado[posicao])) encontrados++;
            posicao++;
        }
        if (!event.inputType?.startsWith('delete')) {
            while (posicao < formatado.length && /\D/.test(formatado[posicao])) posicao++;
        }
        input.setSelectionRange(posicao, posicao);
    };
    input.addEventListener('input', aplicar);
    input.addEventListener('compositionend', aplicar);
    input.addEventListener('beforeinput', event => {
        if (input.selectionStart !== input.selectionEnd) return;
        const inicio = input.selectionStart;
        const paraTras = event.inputType === 'deleteContentBackward';
        const paraFrente = event.inputType === 'deleteContentForward';
        if (!paraTras && !paraFrente) return;
        let indice = paraTras ? inicio - 1 : inicio;
        if (indice < 0 || indice >= input.value.length || /\d/.test(input.value[indice])) return;
        while (indice >= 0 && indice < input.value.length && /\D/.test(input.value[indice])) {
            indice += paraTras ? -1 : 1;
        }
        if (indice < 0 || indice >= input.value.length) return;
        event.preventDefault();
        input.setRangeText('', paraTras ? indice : inicio, paraTras ? inicio : indice + 1, 'start');
        input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: event.inputType }));
    });
}

function emailPessoaValido(valor) {
    const partes = valor.split('@');
    if (partes.length !== 2) return false;
    const [local, dominio] = partes;
    if (!local || local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_\x60{|}~.-]+$/i.test(local)) return false;
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
    const rotulos = dominio.split('.');
    return rotulos.length >= 2 && rotulos.every(rotulo =>
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(rotulo)
    );
}

function validarFormularioPessoa(tipo) {
    const prefixo = tipo === 'aluno' ? 'aluno' : 'prof';
    const dados = {};
    const erro = (campo, mensagem) => {
        alert(mensagem);
        document.getElementById(prefixo + '-' + campo)?.focus();
        return null;
    };
    for (const [campo, rotulo, limite] of [
        ['nome', 'Nome', 255], ['matricula', 'Matrícula', 100],
        ['email', 'E-mail', 255], ['telefone', 'Telefone', 50]
    ]) {
        dados[campo] = document.getElementById(prefixo + '-' + campo).value.trim();
        if (!dados[campo] && (tipo === 'aluno' || campo === 'nome')) {
            return erro(campo, rotulo + ' é obrigatório.');
        }
        if (Array.from(dados[campo]).length > limite || /[\u0000-\u001f\u007f]/.test(dados[campo])) {
            return erro(campo, rotulo + ' deve conter texto válido de até ' + limite + ' caracteres.');
        }
    }
    if (dados.matricula && !/^\d+$/.test(dados.matricula)) {
        return erro('matricula', 'Matrícula deve conter somente dígitos de um inteiro não negativo.');
    }
    if (dados.email && !emailPessoaValido(dados.email)) {
        return erro('email', 'Informe um e-mail válido.');
    }
    dados.telefone = formatarTelefonePessoa(dados.telefone);
    if (dados.telefone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(dados.telefone)) {
        return erro('telefone', 'Informe o telefone completo no formato (99) 99999-9999.');
    }
    if (tipo === 'aluno') {
        dados.curso = document.querySelector('input[name="curso"]:checked')?.value || '';
        dados.turma = document.querySelector('input[name="turma"]:checked')?.value || '';
        if (!['Programação de Jogos Digitais', 'Energias Renováveis', 'Edificações', 'Eletrotécnica'].includes(dados.curso)) {
            return erro('curso', 'Selecione um curso.');
        }
        if (!['1° Ano', '2° Ano', '3° Ano'].includes(dados.turma)) {
            return erro('turma', 'Selecione uma turma.');
        }
    }
    return dados;
}

async function editUser(id, type) {
    try {
        const res = await apiFetch(`${API}/usuarios/${id}?perfil=${type}`);
        const u = validarRegistro(res.dados, type);
        currentEditId = id;

        if (type === 'professor') {
            document.getElementById('prof-nome').value      = u.nome      || '';
            document.getElementById('prof-matricula').value = u.matricula || '';
            document.getElementById('prof-email').value     = u.email     || '';
            document.getElementById('prof-telefone').value  = formatarTelefonePessoa(u.telefone || '');
        } else {
            document.getElementById('aluno-nome').value      = u.nome      || '';
            document.getElementById('aluno-matricula').value = u.matricula || '';
            document.getElementById('aluno-email').value     = u.email     || '';
            document.getElementById('aluno-telefone').value  = formatarTelefonePessoa(u.telefone || '');
            document.querySelectorAll('input[name="curso"]').forEach(r => r.checked = r.value === u.curso);
            document.querySelectorAll('input[name="turma"]').forEach(r => r.checked = r.value === u.turma);
        }

        document.getElementById((type === 'professor' ? 'prof' : 'aluno') + '-acesso').hidden = true;
        setSubmitLabel(type, true);
        const map = formMap[type];
        document.getElementById(map.listId).style.display = 'none';
        document.getElementById(map.formId).style.display = 'block';
        document.getElementById('breadcrumbCurrent').textContent = `Editar ${map.formLabel}`;
    } catch (erro) {
        mostrarErro(erro);
    }
}

function credenciaisFormulario(tipo) {
    const prefixo = tipo === 'professor' ? 'prof' : 'aluno';
    const usuario = document.getElementById(prefixo + '-usuario').value.trim();
    const senha = document.getElementById(prefixo + '-senha').value;
    if (!usuario && !senha) return {};
    if (!usuario || !senha || usuario.length > 100 || new TextEncoder().encode(senha).length > 1024 || /^\$(?:scrypt|2[aby]|argon2)/.test(senha)) {
        alert('Informe usuário e senha válidos para criar o acesso.');
        return null;
    }
    return { credenciais: { usuario, senha } };
}

async function submitProfessor() {
    const dados = validarFormularioPessoa('professor');
    if (!dados) return;
    const acesso = currentEditId === null ? credenciaisFormulario('professor') : {};
    if (!acesso) return;
    const { nome, matricula, email, telefone } = dados;

    try {
        let res;
        if (currentEditId !== null) {
            res = await apiFetch(`${API}/usuarios/${currentEditId}?perfil=professor`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, matricula, email, telefone, curso: '', turma: '' })
            });
        } else {
            res = await apiFetch(`${API}/cadastro-dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, matricula, email, telefone, curso: '', turma: '', perfil: 'professor', ...acesso })
            });
        }
        const data = confirmarOperacao(res);
        if (res.ok) { clearForm('formProfessor'); backToList('professor'); }
        else alert(data.erro || 'Erro ao salvar professor.');
    } catch (erro) { mostrarErro(erro); }
}

async function submitAluno() {
    const dados = validarFormularioPessoa('aluno');
    if (!dados) return;
    const acesso = currentEditId === null ? credenciaisFormulario('aluno') : {};
    if (!acesso) return;
    const { nome, matricula, email, telefone, curso, turma } = dados;

    try {
        let res;
        if (currentEditId !== null) {
            res = await apiFetch(`${API}/usuarios/${currentEditId}?perfil=aluno`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, matricula, email, telefone, curso, turma })
            });
        } else {
            res = await apiFetch(`${API}/cadastro-dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, matricula, email, telefone, curso, turma, perfil: 'aluno', ...acesso })
            });
        }
        const data = confirmarOperacao(res);
        if (res.ok) { clearForm('formAluno'); backToList('aluno'); }
        else alert(data.erro || 'Erro ao salvar aluno.');
    } catch (erro) { mostrarErro(erro); }
}

async function deleteUser(event, id, type) {
    event.stopPropagation();
    if (!confirm('Tem certeza que deseja remover este registro?')) return;
    try {
        const res = await apiFetch(`${API}/usuarios/${id}?perfil=${type}`, { method: 'DELETE' });
        confirmarOperacao(res);
        if (res.ok) showForm(type);
        else alert('Erro ao remover registro.');
    } catch (erro) { mostrarErro(erro); }
}

