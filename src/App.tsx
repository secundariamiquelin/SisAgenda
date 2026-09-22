import React, { useState, useEffect, useRef } from 'react';
import { AppView, Cliente, Servico, Agendamento, AgendamentoStatus, AuthUser } from './types';
import { DbService } from './services/db';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ClientesView from './components/ClientesView';
import ServicosView from './components/ServicosView';
import AgendamentosView from './components/AgendamentosView';
import ConfirmModal from './components/ConfirmModal';
import { HOJE, dataCompleta, dataPorExtenso } from './components/ui/formatos';
import { usePainelModal } from './components/ui/usePainelModal';
import { CheckCircle, List, WarningCircle, X } from '@phosphor-icons/react';

const INSTITUTO = 'Instituto Mentes em Desenvolvimento';

// Itens do índice, na ordem em que aparecem no cabeçalho e no drawer.
const INDICE: { id: AppView; rotulo: string }[] = [
  { id: 'dashboard', rotulo: 'Painel' },
  { id: 'agendamentos', rotulo: 'Agenda' },
  { id: 'clientes', rotulo: 'Crianças' },
  { id: 'servicos', rotulo: 'Terapias' },
];

export default function App() {
  // Autenticação
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Navegação
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [forceOpenBookingModal, setForceOpenBookingModal] = useState(false);

  // Estados dos dados centrais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  // Carregamento individual
  const [loadingData, setLoadingData] = useState(false);

  // Mensagens globais (Erros e Sucessos)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const alertTimer = useRef<number | undefined>(undefined);

  // Modal de Confirmação de Deleção
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const fecharIndice = () => setIsMobileSidebarOpen(false);
  const indiceRef = usePainelModal<HTMLDivElement>(isMobileSidebarOpen, fecharIndice);

  // 1. Verificar autenticação na montagem
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await DbService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Erro ao verificar sessão do usuário:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, []);

  // 2. Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    if (currentUser) {
      carregarTodosOsDados();
    }
  }, [currentUser]);

  // Cancela o sumiço agendado do alerta se o app for desmontado
  useEffect(() => () => window.clearTimeout(alertTimer.current), []);

  // Função centralizada para recarga de tabelas
  const carregarTodosOsDados = async () => {
    try {
      setLoadingData(true);
      const [listaClientes, listaServicos, listaAgendamentos] = await Promise.all([
        DbService.getClientes(),
        DbService.getServicos(),
        DbService.getAgendamentos()
      ]);

      setClientes(listaClientes);
      setServicos(listaServicos);
      setAgendamentos(listaAgendamentos);
    } catch (err: any) {
      mostrarAlert('error', `Não deu para carregar os dados: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper para acionar a barra de alerta; cada alerta novo fica os 5s inteiros
  const mostrarAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    window.clearTimeout(alertTimer.current);
    alertTimer.current = window.setTimeout(() => setAlert(null), 5000);
  };

  // 3. Handlers para Clientes (Salvar / Excluir)
  const handleSalvarCliente = async (cliente: Partial<Cliente> & { nome: string }) => {
    try {
      await DbService.salvarCliente(cliente);
      await carregarTodosOsDados();
      mostrarAlert('success', `Cadastro de ${cliente.nome} salvo.`);
    } catch (err: any) {
      mostrarAlert('error', `Não deu para salvar o cadastro: ${err.message}`);
      throw err;
    }
  };

  const handleExcluirCliente = (id: string) => {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    setConfirmDelete({
      isOpen: true,
      title: `Excluir ${cliente.nome}?`,
      message: 'O cadastro e todas as sessões dessa criança saem do sistema. Não dá para recuperar depois.',
      onConfirm: async () => {
        try {
          await DbService.excluirCliente(id);
          await carregarTodosOsDados();
          mostrarAlert('success', `Cadastro de ${cliente.nome} removido.`);
        } catch (err: any) {
          mostrarAlert('error', `Não deu para remover o cadastro: ${err.message}`);
        } finally {
          fecharConfirmModal();
        }
      }
    });
  };

  // 4. Handlers para Serviços (Salvar / Excluir)
  const handleSalvarServico = async (servico: Partial<Servico> & { nome: string; duracao_minutos: number; preco: number }) => {
    try {
      await DbService.salvarServico(servico);
      await carregarTodosOsDados();
      mostrarAlert('success', 'Terapia salva.');
    } catch (err: any) {
      mostrarAlert('error', `Não deu para salvar a terapia: ${err.message}`);
      throw err;
    }
  };

  const handleExcluirServico = (id: string) => {
    const servico = servicos.find(s => s.id === id);
    if (!servico) return;

    setConfirmDelete({
      isOpen: true,
      title: `Excluir ${servico.nome}?`,
      message: 'As sessões marcadas nessa modalidade também saem da agenda.',
      onConfirm: async () => {
        try {
          await DbService.excluirServico(id);
          await carregarTodosOsDados();
          mostrarAlert('success', 'Terapia removida da lista.');
        } catch (err: any) {
          mostrarAlert('error', `Não deu para remover a terapia: ${err.message}`);
        } finally {
          fecharConfirmModal();
        }
      }
    });
  };

  // 5. Handlers para Agendamentos (Salvar / Excluir)
  const handleSalvarAgendamento = async (agendamento: Partial<Agendamento> & {
    cliente_id: string;
    servico_id: string;
    data_agendamento: string;
    hora_agendamento: string;
    status: any;
  }) => {
    try {
      await DbService.salvarAgendamento(agendamento);
      await carregarTodosOsDados();
      mostrarAlert('success', 'Sessão salva na agenda.');
    } catch (err: any) {
      mostrarAlert('error', `Não deu para salvar a sessão: ${err.message}`);
      throw err;
    }
  };

  // Troca rápida de situação pela tabela da agenda: mesma gravação, aviso próprio
  const handleMudarSituacao = async (ag: Agendamento, status: AgendamentoStatus) => {
    try {
      await DbService.salvarAgendamento({
        id: ag.id,
        cliente_id: ag.cliente_id,
        servico_id: ag.servico_id,
        data_agendamento: ag.data_agendamento,
        hora_agendamento: ag.hora_agendamento,
        observacao: ag.observacao || '',
        status
      });
      await carregarTodosOsDados();
      mostrarAlert('success', `Situação atualizada para ${status}.`);
    } catch (err: any) {
      mostrarAlert('error', `Não deu para atualizar a situação: ${err.message}`);
    }
  };

  const handleExcluirAgendamento = (id: string) => {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;

    const clienteNome = ag.cliente?.nome || 'essa criança';

    setConfirmDelete({
      isOpen: true,
      title: `Excluir a sessão de ${clienteNome}?`,
      message: `O horário de ${ag.hora_agendamento} em ${dataCompleta(ag.data_agendamento)} sai da agenda e não dá para desfazer.`,
      onConfirm: async () => {
        try {
          await DbService.excluirAgendamento(id);
          await carregarTodosOsDados();
          mostrarAlert('success', 'Sessão removida da agenda.');
        } catch (err: any) {
          mostrarAlert('error', `Não deu para remover a sessão: ${err.message}`);
        } finally {
          fecharConfirmModal();
        }
      }
    });
  };

  const fecharConfirmModal = () => {
    setConfirmDelete(prev => ({ ...prev, isOpen: false }));
  };

  const handleLogout = async () => {
    try {
      await DbService.logout();
      setCurrentUser(null);
      setActiveView('dashboard');
      setIsMobileSidebarOpen(false);
      mostrarAlert('success', 'Você saiu da conta.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigateFromDashboard = (view: AppView, action?: string) => {
    setActiveView(view);
    if (view === 'agendamentos' && action === 'novo') {
      setForceOpenBookingModal(true);
    }
    setIsMobileSidebarOpen(false);
  };

  // Renderizador de tela baseado na autenticação
  if (checkingAuth) {
    return (
      <div id="loader-screen" className="mx-auto max-w-[1180px] px-5 pt-[30px] md:px-10">
        <div className="text-[40px] leading-none font-bold tracking-[-0.03em]">SisAgenda</div>
        <p role="status" className="mt-3 text-[13px] text-neutral-700">Abrindo a agenda…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(val) => setCurrentUser(val)} />;
  }

  return (
    <div id="app-viewport-root" className="min-h-screen">
      <div className="mx-auto max-w-[1180px] px-5 pt-[30px] pb-[70px] md:px-10">
        {/* Cabeçalho editorial: marca à esquerda, data e conta à direita */}
        <header className="flex flex-wrap items-end justify-between gap-[30px]">
          <div className="flex min-w-0 items-end gap-4">
            <button
              id="mobile-sidebar-toggle"
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir índice"
              className="cursor-pointer px-0.5 pb-2 text-neutral-700 hover:text-accent-700"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="text-[40px] leading-none font-bold tracking-[-0.03em]">SisAgenda</div>
              <div className="mt-[7px] text-[12px] tracking-[0.1em] text-neutral-700 uppercase">{INSTITUTO}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[12px] text-neutral-700">
            <span>{dataPorExtenso(HOJE)}</span>
            <span aria-hidden="true" className="text-neutral-400">|</span>
            <span>{currentUser.email}</span>
            <button id="sidebar-logout-btn" type="button" onClick={handleLogout} className="btn btn-ghost text-[12px]">
              Sair
            </button>
          </div>
        </header>

        {/* Índice horizontal; abaixo de 768px o drawer assume a navegação */}
        <nav aria-label="Índice" className="hidden flex-wrap gap-7 pt-[22px] pb-[13px] md:flex">
          {INDICE.map((item) => {
            const ativo = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                type="button"
                aria-current={ativo ? 'page' : undefined}
                onClick={() => setActiveView(item.id)}
                className={`cursor-pointer border-b-2 pb-[3px] text-[14px] tracking-[0.1em] uppercase hover:text-accent-700
                  ${ativo ? 'border-accent text-text' : 'border-transparent text-neutral-700'}`}
              >
                {item.rotulo}
              </button>
            );
          })}
        </nav>

        <div className="mt-[22px] h-px bg-divider md:mt-0" />

        {/* Barra de alerta global: uma linha de texto, some sozinha em 5s */}
        <div aria-live="polite">
          {alert && (
            <div className="flex items-start gap-3 border-b border-divider py-4 text-[14px]">
              {alert.type === 'success' ? (
                <CheckCircle size={20} className="mt-px shrink-0 text-accent" aria-hidden="true" />
              ) : (
                <WarningCircle size={20} className="mt-px shrink-0 text-accent-2" aria-hidden="true" />
              )}
              <span className="flex-1">{alert.message}</span>
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="cursor-pointer px-1.5 py-px text-neutral-700 hover:text-accent-700"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        <main>
          {activeView === 'dashboard' && (
            <DashboardView
              agendamentos={agendamentos}
              clientes={clientes}
              servicos={servicos}
              onNavigateTo={handleNavigateFromDashboard}
              userEmail={currentUser.email}
            />
          )}

          {activeView === 'clientes' && (
            <ClientesView
              clientes={clientes}
              onSalvar={handleSalvarCliente}
              onExcluir={handleExcluirCliente}
              carregando={loadingData}
            />
          )}

          {activeView === 'servicos' && (
            <ServicosView
              servicos={servicos}
              onSalvar={handleSalvarServico}
              onExcluir={handleExcluirServico}
              carregando={loadingData}
            />
          )}

          {activeView === 'agendamentos' && (
            <AgendamentosView
              agendamentos={agendamentos}
              clientes={clientes}
              servicos={servicos}
              onSalvar={handleSalvarAgendamento}
              onMudarSituacao={handleMudarSituacao}
              onExcluir={handleExcluirAgendamento}
              carregando={loadingData}
              forceOpenCreateModal={forceOpenBookingModal}
              onClearForceOpen={() => setForceOpenBookingModal(false)}
            />
          )}
        </main>
      </div>

      {/* Drawer do índice: claro, à esquerda, aberto pelo ícone de lista */}
      {isMobileSidebarOpen && (
        <div id="mobile-sidebar-root" className="fixed inset-0 z-60 flex">
          <div className="absolute inset-0 bg-text/45" onClick={fecharIndice} aria-hidden="true" />

          <div
            ref={indiceRef}
            role="dialog"
            aria-modal="true"
            aria-label="Índice"
            tabIndex={-1}
            className="relative flex w-[320px] max-w-[86vw] flex-col gap-[26px] bg-bg px-[30px] py-[34px] shadow-lg outline-none"
          >
            <div className="flex items-start justify-between gap-3.5">
              <div>
                <div className="text-[28px] leading-none font-bold">SisAgenda</div>
                <div className="mt-1.5 text-[11px] tracking-[0.1em] text-neutral-700 uppercase">Índice</div>
              </div>
              <button
                id="close-mobile-sidebar"
                type="button"
                onClick={fecharIndice}
                aria-label="Fechar índice"
                className="cursor-pointer px-1.5 py-px text-neutral-700 hover:text-accent-700"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="h-px bg-divider" />

            <nav className="flex flex-col">
              {INDICE.map((item) => {
                const ativo = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    type="button"
                    aria-current={ativo ? 'page' : undefined}
                    onClick={() => handleNavigateFromDashboard(item.id)}
                    className={`cursor-pointer border-b border-divider py-4 text-left text-[20px] font-semibold hover:bg-neutral-100
                      ${ativo ? 'text-text' : 'text-neutral-700'}`}
                  >
                    {item.rotulo}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto text-[13px] text-neutral-700">
              <div>Você entrou como</div>
              <div className="mt-0.5 font-semibold break-all text-text">{currentUser.email}</div>
              <button id="mobile-logout-btn" type="button" onClick={handleLogout} className="btn btn-secondary mt-3.5 w-full">
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirmation Dialog before deleting entries */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onCancel={fecharConfirmModal}
      />
    </div>
  );
}
