import nodemailer from 'nodemailer';
export const emailValido=v=>typeof v==='string'&&v.length<=255&&!/[\s\x00-\x1f\x7f]/.test(v)&&!/[<>()\[\],;:"\\]/.test(v)&&/^[^@]+@[^@]+\.[^@]+$/.test(v);
export function configurarRecuperacao(env,operacao){
    let origem=env.RECOVERY_PUBLIC_ORIGIN||operacao.appOrigin||'';
    if(origem){try{const u=new URL(origem);if(u.origin!==origem||!['http:','https:'].includes(u.protocol)||operacao.producao&&u.protocol!=='https:')throw 0;}catch{throw new Error('RECOVERY_PUBLIC_ORIGIN inválida.');}}
    const presentes=['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].some(k=>env[k]);if(!presentes)return {origem,smtp:null};
    if(['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].some(k=>typeof env[k]!=='string'||!env[k])||!emailValido(env.SMTP_FROM)||/[\s\x00-\x1f]/.test(env.SMTP_HOST))throw new Error('Configuração SMTP incompleta ou inválida.');
    const port=Number(env.SMTP_PORT||587);if(![465,587].includes(port))throw new Error('SMTP_PORT deve ser 465 ou 587 com TLS.');
    return {origem,smtp:{host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},from:env.SMTP_FROM}};
}
export function criarTransporte(config,criar=nodemailer.createTransport){
    if(!config.smtp||!config.origem)return {disponivel:false};
    const {from,...smtp}=config.smtp;
    const cliente=criar({...smtp,logger:false,debug:false,disableFileAccess:true,disableUrlAccess:true,maxRecipients:1,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
    return {disponivel:true,enviar:({email,url})=>cliente.sendMail({from,to:email,subject:'LabHist — redefinição de senha',text:'Use o link para definir uma nova senha. Ele expira em 30 minutos e só pode ser usado uma vez.\n\n'+url+'\n\nSe não solicitou, ignore esta mensagem.'})};
}
