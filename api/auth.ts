// GET: quem está logado · POST: entrar · DELETE: sair
import bcrypt from 'bcryptjs';
import { consulta } from './_lib/db.js';
import { ErroHttp, json, lerCorpo, tratar } from './_lib/http.js';
import { cookieApagado, cookieDeSessao, lerSessao } from './_lib/sessao.js';

const LIMITE_TENTATIVAS = 10;
const JANELA_MINUTOS = 15;

// Hash de uma senha aleatória descartada: quando o e-mail não existe, a comparação custa o
// mesmo tempo e não revela quais e-mails estão cadastrados.
const HASH_FALSO = '$2b$12$fgv7s1.sIM5.zmS6u/wTLutKB4TpOos6l4asnzj.87jE4GjJAqvLm';

export const GET = tratar(async (request) => json({ usuario: lerSessao(request) }));

export const POST = tratar(async (request) => {
  const corpo = await lerCorpo(request);
  const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : '';
  const senha = typeof corpo.senha === 'string' ? corpo.senha : '';
  if (!email || !senha) throw new ErroHttp(400, 'Preencha o e-mail e a senha para continuar.');

  const [{ total }] = await consulta<{ total: number }>(
    `SELECT count(*)::int AS total FROM login_tentativas
      WHERE email = $1 AND criado_em > now() - make_interval(mins => $2)`,
    [email, JANELA_MINUTOS]
  );
  if (total >= LIMITE_TENTATIVAS) {
    throw new ErroHttp(429, `Muitas tentativas seguidas. Espere ${JANELA_MINUTOS} minutos e tente de novo.`);
  }

  const [usuario] = await consulta<{ id: string; email: string; senha_hash: string }>(
    'SELECT id, email, senha_hash FROM usuarios WHERE email = $1',
    [email]
  );
  const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);

  if (!usuario || !senhaConfere) {
    await consulta('INSERT INTO login_tentativas (email) VALUES ($1)', [email]);
    throw new ErroHttp(401, 'E-mail ou senha incorretos.');
  }

  await consulta(
    `DELETE FROM login_tentativas WHERE email = $1 OR criado_em < now() - make_interval(mins => $2)`,
    [email, JANELA_MINUTOS]
  );
  const sessao = { id: usuario.id, email: usuario.email };
  return json({ usuario: sessao }, 200, { 'set-cookie': cookieDeSessao(sessao) });
});

export const DELETE = tratar(async () => json({ ok: true }, 200, { 'set-cookie': cookieApagado() }));
