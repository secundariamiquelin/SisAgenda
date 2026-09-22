// Acesso aos dados pela API do próprio projeto (funções em /api, banco Postgres no Neon).
// A sessão vive num cookie HttpOnly: o navegador envia sozinho e o JavaScript não o enxerga.
import { Cliente, Servico, Agendamento, AgendamentoStatus, AuthUser } from '../types';

async function chamarApi<T>(caminho: string, metodo = 'GET', corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`/api/${caminho}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        ...(corpo !== undefined ? { 'content-type': 'application/json' } : {}),
        // Exigido pela API em toda escrita; ver api/_lib/http.ts
        ...(metodo !== 'GET' ? { 'x-sisagenda': '1' } : {})
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.');
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(dados?.erro || `O servidor respondeu com erro ${resposta.status}.`);
  }
  return dados as T;
}

// O banco devolve null em campos vazios; os tipos do front usam undefined.
const semNulos = <T extends object>(item: T): T =>
  Object.fromEntries(Object.entries(item).map(([chave, valor]) => [chave, valor ?? undefined])) as T;

export class DbService {
  // CLIENTES
  static async getClientes(): Promise<Cliente[]> {
    return (await chamarApi<Cliente[]>('clientes')).map(semNulos);
  }

  static async salvarCliente(cliente: Partial<Cliente> & { nome: string }): Promise<Cliente> {
    return semNulos(
      await chamarApi<Cliente>('clientes', 'POST', {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        observacoes: cliente.observacoes
      })
    );
  }

  static async excluirCliente(id: string): Promise<void> {
    await chamarApi(`clientes?id=${encodeURIComponent(id)}`, 'DELETE');
  }

  // SERVIÇOS
  static async getServicos(): Promise<Servico[]> {
    return chamarApi<Servico[]>('servicos');
  }

  static async salvarServico(
    servico: Partial<Servico> & { nome: string; duracao_minutos: number; preco: number }
  ): Promise<Servico> {
    return chamarApi<Servico>('servicos', 'POST', {
      id: servico.id,
      nome: servico.nome,
      duracao_minutos: servico.duracao_minutos,
      preco: servico.preco
    });
  }

  static async excluirServico(id: string): Promise<void> {
    await chamarApi(`servicos?id=${encodeURIComponent(id)}`, 'DELETE');
  }

  // AGENDAMENTOS — a regra de conflito de horário roda na API e no banco
  static async getAgendamentos(): Promise<Agendamento[]> {
    const lista = await chamarApi<Agendamento[]>('agendamentos');
    return lista.map((ag) => ({
      ...semNulos(ag),
      cliente: ag.cliente ? semNulos(ag.cliente) : undefined,
      servico: ag.servico ?? undefined
    }));
  }

  static async salvarAgendamento(
    agendamento: Partial<Agendamento> & {
      cliente_id: string;
      servico_id: string;
      data_agendamento: string;
      hora_agendamento: string;
      status: AgendamentoStatus;
    }
  ): Promise<Agendamento> {
    return semNulos(
      await chamarApi<Agendamento>('agendamentos', 'POST', {
        id: agendamento.id,
        cliente_id: agendamento.cliente_id,
        servico_id: agendamento.servico_id,
        data_agendamento: agendamento.data_agendamento,
        hora_agendamento: agendamento.hora_agendamento.slice(0, 5),
        observacao: agendamento.observacao,
        status: agendamento.status
      })
    );
  }

  static async excluirAgendamento(id: string): Promise<void> {
    await chamarApi(`agendamentos?id=${encodeURIComponent(id)}`, 'DELETE');
  }

  // AUTENTICAÇÃO
  static async getCurrentUser(): Promise<AuthUser | null> {
    return (await chamarApi<{ usuario: AuthUser | null }>('auth')).usuario;
  }

  static async login(email: string, senha: string): Promise<AuthUser> {
    const { usuario } = await chamarApi<{ usuario: AuthUser }>('auth', 'POST', {
      email: email.trim().toLowerCase(),
      senha
    });
    return usuario;
  }

  static async logout(): Promise<void> {
    await chamarApi('auth', 'DELETE');
  }
}
