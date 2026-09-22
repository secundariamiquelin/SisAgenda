// Cria as tabelas do SisAgenda no Neon a partir de db/schema.sql.
// Uso: npm run db:tabelas   (lê DATABASE_URL do ambiente ou do arquivo .env.local)
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { urlDoBanco } from './ambiente.mjs';

const sql = neon(urlDoBanco());
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

// O driver HTTP executa um comando por chamada.
const comandos = schema
  .split('\n')
  .filter((linha) => !linha.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((comando) => comando.trim())
  .filter(Boolean);

for (const comando of comandos) await sql.query(comando);
console.log(`Pronto: ${comandos.length} comandos aplicados.`);
