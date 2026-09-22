// Lê a DATABASE_URL do ambiente ou do .env.local (gerado por `vercel env pull .env.local`).
import { config } from 'dotenv';

export function urlDoBanco() {
  config({ path: '.env.local', quiet: true });
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL não encontrada. Rode `vercel env pull .env.local` ou defina a variável.');
    process.exit(1);
  }
  return url;
}
