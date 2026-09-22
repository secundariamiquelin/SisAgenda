// Sessão em cookie HttpOnly assinado com HMAC-SHA256.
// Para derrubar todas as sessões abertas, basta trocar o SESSION_SECRET na Vercel.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthUser } from '../../src/types';

const COOKIE = 'sisagenda_sessao';
const DURACAO_SEGUNDOS = 7 * 24 * 60 * 60;

function segredo() {
  const valor = process.env.SESSION_SECRET ?? '';
  if (valor.length < 32) throw new Error('SESSION_SECRET ausente ou com menos de 32 caracteres.');
  return valor;
}

const assinar = (conteudo: string) => createHmac('sha256', segredo()).update(conteudo).digest('base64url');

const atributos = (maxAge: number) => `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

export function cookieDeSessao(usuario: AuthUser) {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS;
  const conteudo = Buffer.from(JSON.stringify({ id: usuario.id, email: usuario.email, exp: expira })).toString(
    'base64url'
  );
  return `${COOKIE}=${conteudo}.${assinar(conteudo)}; ${atributos(DURACAO_SEGUNDOS)}`;
}

export const cookieApagado = () => `${COOKIE}=; ${atributos(0)}`;

export function lerSessao(request: Request): AuthUser | null {
  const bruto = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!bruto) return null;

  const [conteudo, assinatura] = bruto.split('.');
  if (!conteudo || !assinatura) return null;

  const esperada = Buffer.from(assinar(conteudo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  try {
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'));
    if (typeof dados.exp !== 'number' || dados.exp < Date.now() / 1000) return null;
    return { id: String(dados.id), email: String(dados.email) };
  } catch {
    return null;
  }
}
