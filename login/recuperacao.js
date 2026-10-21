(()=>{
    const form=document.getElementById('recFormulario'),mensagem=document.getElementById('recMensagem'),botao=document.getElementById('recEnviar'),modo=document.body.dataset.recuperacao;
    let enviando=false,token='';
    if(modo==='redefinir'){
        window.addEventListener('hashchange',()=>{if(location.hash)location.reload();});
        token=new URLSearchParams(location.hash.slice(1)).get('token')||'';
        history.replaceState(null,'',location.pathname);
        if(!/^[a-f0-9]{64}$/.test(token)){mensagem.textContent='Link inválido ou ausente. Solicite novas instruções.';botao.disabled=true;}
    }
    form.addEventListener('submit',async e=>{
        e.preventDefault();if(enviando||botao.disabled)return;let corpo;
        if(modo==='solicitar'){
            const usuario=document.getElementById('recUsuario').value.trim(),email=document.getElementById('recEmail').value.trim();
            if(!usuario||usuario.length>100||/[\x00-\x1f\x7f]/.test(usuario)||email.length>255||/[\s\x00-\x1f\x7f]/.test(email)||/[<>()\[\],;:"\\]/.test(email)||!/^[^@]+@[^@]+\.[^@]+$/.test(email)){mensagem.textContent='Informe usuário e e-mail válidos.';return;}corpo={usuario,email};
        }else{
            const novaSenha=document.getElementById('recSenha').value,confirmacao=document.getElementById('recConfirmacao').value;
            if(!novaSenha||new TextEncoder().encode(novaSenha).length>1024||/^\$(?:scrypt|2[aby]|argon2)/.test(novaSenha)){mensagem.textContent='Informe uma senha válida de até 1024 bytes.';return;}
            if(novaSenha!==confirmacao){mensagem.textContent='As senhas precisam ser iguais.';return;}corpo={token,novaSenha};
        }
        enviando=true;botao.disabled=true;mensagem.textContent='Aguarde...';
        try{const r=await requisitarJson(origemApi()+'/recuperacao/'+(modo==='solicitar'?'solicitar':'redefinir'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo)});if(typeof r.dados.mensagem!=='string')throw new Error('Não foi possível confirmar a operação. Tente novamente.');
            mensagem.textContent=modo==='solicitar'?'Se os dados estiverem corretos e houver contato confirmado, você receberá as instruções de recuperação.':'Senha redefinida. Volte ao login e entre com sua nova senha.';
            if(modo==='redefinir'){token='';document.getElementById('recSenha').value='';document.getElementById('recConfirmacao').value='';botao.disabled=true;}
        }catch(erro){mensagem.textContent=modo==='redefinir'&&erro.status===400?'Link inválido ou expirado, ou senha inválida. Confira os campos ou solicite novo link.':erro.message||'Não foi possível concluir. Tente novamente.';}
        finally{enviando=false;if(modo==='solicitar'||token)botao.disabled=false;}
    });
})();
