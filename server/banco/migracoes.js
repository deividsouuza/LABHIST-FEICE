import resultados from './versoes/015-resultados-quizzes.js';
import alunosSubprojetos from './versoes/016-alunos-subprojetos.js';
import mensagens from './versoes/017-mensagens.js';
import quizzesProfessor from './versoes/018-quizzes-professor.js';
import quizPin from './versoes/019-quiz-pin.js';
import disponibilidade from './versoes/014-disponibilidade-quizzes.js';
import crypto from 'node:crypto';
import base from './versoes/001-base.js';
import documentos from './versoes/002-documentos.js';
import integridade from './versoes/003-integridade-projetos.js';
import identidade from './versoes/004-identidade.js';
import acessoDocumentos from './versoes/005-acesso-documentos.js';
import limpeza from './versoes/006-limpeza-arquivos.js';
import subprojetos from './versoes/007-subprojetos.js';
import statusProjetos from './versoes/008-status-projetos.js';
import quizzes from './versoes/009-nucleo-quizzes.js';

import sessoes from './versoes/010-sessoes.js';

import autoria from './versoes/011-autoria-documentos.js';

import textoDocumentos from './versoes/012-texto-documentos.js';

import recuperacao from './versoes/013-recuperacao-senha.js';

// Manifesto ordenado e verificável. Versões publicadas não devem ser editadas;
// evoluções futuras acrescentam uma nova versão, preservando os SQL anteriores.
export const migracoes = [base, documentos, integridade, identidade, acessoDocumentos, limpeza, subprojetos, statusProjetos, quizzes, sessoes, autoria, textoDocumentos, recuperacao, disponibilidade, resultados, alunosSubprojetos, mensagens, quizzesProfessor, quizPin]
    .map(m => ({ ...m, checksum: crypto.createHash('sha256').update(JSON.stringify(m)).digest('hex') }));
export const versaoEsperada = migracoes.at(-1).versao;
