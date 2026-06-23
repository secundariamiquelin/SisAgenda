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

- Supabase
- PostgreSQL

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

supabase/
└── migrations/
```

---

## Banco de Dados

O sistema utiliza o Supabase como Backend as a Service (BaaS), utilizando PostgreSQL para armazenamento dos dados.

### Tabela: pacientes

| Campo | Tipo |
|---------|---------|
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

Criar um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica
```

### 4. Executar em ambiente de desenvolvimento

```bash
npm run dev
```

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
- Persistência de dados utilizando Supabase
- Organização do código seguindo boas práticas de desenvolvimento

---

## Autores

- Gabriel Ferreira Miquelin
- Afonso Cavichioli Alves
- Rodrigo Piques

---

## Objetivo Acadêmico

Este sistema foi desenvolvido como trabalho no curso de ADS com o objetivo de aplicar conceitos de frontend, backend, banco de dados e integração entre sistemas, utilizando tecnologias modernas do ecossistema JavaScript.