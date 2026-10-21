import { normalizarPerfil } from './identidades.js';

const PERFIL_TABLES = {
    professor: 'professor',
    aluno: 'aluno'
};



// Os valores de integração permanecem compatíveis com os radios/filtros atuais.
// A nomenclatura da ERS e os rótulos legados representam os mesmos quatro cursos.
const CURSOS_PESSOA = new Map(
    [
        ['Programação de Jogos Digitais', ['Programação de Jogos Digitais', 'Desenvolvimento de Jogos Digitais']],
        ['Energias Renováveis', ['Energias Renováveis']],
        ['Edificações', ['Edificações']],
        ['Eletrotécnica', ['Eletrotécnica']]
    ].flatMap(([valor, nomes]) => nomes.flatMap(nome =>
        [nome, 'Integrado em ' + nome].map(alias => [alias.normalize('NFC').toLocaleLowerCase('pt-BR'), valor])
    ))
);
const TURMAS_PESSOA = new Map(
    [1, 2, 3].flatMap(ano => [ano + '° ano', ano + 'º ano'].map(alias => [alias, ano + '° Ano']))
);

function normalizarCurso(valor) {
    return typeof valor === 'string'
        ? CURSOS_PESSOA.get(valor.trim().normalize('NFC').toLocaleLowerCase('pt-BR')) || ''
        : '';
}

function normalizarTurma(valor) {
    return typeof valor === 'string'
        ? TURMAS_PESSOA.get(valor.trim().toLocaleLowerCase('pt-BR')) || ''
        : '';
}

function emailValido(valor) {
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

// Mesmo contrato para POST e PUT. Nenhuma consulta é executada na validação.
// Regra aprovada: professor exige só nome; opcionais são validados se informados.
export function validarPessoaPayload(req, res, next) {
    const erros = {};
    const rejeitar = () => res.status(400).json({ erro: Object.values(erros)[0], campos: erros });
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        erros.corpo = 'Envie os dados da pessoa como um objeto JSON.';
        return rejeitar();
    }

    const perfil = normalizarPerfil(req.method === 'POST' ? req.body.perfil : req.query.perfil);
    if (!Object.hasOwn(PERFIL_TABLES, perfil)) {
        erros.perfil = 'Informe um perfil válido: aluno ou professor.';
        return rejeitar();
    }
    const aluno = perfil === 'aluno';
    const lerCampo = (campo, rotulo, limite, obrigatorio, numerico = false) => {
        let valor = req.body[campo];
        if (valor == null) valor = '';
        if (numerico && typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0) {
            valor = String(valor);
        }
        if (typeof valor !== 'string') {
            erros[campo] = rotulo + ' deve ser ' + (numerico ? 'um inteiro não negativo ou texto numérico.' : 'um texto.');
            return '';
        }
        valor = valor.trim();
        if (obrigatorio && !valor) erros[campo] = rotulo + ' é obrigatório.';
        else if (Array.from(valor).length > limite) erros[campo] = rotulo + ' deve ter no máximo ' + limite + ' caracteres.';
        else if (/[\u0000-\u001f\u007f]/.test(valor)) erros[campo] = rotulo + ' contém caracteres inválidos.';
        return valor;
    };
    const dados = {
        nome: lerCampo('nome', 'Nome', 255, true),
        matricula: lerCampo('matricula', 'Matrícula', 100, aluno, true),
        email: lerCampo('email', 'E-mail', 255, aluno),
        telefone: lerCampo('telefone', 'Telefone', 50, aluno),
        curso: aluno ? lerCampo('curso', 'Curso', 255, true) : '',
        turma: aluno ? lerCampo('turma', 'Turma', 100, true) : ''
    };

    if (!erros.matricula && dados.matricula && !/^\d+$/.test(dados.matricula)) {
        erros.matricula = 'Matrícula deve conter somente dígitos de um inteiro não negativo.';
    }
    if (!erros.email && dados.email && !emailValido(dados.email)) {
        erros.email = 'Informe um e-mail válido.';
    }
    if (!erros.telefone && dados.telefone) {
        if (!/^(?:\d{11}|\(\d{2}\) ?\d{5}-\d{4})$/.test(dados.telefone)) {
            erros.telefone = 'Informe o telefone com DDD no formato (99) 99999-9999 ou com 11 dígitos.';
        } else {
            const digitos = dados.telefone.replace(/\D/g, '');
            dados.telefone = '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 7) + '-' + digitos.slice(7);
        }
    }
    if (aluno && !erros.curso) {
        dados.curso = normalizarCurso(dados.curso);
        if (!dados.curso) erros.curso = 'Selecione um dos quatro cursos integrados previstos na ERS.';
    }
    if (aluno && !erros.turma) {
        dados.turma = normalizarTurma(dados.turma);
        if (!dados.turma) erros.turma = 'Selecione uma turma: 1º, 2º ou 3º ano.';
    }

    if (Object.keys(erros).length) return rejeitar();
    req.pessoaPayload = { table: getPessoaTable(perfil), ...dados };
    next();
}


export function getPessoaTable(perfil) {
    return Object.hasOwn(PERFIL_TABLES, perfil) ? PERFIL_TABLES[perfil] : null;
}
export function mapProfessorRow(row) {
    return {
        id: row.id,
        usuario: row.usuario || '',
        perfil: 'professor',
        nome: row.nome || '',
        matricula: row.matricula || '',
        email: row.email || '',
        telefone: row.telefone || '',
        curso: '',
        turma: ''
    };
}

export function mapAlunoRow(row) {
    return {
        id: row.id,
        usuario: row.usuario || '',
        perfil: 'aluno',
        nome: row.nome || '',
        matricula: row.matricula || '',
        email: row.email || '',
        telefone: row.telefone || '',
        curso: normalizarCurso(row.curso) || row.curso || '',
        turma: normalizarTurma(row.turma) || row.turma || ''
    };
}

