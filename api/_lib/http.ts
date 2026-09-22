// Respostas, erros e o envelope comum das funções da API.
import type { AuthUser } from '../../src/types';
import { lerSessao } from './sessao.js';

/** Erro com status HTTP e mensagem que pode ser mostrada para quem usa o sistema. */
export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export const json = (dados: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });

export async function lerCorpo(request: Request): Promise<Record<string, unknown>> {
  try {
    const corpo = await request.json();
    if (corpo && typeof corpo === 'object' && !Array.isArray(corpo)) return corpo as Record<string, unknown>;
  } catch {
    // cai no erro abaixo
  }
  throw new ErroHttp(400, 'Os dados enviados estão em um formato inválido.');
}

/** Códigos de erro do Postgres que viram mensagens para o usuário. */
const ERROS_DO_BANCO: Record<string, [number, string]> = {
  '23505': [409, 'Já existe outro agendamento ativo cadastrado para este dia e horário.'],
  '23503': [400, 'A criança ou a terapia escolhida não existe mais. Recarregue a página.']
};

type Tratador = (request: Request) => Promise<Response>;

/** Converte erros em respostas JSON sem vazar detalhes internos. */
export const tratar =
  (fn: Tratador): Tratador =>
  async (request) => {
    try {
      // Um cabeçalho próprio força o preflight de CORS: outro site não consegue
      // disparar escritas usando o cookie de quem está logado.
      if (request.method !== 'GET' && request.headers.get('x-sisagenda') !== '1') {
        throw new ErroHttp(403, 'Requisição recusada.');
      }
      return await fn(request);
    } catch (erro) {
      if (erro instanceof ErroHttp) return json({ erro: erro.message }, erro.status);
      const codigo = (erro as { code?: string })?.code;
      if (codigo && ERROS_DO_BANCO[codigo]) {
        const [status, mensagem] = ERROS_DO_BANCO[codigo];
        return json({ erro: mensagem }, status);
      }
      console.error(erro);
      return json({ erro: 'Erro interno no servidor. Tente de novo em instantes.' }, 500);
    }
  };

/** Igual a `tratar`, mas só deixa passar quem tem sessão válida. */
export const comSessao = (fn: (request: Request, usuario: AuthUser) => Promise<Response>): Tratador =>
  tratar(async (request) => {
    const usuario = lerSessao(request);
    if (!usuario) throw new ErroHttp(401, 'Sua sessão expirou. Entre de novo.');
    return fn(request, usuario);
  });

/** Lê o `?id=` obrigatório das rotas de exclusão. */
export const idDaUrl = (request: Request) => {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !UUID.test(id)) throw new ErroHttp(400, 'Identificador inválido.');
  return id;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
