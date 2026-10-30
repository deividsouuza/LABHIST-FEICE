// Componente compartilhado pelo painel do aluno e pela página de visitante.
// Nunca recebe gabarito nem calcula a nota no navegador.
window.LabhistQuizPin=(()=>{
    const criar=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!==undefined)e.textContent=texto;if(classe)e.className=classe;return e;};
    function montar(container,{modo='visitante',identidade='',aoExpirar=()=>{}}={}){
        const chave='labhist.quiz-pin.'+modo;let seq=0,acesso=null,atividade=null,enviando=false,entrando=false;const pedidos=new Set();
        container.classList.add('quiz-pin');container.replaceChildren();
        const titulo=criar('h3','PIN do Quiz'),intro=criar('p','Digite o código de 8 dígitos compartilhado pelo professor.'),entrada=criar('form'),rotulo=criar('label','PIN do Quiz'),campo=criar('input'),entrar=criar('button','Acessar quiz','pin-botao'),aviso=criar('p'),painel=criar('section'),cabecalho=criar('h4'),descricao=criar('p'),form=criar('form'),perguntas=criar('div'),enviar=criar('button','Enviar respostas','pin-botao'),consultar=criar('button','Consultar resultado','pin-botao-secundario'),resultado=criar('div'),outro=criar('button','Usar outro PIN','pin-botao-secundario');
        campo.id=container.id+'-codigo';campo.type='text';campo.inputMode='numeric';campo.maxLength=8;campo.pattern='[0-9]{8}';campo.autocomplete='off';campo.required=true;campo.placeholder='00000000';campo.dataset.pin='codigo';rotulo.htmlFor=campo.id;
        entrar.type='submit';entrada.noValidate=true;entrada.append(rotulo,campo,entrar);aviso.setAttribute('role','status');aviso.setAttribute('aria-live','polite');aviso.dataset.pin='aviso';
        painel.hidden=true;painel.dataset.pin='atividade';perguntas.dataset.pin='perguntas';form.noValidate=true;enviar.type='submit';enviar.dataset.pin='enviar';consultar.type=outro.type='button';resultado.setAttribute('aria-live','polite');resultado.dataset.pin='resultado';
        form.append(perguntas,enviar);painel.append(cabecalho,descricao,form,consultar,resultado,outro);container.append(titulo,intro,entrada,aviso,painel);
        function armazenar(){try{sessionStorage.setItem(chave,JSON.stringify({acesso,pin:campo.value,identidade}));}catch{}}
        function apagarCache(){try{sessionStorage.removeItem(chave);}catch{}}
        function pausar(){seq++;for(const p of pedidos)p.abort();entrar.disabled=consultar.disabled=false;if(atividade&&!atividade.resultado){enviar.disabled=false;perguntas.querySelectorAll('input').forEach(i=>i.disabled=false);}}
        function limpar(){pausar();acesso=null;atividade=null;apagarCache();campo.value='';perguntas.replaceChildren();resultado.replaceChildren();cabecalho.textContent=descricao.textContent=aviso.textContent='';painel.hidden=true;entrada.hidden=false;campo.disabled=entrar.disabled=false;}
        async function api(rota,body){
            const c=new AbortController();pedidos.add(c);const prazo=setTimeout(()=>c.abort(),15000);
            try{
                let r;try{r=await fetch(origemApi()+'/quizzes/pin/'+rota,{method:'POST',credentials:modo==='aluno'?'include':'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:c.signal});}catch{throw new ErroApi(0,'Não foi possível conectar. Tente novamente.');}
                let d;try{d=await r.json();}catch{}
                if(r.status===401&&modo==='aluno'){limpar();aoExpirar();throw new ErroApi(401,'Sessão encerrada.',true);}
                if(!r.ok)throw new ErroApi(r.status,r.status>=500?'Não foi possível concluir. Tente novamente.':typeof d?.erro==='string'?d.erro:'Não foi possível acessar o quiz.');
                if(!d||typeof d!=='object'||Array.isArray(d))throw new Error('Resposta inválida do servidor.');return d;
            }finally{clearTimeout(prazo);pedidos.delete(c);}
        }
        function validar(q){
            if(!q||!Number.isInteger(q.id)||q.id<=0||typeof q.titulo!=='string'||typeof q.descricao!=='string'||!Array.isArray(q.perguntas)||!q.perguntas.length||q.perguntas.length>50)throw new Error('Resposta inválida do servidor.');
            for(const p of q.perguntas)if(!Number.isInteger(p.id)||typeof p.descricao!=='string'||!Array.isArray(p.alternativas)||p.alternativas.length<2||p.alternativas.some(a=>!Number.isInteger(a.id)||typeof a.descricao!=='string'||Object.hasOwn(a,'correta')))throw new Error('Resposta inválida do servidor.');
            return q;
        }
        function mostrarResultado(r){
            if(!r||r.quiz_id!==atividade.id||!Number.isInteger(r.pontuacao)||!Number.isInteger(r.total_perguntas)||r.total_perguntas!==atividade.perguntas.length||r.pontuacao<0||r.pontuacao>r.total_perguntas||typeof r.percentual!=='number'||!Number.isFinite(r.percentual)||r.percentual<0||r.percentual>100)throw new Error('Resultado inválido do servidor.');
            atividade.resultado=r;resultado.replaceChildren(criar('h4','Resultado registrado'),criar('p',`${r.pontuacao} de ${r.total_perguntas} acertos · ${new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(r.percentual)}%`),criar('p',modo==='visitante'?'Participação de visitante, sem vínculo com uma conta.':'Resultado salvo no histórico da sua conta.'));
            perguntas.querySelectorAll('input').forEach(i=>i.disabled=true);enviar.disabled=true;
        }
        function exibir(q){
            atividade=validar(q);cabecalho.textContent=q.titulo;descricao.textContent=q.descricao;perguntas.replaceChildren();resultado.replaceChildren();
            for(const [n,p] of q.perguntas.entries()){
                const bloco=criar('fieldset',undefined,'pin-pergunta');bloco.dataset.perguntaId=String(p.id);bloco.append(criar('legend',`${n+1}. ${p.descricao}`));
                for(const a of p.alternativas){const label=criar('label',undefined,'pin-alternativa'),radio=criar('input');radio.type='radio';radio.name=container.id+'-pergunta-'+p.id;radio.value=String(a.id);radio.required=true;label.append(radio,criar('span',a.descricao));bloco.append(label);}
                perguntas.append(bloco);
            }
            entrada.hidden=true;painel.hidden=false;enviar.disabled=false;if(q.resultado)mostrarResultado(q.resultado);aviso.textContent='';
        }
        function erro(e,geracao){if(geracao!==seq||e.sessaoExpirada)return;if(e.status===403){acesso=null;atividade=null;apagarCache();painel.hidden=true;entrada.hidden=false;perguntas.replaceChildren();resultado.replaceChildren();}aviso.textContent=e.message||'Não foi possível concluir.';}
        async function abrir(pin){
            if(enviando||entrando)return;entrando=true;
            try{
                campo.value=String(pin).trim();if(!/^\d{8}$/.test(campo.value)){aviso.textContent='Informe os 8 dígitos do PIN.';campo.focus();return;}
                if(await restaurar(campo.value))return;pausar();const geracao=seq;entrar.disabled=true;aviso.textContent='Localizando quiz...';
                try{const d=await api('entrar',{pin:campo.value,modo});if(geracao!==seq)return;if(typeof d.acesso!=='string')throw new Error('Resposta inválida do servidor.');exibir(d.atividade);acesso=d.acesso;armazenar();}
                catch(e){erro(e,geracao);}finally{if(geracao===seq)entrar.disabled=false;}
            }finally{entrando=false;}
        }
        async function restaurar(pinEsperado=null){
            if(enviando)return true;const geracao=++seq;let salvo;
            try{salvo=JSON.parse(sessionStorage.getItem(chave));}catch{return false;}
            if(!salvo||salvo.identidade!==identidade||typeof salvo.acesso!=='string'||!/^\d{8}$/.test(salvo.pin)||pinEsperado!==null&&salvo.pin!==pinEsperado)return false;
            campo.value=salvo.pin;aviso.textContent='Consultando participação...';
            try{const q=await api('atividade',{acesso:salvo.acesso});if(geracao!==seq)return true;exibir(q);acesso=salvo.acesso;return true;}
            catch(e){erro(e,geracao);if(e.status===403&&geracao===seq){apagarCache();return false;}return true;}
        }
        entrada.addEventListener('submit',e=>{e.preventDefault();abrir(campo.value);});
        form.addEventListener('submit',async e=>{
            e.preventDefault();if(!acesso||!atividade||atividade.resultado||enviando)return;
            const respostas=[];for(const bloco of perguntas.children){const i=bloco.querySelector('input:checked');if(!i){aviso.textContent='Responda todas as perguntas.';bloco.querySelector('input').focus();return;}respostas.push({pergunta_id:Number(bloco.dataset.perguntaId),alternativa_id:Number(i.value)});}
            const geracao=seq,token=acesso;enviando=true;enviar.disabled=true;consultar.disabled=true;perguntas.querySelectorAll('input').forEach(i=>i.disabled=true);aviso.textContent='Enviando respostas...';
            try{const d=await api('respostas',{acesso:token,respostas});if(geracao!==seq||acesso!==token)return;mostrarResultado(d.resultado);aviso.textContent=d.reenvio?'Resultado já registrado.':'Respostas e resultado registrados.';}
            catch(e){erro(e,geracao);if(geracao===seq&&![401,403].includes(e.status))aviso.textContent=e.status===409?'Esta participação já foi concluída. Consulte o resultado.':'Não foi possível confirmar o envio. Suas respostas foram preservadas. Consulte o resultado ou reenvie as mesmas respostas.';}
            finally{enviando=false;if(geracao===seq){consultar.disabled=false;if(atividade&&!atividade.resultado){enviar.disabled=false;perguntas.querySelectorAll('input').forEach(i=>i.disabled=false);}}}
        });
        consultar.addEventListener('click',async()=>{
            if(!acesso||!atividade||enviando)return;const geracao=seq;consultar.disabled=true;
            try{const q=validar(await api('atividade',{acesso}));if(geracao!==seq)return;if(q.id!==atividade.id)throw new Error('Resultado inválido.');if(q.resultado){mostrarResultado(q.resultado);aviso.textContent='Resultado salvo confirmado.';}else aviso.textContent='Nenhum resultado salvo. Suas respostas foram mantidas.';}
            catch(e){erro(e,geracao);}finally{if(geracao===seq)consultar.disabled=false;}
        });
        outro.addEventListener('click',()=>{if(!enviando){limpar();campo.focus();}});
        return {abrir,restaurar,pausar,limpar};
    }
    return {montar};
})();
