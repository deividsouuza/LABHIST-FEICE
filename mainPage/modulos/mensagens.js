// Mensagens privadas: estado somente em memória, descartado ao trocar de identidade.
let mensagensAberta=false,mensagensVersao=0,mensagensListaVersao=0,mensagensTimer=null,mensagensResumoTimer=null,mensagensBuscaTimer=null;
let mensagensAba='conversas',mensagensPagina=1,mensagensTemMais=false,chatMensagens=null,mensagensIniciando=false,mensagensResumoOcupado=false;
let mensagensReabrir=false;
const mensagensPedidos=new Set(),mensagensRascunhos=new Map();
const elMensagem=id=>document.getElementById(id);
function elementoMensagem(tag,classe,texto){const e=document.createElement(tag);if(classe)e.className=classe;if(texto!==undefined)e.textContent=texto;return e;}
function perfilMensagens(){return ['professor','aluno'].includes(perfilAtual());}
function identificadorMensagem(){
    if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function chatAtual(chat,versao){return mensagensAberta&&chatMensagens===chat&&mensagensVersao===versao&&perfilMensagens();}
function participanteMensagem(p){if(!p||!Number.isInteger(p.conta_id)||p.conta_id<=0||!Number.isInteger(p.pessoa_id)||p.pessoa_id<=0||typeof p.nome!=='string'||p.perfil!==(perfilAtual()==='professor'?'aluno':'professor'))formatoInvalido();return p;}
function mensagemValida(m,id){if(!m||!Number.isInteger(m.id)||m.id<=0||m.conversa_id!==id||!Number.isInteger(m.remetente_id)||!Number.isInteger(m.destinatario_id)||typeof m.conteudo!=='string'||typeof m.enviada_em!=='string'||!Number.isFinite(Date.parse(m.enviada_em))||m.lida_em!==null&&(typeof m.lida_em!=='string'||!Number.isFinite(Date.parse(m.lida_em))))formatoInvalido();return m;}
async function mensagemApi(caminho,opcoes={}){
    const controlador=new AbortController();mensagensPedidos.add(controlador);
    const prazo=setTimeout(()=>controlador.abort(),15000);
    try{return (await apiFetch(API+'/mensagens'+caminho,{...opcoes,signal:controlador.signal})).dados;}
    finally{clearTimeout(prazo);mensagensPedidos.delete(controlador);}
}
const mensagemJson=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function atualizarContadorMensagens(n){
    const badge=elMensagem('mensagensContador');badge.textContent=n>99?'99+':String(n);badge.hidden=!n;
    elMensagem('navMensagens').setAttribute('aria-label',n?`Mensagens, ${n} não lidas`:'Mensagens');
}
async function atualizarResumoMensagens(){
    if(!perfilMensagens()||document.hidden||mensagensResumoOcupado)return;
    const conta=sessaoAtual.conta_id,versao=mensagensVersao;mensagensResumoOcupado=true;
    try{const dados=await mensagemApi('/resumo');if(!Number.isSafeInteger(dados.nao_lidas)||dados.nao_lidas<0)formatoInvalido();if(sessaoAtual?.conta_id===conta&&versao===mensagensVersao)atualizarContadorMensagens(dados.nao_lidas);}
    catch{/* A lista aberta informa indisponibilidade; não interromper outros módulos. */}
    finally{mensagensResumoOcupado=false;}
}
function iniciarResumoMensagens(){
    clearTimeout(mensagensResumoTimer);if(!perfilMensagens())return;
    atualizarResumoMensagens();
    const repetir=async()=>{await atualizarResumoMensagens();if(perfilMensagens())mensagensResumoTimer=setTimeout(repetir,30000);};
    mensagensResumoTimer=setTimeout(repetir,30000);
}
function pausarMensagens(){
    mensagensAberta=false;mensagensVersao++;mensagensListaVersao++;
    clearTimeout(mensagensTimer);clearTimeout(mensagensBuscaTimer);
    for(const pedido of mensagensPedidos)pedido.abort();
    elMensagem('painelMensagens').style.display='none';elMensagem('navMensagens').classList.remove('open');
}
function limparMensagens(){
    mensagensReabrir=false;
    pausarMensagens();clearTimeout(mensagensResumoTimer);chatMensagens=null;mensagensRascunhos.clear();mensagensAba='conversas';mensagensPagina=1;
    for(const id of ['mensagensLista','mensagensHistorico'])elMensagem(id).replaceChildren();
    for(const id of ['mensagensListaAviso','mensagensChatAviso','mensagensPerfil'])elMensagem(id).textContent='';
    elMensagem('mensagensParticipante').textContent='Selecione uma conversa';elMensagem('mensagensBusca').value='';elMensagem('mensagensTexto').value='';
    elMensagem('mensagensTexto').disabled=true;elMensagem('mensagensEnviar').disabled=true;atualizarContadorMensagens(0);
}
function agendarMensagens(){
    clearTimeout(mensagensTimer);if(!mensagensAberta||document.hidden||!perfilMensagens())return;
    mensagensTimer=setTimeout(async()=>{
        try{await carregarListaMensagens();if(chatMensagens)await carregarNovasMensagens(chatMensagens);}
        finally{agendarMensagens();}
    },5000);
}
async function showMensagens(){
    if(!perfilMensagens())return;hideAll();closeSidebar();mensagensAberta=true;
    elMensagem('painelMensagens').style.display='block';elMensagem('navMensagens').classList.add('open');elMensagem('breadcrumbCurrent').textContent='Mensagens';
    elMensagem('painelMensagens').dataset.conversa=chatMensagens?'1':'0';
    await carregarListaMensagens();if(chatMensagens)await carregarNovasMensagens(chatMensagens);agendarMensagens();atualizarResumoMensagens();
}
async function trocarListaMensagens(aba){
    if(!mensagensAberta||!['conversas','contatos'].includes(aba))return;
    mensagensAba=aba;mensagensPagina=1;elMensagem('mensagensBusca').value='';
    await carregarListaMensagens();
}
async function paginarMensagens(direcao){
    if(!mensagensAberta||direcao<0&&mensagensPagina===1||direcao>0&&!mensagensTemMais)return;
    mensagensPagina+=direcao;await carregarListaMensagens();
}
async function carregarListaMensagens(){
    if(!mensagensAberta||document.hidden)return;
    const versao=mensagensVersao,seq=++mensagensListaVersao,aba=mensagensAba,pagina=mensagensPagina;
    elMensagem('mensagensAbaConversas').setAttribute('aria-pressed',String(aba==='conversas'));elMensagem('mensagensAbaContatos').setAttribute('aria-pressed',String(aba==='contatos'));
    try{
        const dados=await mensagemApi('/'+aba+'?'+new URLSearchParams({pagina:String(pagina),busca:elMensagem('mensagensBusca').value.trim()}));
        const lista=dados[aba];if(!Array.isArray(lista)||typeof dados.tem_mais!=='boolean'||dados.pagina!==pagina)formatoInvalido();
        for(const c of lista){participanteMensagem(aba==='contatos'?c:c.participante);if(aba==='conversas'&&(!Number.isInteger(c.id)||c.id<=0||!Number.isSafeInteger(c.nao_lidas)||c.nao_lidas<0||c.ultima_mensagem!==null&&(typeof c.ultima_mensagem?.conteudo!=='string'||!Number.isFinite(Date.parse(c.ultima_mensagem.enviada_em)))))formatoInvalido();}
        if(!mensagensAberta||versao!==mensagensVersao||seq!==mensagensListaVersao)return;
        mensagensTemMais=dados.tem_mais;const container=elMensagem('mensagensLista');container.replaceChildren();
        for(const c of lista){
            const p=aba==='contatos'?c:c.participante,botao=elementoMensagem('button','mensagens-item'),topo=elementoMensagem('span','mensagens-item-topo');botao.type='button';
            topo.append(elementoMensagem('strong','',p.nome));
            if(c.nao_lidas){const badge=elementoMensagem('span','mensagens-contador',String(c.nao_lidas));badge.setAttribute('aria-label',c.nao_lidas+' mensagens não lidas');topo.append(badge);}
            botao.append(topo,elementoMensagem('small','',p.perfil==='professor'?'Professor':'Aluno'));
            if(aba==='conversas'){
                botao.dataset.conversaId=String(c.id);botao.setAttribute('aria-current',String(chatMensagens?.id===c.id));
                botao.append(elementoMensagem('span','mensagens-previa',c.ultima_mensagem?.conteudo||'Conversa iniciada. Envie a primeira mensagem.'));
                if(c.ultima_mensagem)botao.append(elementoMensagem('small','',new Date(c.ultima_mensagem.enviada_em).toLocaleString('pt-BR')));
                botao.onclick=()=>abrirConversaMensagens(c.id,p);
            }else{botao.dataset.contaId=String(p.conta_id);botao.onclick=()=>iniciarConversaMensagens(p.conta_id);}
            container.append(botao);
        }
        elMensagem('mensagensListaAviso').textContent=lista.length?'':aba==='contatos'?'Nenhum participante encontrado com vínculo autorizado.':'Nenhuma conversa encontrada. Use “Nova conversa” para começar.';
        elMensagem('mensagensPagina').textContent=String(pagina);elMensagem('mensagensPaginaAnterior').disabled=pagina===1;elMensagem('mensagensPaginaProxima').disabled=!dados.tem_mais;
    }catch(erro){if(mensagensAberta&&versao===mensagensVersao&&seq===mensagensListaVersao&&!erro.sessaoExpirada){elMensagem('mensagensListaAviso').textContent='Não foi possível atualizar a lista. Tentaremos novamente.';elMensagem('mensagensLista').replaceChildren();}}
}
async function iniciarConversaMensagens(conta){
    if(!mensagensAberta||mensagensIniciando)return;
    const versao=mensagensVersao;mensagensIniciando=true;
    try{const c=await mensagemApi('/conversas',mensagemJson('POST',{destinatario_id:conta}));participanteMensagem(c.participante);if(!Number.isInteger(c.id)||c.id<=0)formatoInvalido();if(!mensagensAberta||versao!==mensagensVersao)return;
        mensagensAba='conversas';mensagensPagina=1;elMensagem('mensagensBusca').value='';await abrirConversaMensagens(c.id,c.participante);await carregarListaMensagens();
    }catch(erro){if(mensagensAberta&&versao===mensagensVersao&&!erro.sessaoExpirada)elMensagem('mensagensListaAviso').textContent=erro.message||'Não foi possível iniciar a conversa.';}
    finally{mensagensIniciando=false;}
}
async function abrirConversaMensagens(id,participante){
    if(!mensagensAberta)return;
    if(chatMensagens)salvarRascunhoMensagens();
    mensagensVersao++;const chat=chatMensagens={id,participante,mensagens:new Map(),cursor:0,maisAntigas:false,lidasAte:0,leituraAte:0,lendo:false,carregando:false,enviando:false};
    elMensagem('painelMensagens').dataset.conversa='1';elMensagem('mensagensHistorico').replaceChildren();elMensagem('mensagensAnteriores').hidden=true;elMensagem('mensagensNovas').hidden=true;
    elMensagem('mensagensParticipante').textContent=participante.nome;elMensagem('mensagensPerfil').textContent=participante.perfil==='professor'?'Professor':'Aluno';
    elMensagem('mensagensTexto').value=mensagensRascunhos.get(id)?.texto||'';elMensagem('mensagensTexto').disabled=true;elMensagem('mensagensEnviar').disabled=true;elMensagem('mensagensChatAviso').textContent='Carregando conversa...';
    await carregarNovasMensagens(chat);agendarMensagens();
}
function salvarRascunhoMensagens(){
    if(!chatMensagens)return;const texto=elMensagem('mensagensTexto').value,atual=mensagensRascunhos.get(chatMensagens.id);
    mensagensRascunhos.set(chatMensagens.id,{texto,cliente_id:atual?.texto.trim()===texto.trim()?atual.cliente_id:null});
}
function fecharConversaInacessivel(chat){
    if(chatMensagens!==chat)return;chatMensagens=null;elMensagem('mensagensHistorico').replaceChildren();elMensagem('mensagensParticipante').textContent='Conversa indisponível';elMensagem('mensagensPerfil').textContent='';
    elMensagem('mensagensChatAviso').textContent='O acesso à conversa não está disponível. Atualize seus vínculos com o administrador.';elMensagem('mensagensTexto').value='';elMensagem('mensagensTexto').disabled=true;elMensagem('mensagensEnviar').disabled=true;elMensagem('mensagensAnteriores').hidden=true;elMensagem('mensagensNovas').hidden=true;mensagensRascunhos.delete(chat.id);
}
async function carregarNovasMensagens(chat){
    if(!mensagensAberta||document.hidden||chat.carregando)return;const versao=mensagensVersao;chat.carregando=true;
    try{
        const inicial=chat.cursor===0;
        const dados=await mensagemApi(`/conversas/${chat.id}/mensagens`+(chat.cursor?'?apos='+chat.cursor:''));
        validarHistoricoMensagens(dados,chat.id);if(!chatAtual(chat,versao))return;
        if(inicial)chat.maisAntigas=dados.tem_mais;
        chat.participante=dados.participante;chat.lidasAte=dados.lidas_ate;
        elMensagem('mensagensParticipante').textContent=dados.participante.nome;
        for(const m of dados.mensagens){chat.mensagens.set(m.id,m);chat.cursor=Math.max(chat.cursor,m.id);}
        renderHistoricoMensagens(chat,inicial);
        elMensagem('mensagensChatAviso').textContent='';elMensagem('mensagensTexto').disabled=chat.enviando;elMensagem('mensagensEnviar').disabled=chat.enviando;
        await registrarLeituraMensagens(chat);
    }catch(erro){if(!chatAtual(chat,versao)||erro.sessaoExpirada)return;if([403,404].includes(erro.status))fecharConversaInacessivel(chat);else elMensagem('mensagensChatAviso').textContent='Não foi possível atualizar a conversa. Tentaremos novamente.';}
    finally{chat.carregando=false;}
}
function validarHistoricoMensagens(dados,id){
    if(dados.conversa_id!==id||!Array.isArray(dados.mensagens)||typeof dados.tem_mais!=='boolean'||!Number.isInteger(dados.lidas_ate)||dados.lidas_ate<0)formatoInvalido();
    participanteMensagem(dados.participante);dados.mensagens.forEach(m=>mensagemValida(m,id));
}
function pertoDoFimMensagens(){const h=elMensagem('mensagensHistorico');return h.scrollHeight-h.clientHeight-h.scrollTop<80;}
function renderHistoricoMensagens(chat,inicial=false,reconstruir=false){
    const h=elMensagem('mensagensHistorico'),seguir=inicial||pertoDoFimMensagens();
    if(reconstruir)h.replaceChildren();
    for(const m of [...chat.mensagens.values()].sort((a,b)=>a.id-b.id)){
        let artigo=h.querySelector('[data-mensagem-id="'+m.id+'"]');
        const propria=m.remetente_id===sessaoAtual.conta_id;
        if(!artigo){
            artigo=elementoMensagem('article','mensagem-balao'+(propria?' mensagem-propria':''));artigo.dataset.mensagemId=String(m.id);artigo.append(elementoMensagem('p','',m.conteudo));
            const footer=elementoMensagem('footer'),tempo=elementoMensagem('time','',new Date(m.enviada_em).toLocaleString('pt-BR'));tempo.dateTime=m.enviada_em;footer.append(tempo,elementoMensagem('span','mensagem-situacao'));artigo.append(footer);h.insertBefore(artigo,[...h.children].find(e=>Number(e.dataset.mensagemId)>m.id)||null);
        }
        artigo.classList.toggle('mensagem-nova',!propria&&!m.lida_em);
        artigo.querySelector('.mensagem-situacao').textContent=propria?(m.lida_em||m.id<=chat.lidasAte?'Lida':'Enviada'):(!m.lida_em?'Nova':'');
    }
    elMensagem('mensagensAnteriores').hidden=!chat.maisAntigas;
    if(seguir){h.scrollTop=h.scrollHeight;elMensagem('mensagensNovas').hidden=true;}
    else if([...chat.mensagens.values()].some(m=>m.destinatario_id===sessaoAtual.conta_id&&!m.lida_em))elMensagem('mensagensNovas').hidden=false;
}
async function carregarAnterioresMensagens(){
    const chat=chatMensagens,versao=mensagensVersao;if(!chat||!chat.maisAntigas||chat.carregando)return;chat.carregando=true;
    const h=elMensagem('mensagensHistorico'),altura=h.scrollHeight,pos=h.scrollTop;
    try{const antes=Math.min(...chat.mensagens.keys()),dados=await mensagemApi(`/conversas/${chat.id}/mensagens?antes=${antes}`);validarHistoricoMensagens(dados,chat.id);if(!chatAtual(chat,versao))return;
        dados.mensagens.forEach(m=>chat.mensagens.set(m.id,m));chat.maisAntigas=dados.tem_mais;chat.lidasAte=dados.lidas_ate;renderHistoricoMensagens(chat,false,true);h.scrollTop=pos+h.scrollHeight-altura;
    }catch(erro){if(chatAtual(chat,versao)&&!erro.sessaoExpirada){if([403,404].includes(erro.status))fecharConversaInacessivel(chat);else elMensagem('mensagensChatAviso').textContent='Não foi possível carregar o histórico anterior.';}}
    finally{chat.carregando=false;}
}
async function registrarLeituraMensagens(chat){
    if(!chatMensagens||chat!==chatMensagens||!mensagensAberta||document.hidden||chat.lendo||!pertoDoFimMensagens())return;
    const recebidas=[...chat.mensagens.values()].filter(m=>m.destinatario_id===sessaoAtual.conta_id&&!m.lida_em);
    const ate=recebidas.length?Math.max(...recebidas.map(m=>m.id)):0;if(ate<=chat.leituraAte)return;
    const versao=mensagensVersao;chat.lendo=true;
    try{const r=await mensagemApi(`/conversas/${chat.id}/leitura`,mensagemJson('POST',{ate_id:ate}));if(typeof r.mensagem!=='string')formatoInvalido();if(!chatAtual(chat,versao))return;
        chat.leituraAte=ate;for(const m of recebidas)if(m.id<=ate)m.lida_em=new Date().toISOString();renderHistoricoMensagens(chat);atualizarResumoMensagens();
    }catch(erro){if(chatAtual(chat,versao)&&[403,404].includes(erro.status))fecharConversaInacessivel(chat);}
    finally{chat.lendo=false;}
}
async function enviarMensagem(evento){
    evento?.preventDefault();const chat=chatMensagens;if(!chat||!mensagensAberta||chat.enviando||elMensagem('mensagensTexto').disabled)return;
    const texto=elMensagem('mensagensTexto').value.trim();if(!texto||Array.from(texto).length>4000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\uD800-\uDFFF]/u.test(texto)){elMensagem('mensagensChatAviso').textContent='Escreva uma mensagem válida com até 4000 caracteres.';return;}
    salvarRascunhoMensagens();const rascunho=mensagensRascunhos.get(chat.id);rascunho.cliente_id=rascunho.cliente_id||identificadorMensagem();
    const versao=mensagensVersao,conta=sessaoAtual.conta_id;chat.enviando=true;elMensagem('mensagensEnviar').disabled=true;elMensagem('mensagensTexto').disabled=true;elMensagem('mensagensChatAviso').textContent='Enviando...';
    try{const dados=await mensagemApi(`/conversas/${chat.id}/mensagens`,mensagemJson('POST',{conteudo:texto,cliente_id:rascunho.cliente_id}));mensagemValida(dados.mensagem,chat.id);
        if(sessaoAtual?.conta_id!==conta)return;mensagensRascunhos.delete(chat.id);if(!chatAtual(chat,versao))return;
        elMensagem('mensagensTexto').value='';chat.mensagens.set(dados.mensagem.id,dados.mensagem);renderHistoricoMensagens(chat,true);elMensagem('mensagensChatAviso').textContent='';await carregarNovasMensagens(chat);await carregarListaMensagens();
    }catch(erro){if(chatAtual(chat,versao)&&!erro.sessaoExpirada){if([403,404].includes(erro.status))fecharConversaInacessivel(chat);else elMensagem('mensagensChatAviso').textContent=erro.status===429?'Limite de envios atingido. Aguarde um minuto; seu texto foi preservado.':'Não foi possível confirmar o envio. Seu texto foi preservado; tente novamente.';}}
    finally{chat.enviando=false;if(chatAtual(chat,versao)){elMensagem('mensagensEnviar').disabled=false;elMensagem('mensagensTexto').disabled=false;}}
}
function irAoFimMensagens(){const h=elMensagem('mensagensHistorico');h.scrollTop=h.scrollHeight;elMensagem('mensagensNovas').hidden=true;if(chatMensagens)registrarLeituraMensagens(chatMensagens);}
function voltarConversasMensagens(){salvarRascunhoMensagens();mensagensVersao++;chatMensagens=null;elMensagem('painelMensagens').dataset.conversa='0';elMensagem('mensagensHistorico').replaceChildren();elMensagem('mensagensTexto').value='';elMensagem('mensagensTexto').disabled=true;elMensagem('mensagensEnviar').disabled=true;carregarListaMensagens();}
function configurarMensagens(){
    elMensagem('mensagensFormulario').addEventListener('submit',enviarMensagem);
    elMensagem('mensagensTexto').addEventListener('input',salvarRascunhoMensagens);
    elMensagem('mensagensBusca').addEventListener('input',()=>{clearTimeout(mensagensBuscaTimer);mensagensBuscaTimer=setTimeout(()=>{mensagensPagina=1;carregarListaMensagens();},300);});
    elMensagem('mensagensHistorico').addEventListener('scroll',()=>{if(chatMensagens&&pertoDoFimMensagens())registrarLeituraMensagens(chatMensagens);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(mensagensTimer);clearTimeout(mensagensResumoTimer);}else{iniciarResumoMensagens();if(mensagensAberta){carregarListaMensagens();if(chatMensagens)carregarNovasMensagens(chatMensagens);agendarMensagens();}}});
    window.addEventListener('pagehide',()=>{mensagensReabrir=mensagensAberta;pausarMensagens();clearTimeout(mensagensResumoTimer);});
}
function retomarMensagensAposNavegacao(){const reabrir=mensagensReabrir;mensagensReabrir=false;if(reabrir&&perfilMensagens())return showMensagens();}
