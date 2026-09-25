# SisAgenda

Agenda de atendimentos do **Instituto Mentes em Desenvolvimento** (Sarandi, PR), que atende crianças autistas com acompanhamento psicopedagógico, psicológico e fonoaudiológico.

**Em produção:** https://sisagenda.vercel.app

---

## Objetivo

Substituir o controle em papel e planilha por um lugar único onde a equipe do instituto consegue, em poucos cliques:

- ver quem chega hoje e a que horas, com os recados de cada sessão;
- marcar, remarcar, confirmar, concluir ou cancelar um atendimento;
- manter o cadastro das crianças, com telefone do responsável e observações;
- manter as terapias oferecidas, com duração e valor simbólico da contribuição.

A regra mais importante do sistema é impedir que duas crianças sejam marcadas no mesmo dia e horário. Sessões canceladas não bloqueiam o horário.

---

## Tecnologias

| Camada | O que é usado |
|---|---|
| Interface | React 19, TypeScript, Vite 6, Tailwind CSS 4, ícones Phosphor, fonte Source Serif 4 |
| API | Funções serverless da Vercel, em `api/`, escritas em TypeScript |
| Banco | PostgreSQL no Neon, acessado pelo driver HTTP `@neondatabase/serverless` |
| Login | Próprio: senha com bcrypt e sessão em cookie HttpOnly assinado (HMAC-SHA256) |
| Publicação | Vercel, com deploy automático a cada push na branch `master` |

O navegador nunca fala com o banco. Ele chama `/api/...`, e a função confere a sessão, valida os dados e só então consulta o Postgres.

---

## Estrutura do projeto

```text
api/                  funções da Vercel (uma por recurso)
├── auth.ts           entrar, sair e saber quem está logado
├── clientes.ts       crianças atendidas
├── servicos.ts       terapias oferecidas
├── agendamentos.ts   sessões da agenda
└── _lib/             banco, sessão, validação e tratamento de erro

db/
└── schema.sql        tabelas, índices e regras do banco

scripts/
├── criar-tabelas.mjs aplica o schema.sql no banco
└── criar-usuario.mjs cria quem pode entrar, ou troca a senha

src/
├── App.tsx           navegação, alertas e handlers
├── components/       telas (Login, Painel, Agenda, Crianças, Terapias) e componentes de interface
├── services/db.ts    única porta de entrada para a API
├── styles/           design system Broadsheet
└── types.ts          tipos compartilhados

docs/evidencias/      capturas de tela dos fluxos principais
```

---

## Banco de dados

Quatro tabelas, definidas em [`db/schema.sql`](db/schema.sql):

| Tabela | Para que serve |
|---|---|
| `clientes` | Crianças atendidas: nome, telefone do responsável, observações |
| `servicos` | Terapias: nome, duração em minutos, contribuição |
| `agendamentos` | Sessões: criança, terapia, dia, hora, recados e situação |
| `usuarios` | Quem pode entrar: e-mail e senha em bcrypt |

Duas proteções ficam no próprio banco:

- **`uq_agendamentos_horario_ativo`**, um índice único parcial que impede dois atendimentos ativos no mesmo dia e horário, mesmo se duas pessoas salvarem ao mesmo tempo;
- **`ON DELETE CASCADE`**, que apaga as sessões de uma criança ou terapia quando o cadastro é removido.

Há ainda a tabela `login_tentativas`, que registra senhas erradas e bloqueia o e-mail depois de 10 falhas em 15 minutos.

---

## Como executar

### 1. Pré-requisitos

- Node.js 22 ou superior (desenvolvido com 22.22) e npm 11;
- uma conta na Vercel com um banco Neon conectado ao projeto, ou qualquer PostgreSQL acessível.

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

| Variável | De onde vem |
|---|---|
| `DATABASE_URL` | Criada automaticamente ao conectar o banco Neon em **Storage**, no painel da Vercel, com o prefixo `DATABASE` |
| `SESSION_SECRET` | Texto aleatório com 32 caracteres ou mais, criado por você |

Para gerar o `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Na Vercel, as duas ficam em **Settings → Environment Variables**, nos ambientes Production e Preview. Como elas são lidas quando a função roda, **é preciso um deploy novo para uma mudança valer**.

Para rodar os scripts na sua máquina, crie um arquivo `.env.local` na raiz do projeto com a `DATABASE_URL` (o painel do Neon oferece esse conteúdo pronto no botão *Copy Snippet*, e o `.gitignore` já ignora arquivos `.env*`).

### 4. Criar as tabelas e o primeiro usuário

```bash
npm run db:tabelas
```

```bash
npm run usuario -- email@exemplo.com
```

O segundo comando pede a senha duas vezes, com no mínimo 6 caracteres, sem mostrá-la na tela. Rodar de novo com o mesmo e-mail troca a senha. **Não existe cadastro público:** só entra quem for criado por esse comando.

### 5. Rodar durante o desenvolvimento

```bash
npm run dev
```

O Vite sobe a interface em `http://localhost:3000`. Atenção: esse comando serve **apenas a interface** — as funções de `api/` são executadas pela Vercel, então o login e as listas não funcionam nesse modo. Para rodar tudo junto na máquina, use a CLI da Vercel (`npx vercel dev`), que precisa de login na conta do projeto.

### 6. Conferir tipos e gerar a build

```bash
npm run lint
```

```bash
npm run build
```

A build fica em `dist/`. Em produção, quem a gera é a Vercel.

---

## Publicação

O projeto está conectado ao repositório pelo GitHub App da Vercel: **todo push na branch `master` gera um deploy de produção**. O painel da Vercel guarda os deploys anteriores, e o botão *Rollback* volta para o anterior em um clique.

---

## Segurança

- A sessão vive em um cookie `HttpOnly`, `Secure` e `SameSite=Lax`, assinado com HMAC-SHA256. O JavaScript da página não consegue lê-lo.
- As senhas são guardadas em bcrypt com custo 12. O sistema nunca guarda a senha em texto.
- Toda escrita exige o cabeçalho `x-sisagenda`, o que obriga o preflight de CORS e impede que outro site dispare ações usando o cookie de quem está logado.
- Os dados enviados são validados na função antes de chegar ao banco, e o banco tem `CHECK`s próprios.
- Para derrubar todas as sessões abertas, troque o `SESSION_SECRET` e publique de novo.

---

## Documentos relacionados

- [`ENTREGA.md`](ENTREGA.md) — recursos entregues, evidências dos fluxos, limitações conhecidas e roteiro de demonstração.

---

## Autores

- Gabriel Ferreira Miquelin
- Afonso Cavichioli Alves
- Rodrigo Piques

Projeto desenvolvido no curso de Análise e Desenvolvimento de Sistemas, aplicando conceitos de frontend, backend, banco de dados e integração entre sistemas.
