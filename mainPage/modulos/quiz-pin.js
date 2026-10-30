let quizPinAluno=null,quizPinAlterando=false;
function prepararQuizPinAluno(){
    if(perfilAtual()!=='aluno')return;
    if(!quizPinAluno)quizPinAluno=LabhistQuizPin.montar(document.getElementById('quizPinAluno'),{modo:'aluno',identidade:String(sessaoAtual.conta_id)+':'+getPessoaAtualId(),aoExpirar:()=>{limparEstadoSessao();window.location.replace('../login/login.html');}});
    quizPinAluno.restaurar();
}
function pausarQuizPinAluno(){quizPinAluno?.pausar();}
function limparQuizPinAluno(){quizPinAluno?.limpar();quizPinAluno=null;try{sessionStorage.removeItem('labhist.quiz-pin.aluno');}catch{}document.getElementById('quizPinAluno').replaceChildren();}
function limparGestaoPinQuiz(){document.getElementById('quizPinGestao').hidden=true;document.getElementById('quizPinCodigo').value='';document.getElementById('quizPinStatus').textContent='';document.getElementById('quizPinLink').removeAttribute('href');}
function mostrarGestaoPinQuiz(pin){
    if(perfilAtual()!=='professor'||!quizDetalheId)return;
    if(pin!==null&&(!pin||typeof pin.codigo!=='string'||!/^\d{8}$/.test(pin.codigo)||typeof pin.ativo!=='boolean'))formatoInvalido();
    document.getElementById('quizPinGestao').hidden=false;document.getElementById('quizPinCodigo').value=pin?.codigo||'';
    document.getElementById('quizPinStatus').textContent=pin?.ativo?'PIN ativo para participação.':'PIN encerrado ou ainda não gerado.';
    document.getElementById('quizPinGerar').textContent=pin?'Renovar PIN':'Gerar PIN';document.getElementById('quizPinDesativar').disabled=!pin?.ativo;
    const link=document.getElementById('quizPinLink');link.hidden=!pin?.ativo;
    if(pin?.ativo){const url=new URL('../publico/index.html',window.location.href);url.searchParams.set('pin',pin.codigo);url.hash='pin-do-quiz';link.href=url.href;}else link.removeAttribute('href');
}
async function alterarPinQuiz(acao){
    if(perfilAtual()!=='professor'||!quizDetalheId||quizPinAlterando)return;
    if(acao==='gerar'&&document.getElementById('quizPinCodigo').value&&!confirm('Gerar outro PIN? O código anterior e os acessos abertos serão encerrados.'))return;
    const id=quizDetalheId,seq=quizSequencia;quizPinAlterando=true;
    try{const res=await apiFetch(API+'/quizzes/'+id+'/pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acao})});confirmarOperacao(res);if(seq===quizSequencia&&quizDetalheId===id)mostrarGestaoPinQuiz(res.dados.pin);}
    catch(e){if(seq===quizSequencia&&!e.sessaoExpirada)document.getElementById('quizPinStatus').textContent=e.message||'Não foi possível atualizar o PIN.';}
    finally{quizPinAlterando=false;}
}
async function copiarPinQuiz(){
    const input=document.getElementById('quizPinCodigo'),codigo=input.value,seq=quizSequencia;if(!codigo)return;
    try{await navigator.clipboard.writeText(codigo);if(seq===quizSequencia)document.getElementById('quizPinStatus').textContent='PIN copiado.';}
    catch{if(seq===quizSequencia){input.focus();input.select();document.getElementById('quizPinStatus').textContent='PIN selecionado. Use a opção de copiar do seu dispositivo.';}}
}
