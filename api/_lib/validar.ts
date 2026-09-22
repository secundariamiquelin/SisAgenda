// Validação dos dados que chegam do navegador. O banco também tem CHECKs,
// mas aqui a mensagem sai em português e antes de gastar uma consulta.
import { ErroHttp, UUID } from './http.js';

const falhar = (mensagem: string): never => {
  throw new ErroHttp(400, mensagem);
};

export function texto(valor: unknown, campo: string, { obrigatorio = false, maximo = 500 } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    return obrigatorio ? falhar(`Preencha o campo ${campo}.`) : null;
  }
  if (typeof valor !== 'string') return falhar(`O campo ${campo} está inválido.`);
  const limpo = valor.trim();
  if (obrigatorio && !limpo) return falhar(`Preencha o campo ${campo}.`);
  if (limpo.length > maximo) return falhar(`O campo ${campo} passa de ${maximo} caracteres.`);
  return limpo || null;
}

export function idOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === '') return null;
  return typeof valor === 'string' && UUID.test(valor) ? valor : falhar('Identificador inválido.');
}

export const id = (valor: unknown, campo: string) =>
  typeof valor === 'string' && UUID.test(valor) ? valor : falhar(`Escolha ${campo}.`);

export function numero(valor: unknown, campo: string, { minimo = 0, inteiro = false } = {}) {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n) || n < minimo || (inteiro && !Number.isInteger(n))) {
    return falhar(`O campo ${campo} está inválido.`);
  }
  return n;
}

export const data = (valor: unknown) =>
  typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor))
    ? valor
    : falhar('Informe o dia do atendimento.');

export const hora = (valor: unknown) =>
  typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d/.test(valor)
    ? valor.slice(0, 5)
    : falhar('Informe a hora do atendimento.');

const SITUACOES = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'] as const;
export type Situacao = (typeof SITUACOES)[number];

export const situacao = (valor: unknown): Situacao =>
  SITUACOES.includes(valor as Situacao) ? (valor as Situacao) : falhar('Situação inválida.');
