const API = origemApi();

async function fazerLogin() {
  const usuario = document.getElementById('usuario-log').value.trim();
  const senha = document.getElementById('senha-log').value;
  const perfil = document.getElementById('perfil-log').value || 'administrador';

  if (!usuario || !senha || !['administrador','professor','aluno'].includes(perfil)) {
    alert('Selecione o perfil e preencha usuário e senha.');
    return;
  }

  try {
    const res = await requisitarJson(`${API}/login`, {
      method: 'POST',
      credentials: 'include', // manda/recebe o cookie de sessao
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha, perfil })
    });
    const data = res.dados;
    if (data.perfil!==perfil || typeof data.usuario!=='string') throw new Error('Resposta de acesso inválida. Tente novamente.');

    if (res.ok) {
      for (const chave of ['perfil','usuario','alunoAtualId','professorAtualId']) localStorage.removeItem(chave);
      window.location.href = '../mainPage/menuCadastro.html';
    } else {
      alert(data.erro || 'Usuario ou senha incorretos.');
    }
  } catch (erro) {
    alert(erro.message || 'Não foi possível entrar. Tente novamente.');
  }
}

document.getElementById('btn-entrar').addEventListener('click', fazerLogin);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    fazerLogin();
  }
});
