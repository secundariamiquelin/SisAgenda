// Acesso ao Postgres do Neon pelo driver HTTP (sem conexões presas entre invocações).
import { neon } from '@neondatabase/serverless';

let cliente: ReturnType<typeof neon> | null = null;

/** Executa uma consulta parametrizada ($1, $2…) e devolve as linhas. */
export async function consulta<T = Record<string, unknown>>(texto: string, parametros: unknown[] = []): Promise<T[]> {
  if (!cliente) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não configurada.');
    cliente = neon(url);
  }
  return (await cliente.query(texto, parametros)) as T[];
}
