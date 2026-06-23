-- Script SQL para criação das tabelas e políticas de segurança (RLS) no Supabase

-- 1. Tabela de CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de SERVIÇOS
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    preco NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
    data_agendamento DATE NOT NULL,
    hora_agendamento TIME NOT NULL,
    observacao TEXT,
    status TEXT NOT NULL DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Confirmado', 'Concluído', 'Cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices adicionais para otimização e verificação rápida
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON public.agendamentos(data_agendamento, hora_agendamento);

-- 4. Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas RLS para garantir acesso apenas para usuários autenticados
-- Como o sistema possui apenas um único usuário administrador, permitimos operações completas (CRUD) para usuários autenticados.

-- Políticas para 'clientes'
CREATE POLICY "Permitir CRUD completo para usuários autenticados em clientes" 
ON public.clientes 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para 'servicos'
CREATE POLICY "Permitir CRUD completo para usuários autenticados em servicos" 
ON public.servicos 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para 'agendamentos'
CREATE POLICY "Permitir CRUD completo para usuários autenticados em agendamentos" 
ON public.agendamentos 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
