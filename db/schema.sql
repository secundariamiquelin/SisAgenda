-- Tabelas do SisAgenda no Postgres do Neon.
-- Pode rodar de novo sem medo: tudo usa IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    data_agendamento DATE NOT NULL,
    hora_agendamento TIME NOT NULL,
    observacao TEXT,
    status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Confirmado', 'Concluído', 'Cancelado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos (data_agendamento, hora_agendamento);

-- Regra de negócio garantida pelo próprio banco: um só atendimento ativo por dia e horário.
-- Sessões canceladas não bloqueiam o horário.
CREATE UNIQUE INDEX IF NOT EXISTS uq_agendamentos_horario_ativo
    ON agendamentos (data_agendamento, hora_agendamento)
    WHERE status <> 'Cancelado';

-- Quem pode entrar no sistema. Não há cadastro público: os usuários são criados
-- pelo script scripts/criar-usuario.mjs.
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    senha_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tentativas de login que falharam, para frear quem tenta adivinhar senhas.
CREATE TABLE IF NOT EXISTS login_tentativas (
    email TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_tentativas_email ON login_tentativas (email, criado_em);
