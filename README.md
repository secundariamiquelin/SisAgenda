# Sistema de Agendamento de Consultas

## Descrição

O Sistema de Agendamento de Consultas é uma aplicação web desenvolvida para facilitar o gerenciamento de consultas, permitindo o cadastro de pacientes, agendamentos e acompanhamento dos horários marcados.

O objetivo do sistema é organizar os atendimentos de forma simples e eficiente, evitando conflitos de horários e centralizando as informações em um único ambiente.

---

## Funcionalidades

- Cadastro de pacientes
- Cadastro de consultas
- Listagem de consultas agendadas
- Edição de consultas
- Cancelamento de consultas
- Pesquisa de consultas
- Controle de datas e horários
- Validação de formulários
- Persistência de dados em nuvem

---

## Tecnologias Utilizadas

### Frontend

- React
- TypeScript (TSX)
- Vite
- HTML5
- CSS3

### Backend

- Funções da Vercel (pasta `api/`)
- PostgreSQL no Neon

---

## Estrutura do Projeto

```text
src/
├── components/
├── pages/
├── services/
├── hooks/
├── contexts/
├── lib/
├── types/
├── App.tsx
└── main.tsx

api/            # funções da Vercel: auth, clientes, servicos, agendamentos
└── _lib/       # banco, sessão, validação

db/
└── schema.sql  # tabelas do banco

scripts/        # criar tabelas e usuários
```

---

## Banco de Dados

Os dados ficam num Postgres do Neon, criado pela aba Storage do projeto na Vercel.
O navegador nunca fala com o banco: ele chama as funções em `api/`, que conferem a sessão e
validam os dados antes de cada consulta. As tabelas estão em [`db/schema.sql`](db/schema.sql).

O login é próprio: os usuários ficam na tabela `usuarios` com a senha em bcrypt, e a sessão
vive num cookie HttpOnly assinado. Não existe cadastro público; quem entra é criado pelo script
`npm run usuario`. Depois de 10 senhas erradas em 15 minutos, o e-mail fica bloqueado até a janela passar.

---------|---------|
| id | UUID |
| nome | TEXT |
| telefone | TEXT |
| email | TEXT |
| created_at | TIMESTAMP |

### Tabela: consultas

| Campo | Tipo |
|---------|---------|
| id | UUID |
| paciente_id | UUID |
| data_consulta | DATE |
| horario | TIME |
| observacoes | TEXT |
| status | TEXT |
| created_at | TIMESTAMP |

---

## Como Executar o Projeto

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Na Vercel, em Settings → Environment Variables:

| Variável | Origem |
|---|---|
| `DATABASE_URL` | Criada sozinha ao conectar o banco Neon em Storage |
| `SESSION_SECRET` | Texto aleatório com 32 caracteres ou mais (gere com o comando abaixo) |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Para rodar os scripts no seu computador, traga as variáveis com `vercel env pull .env.local`
(o arquivo fica fora do git).

### 4. Criar as tabelas e o primeiro usuário

```bash
npm run db:tabelas
npm run usuario -- email@exemplo.com
```

O segundo comando pede a senha sem mostrá-la. Rodar de novo com o mesmo e-mail troca a senha.
Para derrubar todas as sessões abertas, troque o `SESSION_SECRET` e faça um novo deploy.

Em desenvolvimento, `vercel dev` sobe o site e as funções juntos (`npm run dev` sobe só o site).

### 5. Gerar build de produção

```bash
npm run build
```

---

## Rotas da Aplicação

| Rota | Descrição |
|--------|--------|
| / | Página inicial |
| /consultas | Listagem de consultas |
| /consultas/nova | Cadastro de consulta |
| /consultas/editar/:id | Edição de consulta |
| /pacientes | Listagem de pacientes |
| /pacientes/novo | Cadastro de paciente |

---

## Conceitos Aplicados

Este projeto foi desenvolvido para aplicação dos conceitos estudados na disciplina de Desenvolvimento Web, contemplando:

- Rotas dinâmicas
- Componentização com React
- Processamento de formulários
- Validação de dados
- Integração com banco de dados
- Operações CRUD
- Persistência de dados em PostgreSQL (Neon)
- Organização do código seguindo boas práticas de desenvolvimento

---

## Autores

- Gabriel Ferreira Miquelin
- Afonso Cavichioli Alves
- Rodrigo Piques

---

## Objetivo Acadêmico

Este sistema foi desenvolvido como trabalho no curso de ADS com o objetivo de aplicar conceitos de frontend, backend, banco de dados e integração entre sistemas, utilizando tecnologias modernas do ecossistema JavaScript.