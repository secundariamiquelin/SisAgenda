import React from 'react';
import { Agendamento, Cliente, Servico, AppView } from '../types';
import { Calendar, Users, TrendingUp, Sparkles, Clock, CheckCircle, AlertTriangle, Play, CalendarCheck, ShieldAlert, PlusCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  servicos: Servico[];
  onNavigateTo: (view: AppView, action?: string) => void;
  onLogout: () => void;
  userEmail: string;
}

export default function DashboardView({
  agendamentos,
  clientes,
  servicos,
  onNavigateTo,
  onLogout,
  userEmail
}: DashboardViewProps) {
  // Pegamos a data atual formatada com base no contexto do sistema (2026-06-12)
  const todayStr = '2026-06-12';

  // Filtragem de agendamentos de hoje
  const agendamentosHoje = agendamentos.filter(a => a.data_agendamento === todayStr);
  const agendamentosHojeAtivos = agendamentosHoje.filter(a => a.status !== 'Cancelado');

  // Próximos agendamentos (qualquer agendamento hoje ou no futuro com status não cancelado)
  const proximosAgendamentos = agendamentos
    .filter(a => {
      const dataHoraStr = `${a.data_agendamento}T${a.hora_agendamento}:00`;
      const dataHora = new Date(dataHoraStr);
      const referencia = new Date(`${todayStr}T00:00:00`);
      return dataHora >= referencia && a.status !== 'Cancelado';
    })
    .slice(0, 5); // limite de 5 na visualização simplificada do painel

  // Faturamento potencial de hoje (somente concluídos e confirmados/agendados hoje)
  const faturamentoHoje = agendamentosHojeAtivos.reduce((acc, ag) => {
    return acc + (ag.servico?.preco || 0);
  }, 0);

  // Formata moeda (BRL)
  const formatPreco = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getFormattedName = () => {
    const emailLower = userEmail.toLowerCase();
    if (emailLower.includes('mileide')) return 'Mileide Martins';
    if (emailLower.includes('mentes')) return 'Direção Geral';
    if (emailLower.includes('adenilson')) return 'Adenilson Martins';
    return 'Administrador';
  };

  return (
    <div id="dashboard-view-root" className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
              <Sparkles className="h-3 w-3" />
              Mentes em Desenvolvimento • Sarandi - PR
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Olá, {getFormattedName()}!
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-xl">
              Gerencie os atendimentos multidisciplinares das crianças atendidas pelo Instituto Mentes em Desenvolvimento. Acompanhamento psicopedagógico, psicológico e fonoaudiológico facilitado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              id="dashboard-btn-new-appointment"
              onClick={() => onNavigateTo('agendamentos', 'novo')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/15 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              Novo Agendamento
            </button>

            <button
              id="dashboard-btn-logout"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/55 hover:bg-slate-800 hover:border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut className="h-4.5 w-4.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agendamentos de Hoje */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agendamentos Hoje</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{agendamentosHojeAtivos.length}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {agendamentosHoje.length - agendamentosHojeAtivos.length} cancelado(s) hoje
            </p>
          </div>
        </div>

        {/* Total de Clientes */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Clientes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{clientes.length}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Clientes cadastrados</p>
          </div>
        </div>

        {/* Serviços Disponíveis */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Serviços Ativos</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{servicos.length}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Portfólio atualizado</p>
          </div>
        </div>

        {/* Receita Diária Prevista */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Faturamento Hoje</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatPreco(faturamentoHoje)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Soma dos agendamentos ativos</p>
          </div>
        </div>
      </div>

      {/* Grid: Proximos Agendamentos & Destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of upcoming bookings */}
        <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Agenda Próxima</h3>
              <p className="text-xs text-slate-500">Próximos compromissos mais urgentes na agenda ativa</p>
            </div>
            <button
              id="dashboard-btn-view-all-appointments"
              onClick={() => onNavigateTo('agendamentos')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Ver Agenda Completa
            </button>
          </div>

          <div className="space-y-3">
            {proximosAgendamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                <p className="mt-3 text-sm font-semibold text-slate-700">Nenhum agendamento futuro</p>
                <p className="text-xs text-slate-400 mt-1 px-4 max-w-xs">
                  Sua agenda de agendamentos futuros ou programados para hoje está vazia agora.
                </p>
                <button
                  id="dashboard-btn-create-one"
                  onClick={() => onNavigateTo('agendamentos', 'novo')}
                  className="mt-4 rounded-lg bg-blue-50 hover:bg-blue-100/80 px-3.5 py-1.5 text-xs font-bold text-blue-600 transition cursor-pointer"
                >
                  Agendar Primeiro Cliente
                </button>
              </div>
            ) : (
              proximosAgendamentos.map((ag) => {
                const isToday = ag.data_agendamento === todayStr;

                return (
                  <div
                    key={ag.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Horário & Badge de Hoje */}
                      <div className="flex flex-col items-center justify-center rounded-lg bg-white border border-slate-100 px-3 py-2 min-w-[70px] shadow-2xs">
                        <span className="text-xs font-bold text-slate-800">{ag.hora_agendamento}</span>
                        {isToday ? (
                          <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase mt-0.5">HOJE</span>
                        ) : (
                          <span className="text-[9px] text-slate-400 mt-0.5">
                            {ag.data_agendamento.split('-').slice(1).reverse().join('/')}
                          </span>
                        )}
                      </div>

                      {/* Info de cliente e serviço */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {ag.cliente?.nome || 'Cliente não encontrado'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ag.servico?.nome || 'Serviço não encontrado'}
                        </p>
                        {ag.observacao && (
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm truncate italic">
                            &ldquo;{ag.observacao}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                        ${ag.status === 'Confirmado' ? 'bg-blue-50 text-blue-700 border border-blue-100' : ''}
                        ${ag.status === 'Agendado' ? 'bg-amber-50 text-amber-700 border border-amber-100' : ''}
                        ${ag.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : ''}
                        ${ag.status === 'Cancelado' ? 'bg-rose-50 text-rose-700 border border-rose-100' : ''}
                      `}>
                        <span className={`h-1.5 w-1.5 rounded-full
                          ${ag.status === 'Confirmado' ? 'bg-blue-500' : ''}
                          ${ag.status === 'Agendado' ? 'bg-amber-500' : ''}
                          ${ag.status === 'Concluído' ? 'bg-emerald-500' : ''}
                          ${ag.status === 'Cancelado' ? 'bg-rose-500' : ''}
                        `}></span>
                        {ag.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Business Day Overview & Fast Setup */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ações Rápidas</h3>
            <p className="text-xs text-slate-500">Módulos integrados do Instituto Mentes</p>

            <div className="mt-4 space-y-2.5">
               <button
                id="dashboard-card-btn-clientes"
                onClick={() => onNavigateTo('clientes')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/20 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gerenciar Crianças/Assistidos</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Cadastre o histórico do aluno e dados dos responsáveis</p>
                </div>
                <Users className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              <button
                id="dashboard-card-btn-servicos"
                onClick={() => onNavigateTo('servicos')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/20 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Gerenciar Terapias</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Ajuste sessões psicopedagógicas, fonoaudiologia e custos sociais</p>
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-slate-800">Causa Social Solidária</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                  O projeto é mantido por Mileide e Adenilson com recursos de trabalho externo. Manter a agenda organizada possibilita atender mais famílias na região de Sarandi - PR!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
