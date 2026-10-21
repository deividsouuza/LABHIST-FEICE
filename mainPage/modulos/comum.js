// comum: responsabilidades e dependências em ../MODULOS.md.
function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function rotuloCurso(curso) {
    return curso === 'Programação de Jogos Digitais' ? 'Desenvolvimento de Jogos Digitais' : curso;
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    if (isNaN(data)) return dataStr;
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

