import React, { useState, useEffect } from 'react';
import { AppView, Cliente, Servico, Agendamento, AuthUser } from './types';
import { DbService } from './services/db';
import { isSupabaseConfigured } from './supabaseClient';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ClientesView from './components/ClientesView';
import ServicosView from './components/ServicosView';
import AgendamentosView from './components/AgendamentosView';
import ConfirmModal from './components/ConfirmModal';
import {
  Calendar,
  Users,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  CheckCircle,
  AlertCircle,
  Database,
  CalendarCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      mostrarAlert('error', `Falha ao sincronizar dados com o banco: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper para acionar banners de feedback
  const mostrarAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // 3. Handlers para Clientes (Salvar / Excluir)
  const handleSalvarCliente = async (cliente: Partial<Cliente> & { nome: string }) => {
    try {
      await DbService.salvarCliente(cliente);
      await carregarTodosOsDados();
      mostrarAlert('success', `Cliente "${cliente.nome}" salvo com sucesso.`);
    } catch (err: any) {
      mostrarAlert('error', `Erro ao salvar cliente: ${err.message}`);
      throw err;
    }
  };

  const handleExcluirCliente = (id: string) => {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    setConfirmDelete({
      isOpen: true,
      title: 'Excluir Cliente?',
      message: `Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação removerá permanentemente todos os dados e agendamentos relacionados deste cliente.`,
      onConfirm: async () => {
        try {
          await DbService.excluirCliente(id);
          await carregarTodosOsDados();
          mostrarAlert('success', 'Cliente excluído com sucesso.');
        } catch (err: any) {
          mostrarAlert('error', `Falha ao excluir cliente: ${err.message}`);
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
      mostrarAlert('success', `Serviço "${servico.nome}" salvo com sucesso.`);
    } catch (err: any) {
      mostrarAlert('error', `Erro ao salvar serviço: ${err.message}`);
      throw err;
    }
  };

  const handleExcluirServico = (id: string) => {
    const servico = servicos.find(s => s.id === id);
    if (!servico) return;

    setConfirmDelete({
      isOpen: true,
      title: 'Excluir Serviço?',
      message: `Tem certeza que deseja excluir o serviço "${servico.nome}"? Esta ação removerá todos os agendamentos registrados para este serviço.`,
      onConfirm: async () => {
        try {
          await DbService.excluirServico(id);
          await carregarTodosOsDados();
          mostrarAlert('success', 'Serviço excluído da tabela com sucesso.');
        } catch (err: any) {
          mostrarAlert('error', `Falha ao excluir serviço: ${err.message}`);
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
      mostrarAlert('success', 'Agendamento salvo com sucesso na agenda.');
    } catch (err: any) {
      mostrarAlert('error', `Erro ao registrar horário: ${err.message}`);
      throw err;
    }
  };

  const handleExcluirAgendamento = (id: string) => {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;

    const clienteNome = ag.cliente?.nome || 'Cliente';

    setConfirmDelete({
      isOpen: true,
      title: 'Excluir Agendamento?',
      message: `Deseja cancelar e remover permanentemente o horário de "${clienteNome}" no dia ${ag.data_agendamento.split('-').reverse().join('/')} às ${ag.hora_agendamento}?`,
      onConfirm: async () => {
        try {
          await DbService.excluirAgendamento(id);
          await carregarTodosOsDados();
          mostrarAlert('success', 'Agendamento deletado da agenda.');
        } catch (err: any) {
          mostrarAlert('error', `Falha ao deletar agendamento: ${err.message}`);
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
      mostrarAlert('success', 'Sistema desconectado.');
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
      <div id="loader-screen" className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans">
        <Calendar className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
        <p className="text-sm font-semibold text-slate-300">Carregando sistema de agendamento...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={(val) => setCurrentUser(val)} />;
  }

  // Lista dos Menus de Navegacao Lateral
  const navigationItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agendamentos' as AppView, label: 'Agendamentos', icon: CalendarCheck },
    { id: 'clientes' as AppView, label: 'Clientes', icon: Users },
    { id: 'servicos' as AppView, label: 'Serviços', icon: TrendingUp },
  ];

  return (
    <div id="app-viewport-root" className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 shrink-0 font-sans">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/80">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-md shadow-blue-600/10">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-white text-base font-bold tracking-tight">SISAGENDA</h1>
            <p className="text-[10px] text-slate-400 font-medium">Dashboard Administrativo</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                  }`}
              >
                <IconComponent className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User detail */}
        <div className="px-4 py-5 border-t border-slate-800/50 bg-slate-950/40">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acesso Logado</div>
            <div className="text-xs text-slate-300 font-semibold truncate" title={currentUser.email}>
              {currentUser.email}
            </div>

            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700/60 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation Bar - Mobile and Desktop Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          {/* Brand/Nav toggle for small devices */}
          <div className="flex items-center gap-3">
            <button
              id="mobile-sidebar-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition shrink-0 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <span className="text-sm font-bold text-slate-800 tracking-tight lg:hidden flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-blue-600" />
              <span>SISAGENDA</span>
            </span>

            <span className="hidden lg:inline text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {activeView === 'dashboard' && 'Visão Geral do Negócio'}
              {activeView === 'agendamentos' && 'Sincronizador de Agenda'}
              {activeView === 'clientes' && 'Carteira de Clientes'}
              {activeView === 'servicos' && 'Tabela de Serviços'}
            </span>
          </div>

          {/* Database Synchronization Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Database className="h-3.5 w-3.5" />
              <span>Banco de dados:</span>
              <span className={`font-bold uppercase tracking-wider rounded px-1.5 py-0.5 text-[9px]
                ${isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isSupabaseConfigured ? 'Supabase' : 'Offline local'}
              </span>
            </div>

            <span className="font-mono text-xs text-slate-400 border border-slate-200/60 rounded-md px-2 py-1 bg-slate-50">
              12/06/2026 {/* Base date */}
            </span>
          </div>
        </header>

        {/* Global Feedback Alert Box */}
        <AnimatePresence>
          {alert && (
            <div className="px-6 pt-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl shadow-xs border flex items-start gap-3 text-xs leading-relaxed font-bold
                  ${alert.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}
              >
                {alert.type === 'success' ? (
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div className="flex-1">{alert.message}</div>
                <button onClick={() => setAlert(null)} className="opacity-50 hover:opacity-100 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Primary Page Canvas */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {/* Render Views dynamically */}
          {activeView === 'dashboard' && (
            <DashboardView
              agendamentos={agendamentos}
              clientes={clientes}
              servicos={servicos}
              onNavigateTo={handleNavigateFromDashboard}
              onLogout={handleLogout}
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
              onExcluir={handleExcluirAgendamento}
              carregando={loadingData}
              forceOpenCreateModal={forceOpenBookingModal}
              onClearForceOpen={() => setForceOpenBookingModal(false)}
            />
          )}
        </main>
      </div>

      {/* Mobile Drawer Navigation Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div id="mobile-sidebar-root" className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative flex flex-col w-72 bg-slate-900 text-slate-300 p-6 z-10"
            >
              <button
                id="close-mobile-sidebar"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
                <div className="rounded-lg bg-blue-600 p-2 text-white shadow-md shadow-blue-600/10">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold tracking-tight">SISAGENDA</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Navegação Móvel</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex-1 py-6 space-y-1.5">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-${item.id}`}
                      onClick={() => handleNavigateFromDashboard(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                        }`}
                    >
                      <IconComponent className="h-4.5 w-4.5 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-5 border-t border-slate-800 bg-slate-950/40 -mx-6 px-6 pb-2">
                <div className="flex flex-col gap-1 text-[11px] text-slate-400 mb-3 truncate">
                  <span>Logado como:</span>
                  <span className="font-bold text-slate-200">{currentUser.email}</span>
                </div>
                <button
                  id="mobile-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Terminar Sessão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
