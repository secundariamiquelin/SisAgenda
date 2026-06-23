// Declarações de tipos para a aplicação de agendamentos

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  observacoes?: string;
  created_at?: string;
}

export interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
  created_at?: string;
}

export type AgendamentoStatus = 'Agendado' | 'Confirmado' | 'Concluído' | 'Cancelado';

export interface Agendamento {
  id: string;
  cliente_id: string;
  servico_id: string;
  data_agendamento: string; // formato YYYY-MM-DD
  hora_agendamento: string; // formato HH:MM
  observacao?: string;
  status: AgendamentoStatus;
  created_at?: string;
  // Campos populados/resolvidos para exibição facilitada
  cliente?: Cliente;
  servico?: Servico;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AppView = 'dashboard' | 'agendamentos' | 'clientes' | 'servicos' | 'settings';
