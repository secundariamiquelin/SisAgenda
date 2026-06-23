import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Cliente, Servico, Agendamento, AgendamentoStatus, AuthUser } from '../types';

// Gerador de IDs para o modo de fallback (local storage)
const generateId = () => Math.random().toString(36).substr(2, 9);

// Data base mockada inicial de fallback baseada na data atual do sistema (2026-06-12)
const getTodayString = (offsetDays = 0) => {
  const d = new Date('2026-06-12');
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const DEFAULT_CLIENTES: Cliente[] = [
  { id: 'cli-1', nome: 'Enzo Gabriel Martins', telefone: '(44) 98888-7777', observacoes: 'Diagnóstico de TEA nível 2 de suporte. Mãe: Mileide.', created_at: new Date('2026-06-10').toISOString() },
  { id: 'cli-2', nome: 'Arthur Silva Garcia', telefone: '(44) 97777-6666', observacoes: 'Diagnóstico de TEA nível 1. Gosta muito de blocos de montar. Pai: Roberto.', created_at: new Date('2026-06-11').toISOString() },
  { id: 'cli-3', nome: 'Sophia Oliveira Bento', telefone: '(44) 96666-5555', observacoes: 'Necessita suporte fonoaudiológico para comunicação verbal alternada. Mãe: Laura.', created_at: new Date('2026-06-11').toISOString() },
  { id: 'cli-4', nome: 'Lucas Gabriel Alves', telefone: '(44) 95555-4444', observacoes: 'TEA nível 3, focado em estimulação multissensorial cognitiva. Mãe: Patrícia.', created_at: new Date('2026-06-12').toISOString() }
];

const DEFAULT_SERVICOS: Servico[] = [
  { id: 'ser-1', nome: 'Atendimento Psicopedagógico (Mileide)', duracao_minutos: 50, preco: 0.00, created_at: new Date('2026-06-01').toISOString() },
  { id: 'ser-2', nome: 'Acompanhamento Psicológico Clínico', duracao_minutos: 50, preco: 0.00, created_at: new Date('2026-06-01').toISOString() },
  { id: 'ser-3', nome: 'Consulta / Terapia Fonoaudiológica', duracao_minutos: 45, preco: 0.00, created_at: new Date('2026-06-02').toISOString() },
  { id: 'ser-4', nome: 'Oficina de Integração Social & Cognição', duracao_minutos: 60, preco: 0.00, created_at: new Date('2026-06-02').toISOString() }
];

const DEFAULT_AGENDAMENTOS: Agendamento[] = [
  {
    id: 'age-1',
    cliente_id: 'cli-1',
    servico_id: 'ser-1',
    data_agendamento: getTodayString(0), // hoje
    hora_agendamento: '09:00',
    observacao: 'Foco em coordenação motora fina',
    status: 'Confirmado',
    created_at: new Date('2026-06-12T07:00:00Z').toISOString()
  },
  {
    id: 'age-2',
    cliente_id: 'cli-2',
    servico_id: 'ser-2',
    data_agendamento: getTodayString(0), // hoje
    hora_agendamento: '14:30',
    observacao: 'Sessão lúdica com reforço positivo',
    status: 'Agendado',
    created_at: new Date('2026-06-12T08:00:00Z').toISOString()
  },
  {
    id: 'age-3',
    cliente_id: 'cli-3',
    servico_id: 'ser-3',
    data_agendamento: getTodayString(-1), // ontem
    hora_agendamento: '10:00',
    observacao: 'Exercícios de fonemas e sopro',
    status: 'Concluído',
    created_at: new Date('2026-06-11T10:00:00Z').toISOString()
  },
  {
    id: 'age-4',
    cliente_id: 'cli-4',
    servico_id: 'ser-4',
    data_agendamento: getTodayString(1), // amanhã
    hora_agendamento: '11:00',
    observacao: 'Trabalho em grupo de socialização',
    status: 'Agendado',
    created_at: new Date('2026-06-12T09:00:00Z').toISOString()
  }
];

// Inicialização segura de localStorage
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao salvar dados de fallback local:', e);
  }
};

export class DbService {
  // CLIENTES CRUD
  static async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const list = getLocalStorageData<Cliente[]>('app_clientes', DEFAULT_CLIENTES);
      return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
    }
  }

  static async salvarCliente(cliente: Partial<Cliente> & { nome: string }): Promise<Cliente> {
    if (isSupabaseConfigured && supabase) {
      if (cliente.id) {
        const { data, error } = await supabase
          .from('clientes')
          .update({
            nome: cliente.nome,
            telefone: cliente.telefone,
            observacoes: cliente.observacoes
          })
          .eq('id', cliente.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('clientes')
          .insert({
            nome: cliente.nome,
            telefone: cliente.telefone,
            observacoes: cliente.observacoes
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
    } else {
      const clientes = getLocalStorageData<Cliente[]>('app_clientes', DEFAULT_CLIENTES);
      if (cliente.id) {
        const idx = clientes.findIndex(c => c.id === cliente.id);
        if (idx === -1) throw new Error('Cliente não encontrado.');
        const updated = { ...clientes[idx], ...cliente, nome: cliente.nome };
        clientes[idx] = updated;
        setLocalStorageData('app_clientes', clientes);
        return updated;
      } else {
        const created: Cliente = {
          id: 'cli-' + generateId(),
          nome: cliente.nome,
          telefone: cliente.telefone,
          observacoes: cliente.observacoes,
          created_at: new Date().toISOString()
        };
        clientes.push(created);
        setLocalStorageData('app_clientes', clientes);
        return created;
      }
    }
  }

  static async excluirCliente(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // Deleta agendamentos relacionados por cascade (se configurado corretamento no postgres)
      // Mas para garantir RLS e segurança local, chamamos a deleção simples.
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      let clientes = getLocalStorageData<Cliente[]>('app_clientes', DEFAULT_CLIENTES);
      clientes = clientes.filter(c => c.id !== id);
      setLocalStorageData('app_clientes', clientes);

      // Também limpar agendamentos relacionados em memória local
      let agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      agendamentos = agendamentos.filter(a => a.cliente_id !== id);
      setLocalStorageData('app_agendamentos', agendamentos);
    }
  }

  // SERVICOS CRUD
  static async getServicos(): Promise<Servico[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const list = getLocalStorageData<Servico[]>('app_servicos', DEFAULT_SERVICOS);
      return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
    }
  }

  static async salvarServico(servico: Partial<Servico> & { nome: string; duracao_minutos: number; preco: number }): Promise<Servico> {
    if (isSupabaseConfigured && supabase) {
      if (servico.id) {
        const { data, error } = await supabase
          .from('servicos')
          .update({
            nome: servico.nome,
            duracao_minutos: servico.duracao_minutos,
            preco: servico.preco
          })
          .eq('id', servico.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('servicos')
          .insert({
            nome: servico.nome,
            duracao_minutos: servico.duracao_minutos,
            preco: servico.preco
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
    } else {
      const servicos = getLocalStorageData<Servico[]>('app_servicos', DEFAULT_SERVICOS);
      if (servico.id) {
        const idx = servicos.findIndex(s => s.id === servico.id);
        if (idx === -1) throw new Error('Serviço não encontrado.');
        const updated = { ...servicos[idx], ...servico, nome: servico.nome, duracao_minutos: servico.duracao_minutos, preco: servico.preco };
        servicos[idx] = updated;
        setLocalStorageData('app_servicos', servicos);
        return updated;
      } else {
        const created: Servico = {
          id: 'ser-' + generateId(),
          nome: servico.nome,
          duracao_minutos: servico.duracao_minutos,
          preco: servico.preco,
          created_at: new Date().toISOString()
        };
        servicos.push(created);
        setLocalStorageData('app_servicos', servicos);
        return created;
      }
    }
  }

  static async excluirServico(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      let servicos = getLocalStorageData<Servico[]>('app_servicos', DEFAULT_SERVICOS);
      servicos = servicos.filter(s => s.id !== id);
      setLocalStorageData('app_servicos', servicos);

      // Também limpar agendamentos relacionados em memória local
      let agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      agendamentos = agendamentos.filter(a => a.servico_id !== id);
      setLocalStorageData('app_agendamentos', agendamentos);
    }
  }

  // AGENDAMENTOS CRUD & REGRAS DE NEGÓCIO
  static async getAgendamentos(): Promise<Agendamento[]> {
    if (isSupabaseConfigured && supabase) {
      // No Supabase, carregamos o relacionamento clientes e servicos
      // clientes (id, nome, telefone, observacoes)
      // servicos (id, nome, duracao_minutos, preco)
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          servico_id,
          data_agendamento,
          hora_agendamento,
          observacao,
          status,
          created_at,
          clientes (id, nome, telefone, observacoes),
          servicos (id, nome, duracao_minutos, preco)
        `);
      if (error) throw new Error(error.message);

      // Transforma o retorno de relacionamentos do Supabase
      const mapped = (data || []).map((item: any) => {
        let singleCliente: Cliente | undefined = undefined;
        let singleServico: Servico | undefined = undefined;

        if (item.clientes) {
          singleCliente = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes;
        }
        if (item.servicos) {
          singleServico = Array.isArray(item.servicos) ? item.servicos[0] : item.servicos;
        }

        return {
          id: item.id,
          cliente_id: item.cliente_id,
          servico_id: item.servico_id,
          data_agendamento: item.data_agendamento,
          hora_agendamento: item.hora_agendamento ? item.hora_agendamento.slice(0, 5) : '', // Garantir formato HH:MM
          observacao: item.observacao,
          status: item.status as AgendamentoStatus,
          created_at: item.created_at,
          cliente: singleCliente,
          servico: singleServico
        };
      });

      // Ordenar por data e hora (Regra: Ordenar a agenda por data e hora)
      return DbService.ordenarAgendamentos(mapped);
    } else {
      const agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      const clientes = getLocalStorageData<Cliente[]>('app_clientes', DEFAULT_CLIENTES);
      const servicos = getLocalStorageData<Servico[]>('app_servicos', DEFAULT_SERVICOS);

      const resolved = agendamentos.map(ag => {
        const cliente = clientes.find(c => c.id === ag.cliente_id);
        const servico = servicos.find(s => s.id === ag.servico_id);
        return {
          ...ag,
          cliente,
          servico
        };
      });

      return DbService.ordenarAgendamentos(resolved);
    }
  }

  private static ordenarAgendamentos(lista: Agendamento[]): Agendamento[] {
    return [...lista].sort((a, b) => {
      const dataA = `${a.data_agendamento}T${a.hora_agendamento}:00`;
      const dataB = `${b.data_agendamento}T${b.hora_agendamento}:00`;
      return dataA.localeCompare(dataB);
    });
  }

  /**
   * Valida se existe um conflito de horário ativo antes de salvar o agendamento
   * Regra: "Não permitir dois agendamentos ativos para o mesmo dia e horário. Agendamentos cancelados não devem bloquear horários."
   */
  static async verificarConflito(
    dataAgendamento: string,
    horaAgendamento: string,
    status: AgendamentoStatus,
    excluirId?: string
  ): Promise<boolean> {
    // Se o agendamento que estamos criando/salvando é 'Cancelado', ele não bloqueia horário, logo não gera conflito
    if (status === 'Cancelado') {
      return false;
    }

    // Formatar hora para garantir HH:MM simples
    const horaFormatada = horaAgendamento.slice(0, 5);

    if (isSupabaseConfigured && supabase) {
      // Busca agendamentos na mesma data e hora que não sejam cancelados
      let query = supabase
        .from('agendamentos')
        .select('id, status')
        .eq('data_agendamento', dataAgendamento)
        .eq('hora_agendamento', horaFormatada)
        .neq('status', 'Cancelado');

      if (excluirId) {
        query = query.neq('id', excluirId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return data && data.length > 0;
    } else {
      const agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      const possuiConflito = agendamentos.some(ag => 
        ag.data_agendamento === dataAgendamento &&
        ag.hora_agendamento.slice(0, 5) === horaFormatada &&
        ag.status !== 'Cancelado' &&
        ag.id !== excluirId
      );
      return possuiConflito;
    }
  }

  static async salvarAgendamento(agendamento: Partial<Agendamento> & {
    cliente_id: string;
    servico_id: string;
    data_agendamento: string;
    hora_agendamento: string;
    status: AgendamentoStatus;
  }): Promise<Agendamento> {
    // 1. Validar conflito de horários primeiro
    const conflito = await DbService.verificarConflito(
      agendamento.data_agendamento,
      agendamento.hora_agendamento,
      agendamento.status,
      agendamento.id
    );

    if (conflito) {
      throw new Error('Já existe outro agendamento ativo cadastrado para este dia e horário.');
    }

    // 2. Realizar o persist
    const horaFormatada = agendamento.hora_agendamento.slice(0, 5);

    if (isSupabaseConfigured && supabase) {
      const payload = {
        cliente_id: agendamento.cliente_id,
        servico_id: agendamento.servico_id,
        data_agendamento: agendamento.data_agendamento,
        hora_agendamento: horaFormatada,
        observacao: agendamento.observacao,
        status: agendamento.status
      };

      if (agendamento.id) {
        const { data, error } = await supabase
          .from('agendamentos')
          .update(payload)
          .eq('id', agendamento.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      } else {
        const { data, error } = await supabase
          .from('agendamentos')
          .insert(payload)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      }
    } else {
      const agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      if (agendamento.id) {
        const idx = agendamentos.findIndex(a => a.id === agendamento.id);
        if (idx === -1) throw new Error('Agendamento não encontrado.');
        const updated = {
          ...agendamentos[idx],
          cliente_id: agendamento.cliente_id,
          servico_id: agendamento.servico_id,
          data_agendamento: agendamento.data_agendamento,
          hora_agendamento: horaFormatada,
          observacao: agendamento.observacao,
          status: agendamento.status
        };
        agendamentos[idx] = updated;
        setLocalStorageData('app_agendamentos', agendamentos);
        return updated;
      } else {
        const created: Agendamento = {
          id: 'age-' + generateId(),
          cliente_id: agendamento.cliente_id,
          servico_id: agendamento.servico_id,
          data_agendamento: agendamento.data_agendamento,
          hora_agendamento: horaFormatada,
          observacao: agendamento.observacao,
          status: agendamento.status,
          created_at: new Date().toISOString()
        };
        agendamentos.push(created);
        setLocalStorageData('app_agendamentos', agendamentos);
        return created;
      }
    }
  }

  static async excluirAgendamento(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      let agendamentos = getLocalStorageData<Agendamento[]>('app_agendamentos', DEFAULT_AGENDAMENTOS);
      agendamentos = agendamentos.filter(a => a.id !== id);
      setLocalStorageData('app_agendamentos', agendamentos);
    }
  }

  // AUTHENTICATION SYSTEM
  static async getCurrentUser(): Promise<AuthUser | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email || ''
      };
    }
    return null;
  }

  static async login(email: string, senha: string): Promise<AuthUser> {
    const trimmedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: senha,
      });

      if (error) {
        throw new Error(`Falha ao conectar com o Supabase Auth: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('Falha na autenticação do usuário.');
      }

      return {
        id: data.user.id,
        email: data.user.email || ''
      };
    } else {
      throw new Error('O banco de dados do Supabase não está configurado. Insira as credenciais do Supabase no painel para realizar o login real.');
    }
  }

  static async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  }
}
