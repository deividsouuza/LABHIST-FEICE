import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { pipeline } from 'node:stream/promises';
import { executarTransacao, transacaoIncerta } from './banco/transacao.js';
import { ErroHttp, validarIdRota, conferirExclusao, responderErro } from './erros-api.js';
import { idProjetoValido } from './projetos-validacao.js';
import { confirmarSessao } from './identidades.js';
import { autorizarProjeto, autorizarDocumento } from './acesso-academico.js';
import { abrirArquivoDocumento, nomeDownload } from './arquivos-documentos.js';
import { limitesUpload, extensaoDocumento, storageDocumento, receberDocumento, validarConteudoDocumento } from './upload-documentos.js';
import { enfileirarDocumentos, processarLimpezas, listarLimpezas } from './limpeza-arquivos.js';

export function criarDocumentos({obterPool, diretorioServidor:__dirname, requireAuth,requireAdmin,requireIdentidadeAtual}) {
    // O nome original do arquivo (file.originalname) nunca é usado pra montar
    // caminho em disco -- só a extensão dele é aproveitada, e mesmo essa contra
    // uma lista fixa. Isso fecha duas falhas ao mesmo tempo: (1) um nome tipo
    // "../../algumacoisa" não tem mais como escapar da pasta de uploads, porque
    // o nome gravado é sempre um UUID gerado aqui; (2) um nome com aspas/HTML
    // não pode mais injetar nada, porque o valor usado no caminho nunca chega a
    // conter o texto original. O nome original continua sendo salvo só como
    // texto (coluna arquivo_nome), pra exibição.
    function filtroExtensaoPermitida(req, file, cb) {
        try {extensaoDocumento(file.originalname);cb(null,true);} catch(erro){cb(erro);}
    }

    const DOCUMENTOS_UPLOAD_DIR = path.join(__dirname, 'uploads', 'documentos');
    const DOCUMENTOS_TMP_DIR = path.join(__dirname, 'uploads', '.temporarios');
    fs.mkdirSync(DOCUMENTOS_UPLOAD_DIR, { recursive: true });
    fs.mkdirSync(DOCUMENTOS_TMP_DIR, { recursive: true });

    const LIMITES_UPLOAD=limitesUpload();
    const uploadDocumento=multer({storage:storageDocumento(DOCUMENTOS_TMP_DIR),fileFilter:filtroExtensaoPermitida,defParamCharset:'utf8',
        limits:{fileSize:LIMITES_UPLOAD.arquivo,files:1,fields:LIMITES_UPLOAD.campos,parts:LIMITES_UPLOAD.campos+2,fieldSize:LIMITES_UPLOAD.campo,fieldNameSize:100,fieldNestingDepth:0}});
    const processarUpload=receberDocumento(uploadDocumento.single('arquivo'),LIMITES_UPLOAD);

    async function concluirLimpeza(ids) {
        try{return await processarLimpezas(obterPool(),DOCUMENTOS_UPLOAD_DIR,ids);}
        catch{console.error('Limpeza de arquivos pendente; fila preservada.');return {concluidas:0,pendentes:ids.length,bloqueadas:0};}
    }

    function registrar(app) {
        app.get('/limpezas/arquivos',requireAuth,requireAdmin,async(req,res)=>{
            try{res.set('Cache-Control','no-store');res.json(await listarLimpezas(obterPool()));}catch(erro){responderErro(res,erro);}
        });
        app.post('/limpezas/arquivos/repetir',requireAuth,requireAdmin,async(req,res)=>{
            try{
                const ids=req.body?.ids;
                if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(id=>idProjetoValido(id)===null)||new Set(ids.map(Number)).size!==ids.length)throw new ErroHttp(400,'Informe de 1 a 100 IDs distintos de limpeza.');
                const limpeza=await concluirLimpeza(ids.map(Number)),pendente=limpeza.pendentes+limpeza.bloqueadas>0;
                res.status(pendente?202:200).json({mensagem:pendente?'Ainda ha pendencias de limpeza.':'Limpeza verificada.',limpeza});
            }catch(erro){responderErro(res,erro);}
        });

        async function projetoExiste(projetoId) {
            const [rows] = await obterPool().query('SELECT id FROM projeto WHERE id = ?', [projetoId]);
            return rows.length > 0;
        }

        function removerArquivoSeExistir(caminhoRelativoOuAbsoluto) {
            if (!caminhoRelativoOuAbsoluto) return;

            const caminhoAbsoluto = path.isAbsolute(caminhoRelativoOuAbsoluto)
                ? caminhoRelativoOuAbsoluto
                : path.join(__dirname, caminhoRelativoOuAbsoluto);

            fs.unlink(caminhoAbsoluto, () => {});
        }

        function mapDocumentoRow(row) {
            return {
                id: row.id,
                projeto_id: row.projeto_id,
                descricao: row.descricao,
                texto_explicativo:row.texto_explicativo??null,
                download_url: `/documentos/${row.id}/download`,
                arquivo_nome: row.arquivo_nome,
                enviado_por: row.enviado_por,
                enviado_por_perfil: row.enviado_por_perfil,
                autoria_confirmada: row.autoria_confirmada===1&&row.autor_conta_id!=null,
                autor_conta_id:row.autor_conta_id??null,autor_nome:row.autor_nome??null,autor_perfil:row.autor_perfil??null,autoria_pendente:row.autor_conta_id==null,
                enviado_em: row.enviado_em
            };
        }

        function validarProjetoConsulta(req,res,next) {
            req.projetoId=idProjetoValido(req.query.projeto_id);
            if (req.projetoId===null) return res.status(400).json({erro:'Informe um projeto_id válido.'});
            next();
        }

        app.get('/documentos/autoria/pendencias',requireAuth,requireAdmin,async(req,res)=>{
            try{const [rows]=await obterPool().query('SELECT id,projeto_id,arquivo_nome,enviado_em,enviado_por,enviado_por_perfil FROM documentos WHERE autor_conta_id IS NULL ORDER BY id');res.set('Cache-Control','no-store').json(rows);}catch(erro){responderErro(res,erro);}
        });
        app.get('/documentos', requireAuth, validarProjetoConsulta, requireIdentidadeAtual, async (req,res)=>{
            if (!obterPool()) return res.status(500).json({erro:'Banco de dados nao conectado.'});
            try {
                const identidade=req.identidadeAcesso, projetoId=req.projetoId;
                await autorizarProjeto(obterPool(),projetoId,identidade);
                if (!await projetoExiste(projetoId)) throw new ErroHttp(404,'Projeto nao encontrado.');
                const aluno=identidade.perfil==='aluno';
                const [rows]=await obterPool().query(aluno
                    ? "SELECT * FROM documentos WHERE projeto_id = ? AND autor_conta_id = ? AND autor_perfil = 'aluno' AND autoria_confirmada = 1 ORDER BY enviado_em DESC"
                    : 'SELECT * FROM documentos WHERE projeto_id = ? ORDER BY enviado_em DESC',aluno?[projetoId,identidade.conta_id]:[projetoId]);
                res.set('Cache-Control','no-store');
                res.json(rows.map(mapDocumentoRow));
            } catch (erro) { responderErro(res,erro,'Erro ao carregar documentos.'); }
        });

        app.get('/documentos/:id/download',requireAuth,validarIdRota,requireIdentidadeAtual,async(req,res)=>{
            let arquivo;
            try {
                const [rows]=await obterPool().query('SELECT * FROM documentos WHERE id = ?',[req.recursoId]);
                if (!rows.length) throw new ErroHttp(404,'Documento nao encontrado.');
                const doc=rows[0];
                await autorizarProjeto(obterPool(),doc.projeto_id,req.identidadeAcesso);
                autorizarDocumento(doc,req.identidadeAcesso);
                if (!await projetoExiste(doc.projeto_id)) throw new ErroHttp(404,'Projeto nao encontrado.');
                arquivo=await abrirArquivoDocumento(DOCUMENTOS_UPLOAD_DIR,doc.arquivo_caminho);
                const nome=nomeDownload(doc.arquivo_nome);
                res.attachment(nome);
                if (!res.get('Content-Disposition').includes('filename*=')) {
                    const utf8=encodeURIComponent(nome).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
                    res.set('Content-Disposition',res.get('Content-Disposition')+"; filename*=UTF-8''"+utf8);
                }
                res.type('application/octet-stream');
                res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Length':String(arquivo.tamanho)});
                await pipeline(arquivo.handle.createReadStream(),res);
            } catch (erro) {
                if (res.headersSent) { console.error('Falha durante download autenticado.'); res.destroy(); }
                else responderErro(res,erro,'Nao foi possivel baixar o arquivo.');
            } finally { if (arquivo) await arquivo.handle.close().catch(()=>{}); }
        });

        async function preautorizarUpload(req,res,next) {
            try { await autorizarProjeto(obterPool(),req.recursoId,req.identidadeAcesso); next(); }
            catch (erro) { responderErro(res,erro); }
        }

        async function cadastrarDocumento(req,res) {
            let promovido=null;
            try {
                const projetoId=idProjetoValido(req.body?.projeto_id ?? req.recursoId);
                const descricao=typeof req.body?.descricao==='string'?req.body.descricao.trim():'';
                const bruto=req.body?.texto_explicativo;
                if(bruto!==undefined&&(typeof bruto!=='string'||Buffer.byteLength(bruto,'utf8')>65535||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(bruto)))throw new ErroHttp(400,'Texto explicativo inválido ou excessivo.');
                const textoExplicativo=bruto?.trim()||null;
                if (projetoId===null || !descricao || Array.from(descricao).length>255 || (req.recursoId && req.recursoId!==projetoId)) throw new ErroHttp(400,'Informe projeto e descricao de ate 255 caracteres validos.');
                if (!req.file) throw new ErroHttp(400,'O arquivo do documento e obrigatorio.');
                await validarConteudoDocumento(req.file,LIMITES_UPLOAD);
                const identidade=req.identidadeAcesso;
                const result=await executarTransacao(obterPool(),async banco=>{
                    // A equipe fica protegida de alterações concorrentes até a gravação.
                    const autorAtual=await confirmarSessao(banco,req.session.identidade,true);
                    await autorizarProjeto(banco,projetoId,identidade,true);
                    const destino=path.join(DOCUMENTOS_UPLOAD_DIR,req.file.filename);
                    await fs.promises.rename(req.file.path,destino);
                    promovido=destino;
                    const [result]=await banco.query('INSERT INTO documentos (projeto_id, descricao, arquivo_caminho, arquivo_nome, enviado_por, enviado_por_perfil, autoria_confirmada, autor_conta_id, autor_nome, autor_perfil, texto_explicativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [projetoId,descricao,'uploads/documentos/'+req.file.filename,req.file.originalname,
                            autorAtual.pessoa_id||autorAtual.conta_id,autorAtual.perfil,1,autorAtual.conta_id,autorAtual.nome,autorAtual.perfil,textoExplicativo]);
                    return result;
                });
                res.json({mensagem:'Documento cadastrado com sucesso.',id:result.insertId});
            } catch (erro) {
                if (promovido && transacaoIncerta(erro)) console.error('Envio com confirmacao incerta; requer conciliacao.');
                else removerArquivoSeExistir(promovido||req.file?.path);
                responderErro(res,erro,'Erro no servidor ao cadastrar documento.');
            }
        }

        // A rota com projeto na URL autoriza antes de receber bytes. O contrato antigo
        // permanece, usando somente staging privado até validar o campo multipart.
        app.post('/projetos/:id/documentos',requireAuth,validarIdRota,requireIdentidadeAtual,preautorizarUpload,processarUpload,cadastrarDocumento);
        app.post('/documentos',requireAuth,requireIdentidadeAtual,processarUpload,cadastrarDocumento);

        app.delete('/documentos/:id', requireAuth, requireAdmin, validarIdRota, async (req, res) => {
            if (!obterPool()) return res.status(500).json({ erro: 'Banco de dados nao conectado.' });

            try {
                const ids = await executarTransacao(obterPool(), async banco => {
                    const [rows] = await banco.query('SELECT * FROM documentos WHERE id = ? FOR UPDATE', [req.recursoId]);
                    if (!rows.length) throw new ErroHttp(404, 'Documento nao encontrado.');
                    const ids=await enfileirarDocumentos(banco,rows,rows[0].projeto_id);
                    const [resultado] = await banco.query('DELETE FROM documentos WHERE id=?', [req.recursoId]);
                    conferirExclusao(resultado, 'Documento nao encontrado.');
                    return ids;
                });
                const limpeza=await concluirLimpeza(ids),pendente=limpeza.pendentes+limpeza.bloqueadas>0;
                res.status(pendente?202:200).json({ mensagem:pendente?'Documento removido; limpeza do arquivo pendente.':'Documento removido com sucesso.',limpeza });
            } catch (erro) {
                responderErro(res, erro, 'Erro ao remover documento.');
            }
        });

    }
    return {registrar,concluirLimpeza};
}
