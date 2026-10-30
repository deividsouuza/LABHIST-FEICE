// Entrada do painel. Todos os módulos clássicos são carregados antes deste arquivo.
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

// ── Controle de acesso por perfil ────────────────────
configurarPreviewArquivo('docUploadArquivo', 'docUploadArquivo-chip');
configurarMensagens();
configurarMascaraTelefone('aluno-telefone');
configurarMascaraTelefone('prof-telefone');
document.getElementById('quizCampos').addEventListener('input',()=>document.getElementById('quizRevisao').replaceChildren());

const sessaoPronta = inicializarSessao();
window.addEventListener('pageshow', async evento => { if (evento.persisted && await inicializarSessao()) retomarMensagensAposNavegacao(); });
