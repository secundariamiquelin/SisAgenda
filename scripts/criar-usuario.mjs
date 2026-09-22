// Cria quem pode entrar no SisAgenda, ou troca a senha de quem já existe.
// Uso: npm run usuario -- email@exemplo.com
// A senha é pedida no terminal e não aparece na tela nem no histórico.
import { createInterface } from 'node:readline';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { urlDoBanco } from './ambiente.mjs';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Informe o e-mail: npm run usuario -- email@exemplo.com');
  process.exit(1);
}

function perguntarEscondido(pergunta) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (texto) => {
      if (texto.includes(pergunta)) rl.output.write(texto);
    };
    rl.question(pergunta, (resposta) => {
      rl.output.write('\n');
      rl.close();
      resolve(resposta);
    });
  });
}

const senha = await perguntarEscondido('Senha (mínimo 10 caracteres): ');
if (senha.length < 10) {
  console.error('Senha curta demais.');
  process.exit(1);
}
if ((await perguntarEscondido('Repita a senha: ')) !== senha) {
  console.error('As senhas não conferem.');
  process.exit(1);
}

const sql = neon(urlDoBanco());
const hash = await bcrypt.hash(senha, 12);
await sql.query(
  `INSERT INTO usuarios (email, senha_hash) VALUES ($1, $2)
   ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash`,
  [email, hash]
);
console.log(`Usuário ${email} pronto para entrar.`);
