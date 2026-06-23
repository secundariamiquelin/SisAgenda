import React, { useState, useEffect } from 'react';
import { Agendamento, Cliente, Servico, AgendamentoStatus } from '../types';
import { Search, PlusCircle, Edit2, Trash2, X, Calendar, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, User, FolderPlus, Clock, DollarSign, CalendarCheck, Check, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgendamentosViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  servicos: Servico[];
  onSalvar: (agendamento: Partial<Agendamento> & {
    cliente_id: string;
    servico_id: string;
    data_agendamento: string;
    hora_agendamento: string;
    status: AgendamentoStatus;
  }) => Promise<void>;
  onExcluir: (id: string) => void;
  carregando: boolean;
  forceOpenCreateModal: boolean;
  onClearForceOpen: () => void;
}

export default function AgendamentosView({
  agendamentos,
  clientes,
  servicos,
  onSalvar,
  onExcluir,
  carregando,
  forceOpenCreateModal,
  onClearForceOpen
}: AgendamentosViewProps) {
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);

  // Form fields
  const [clienteId, setClienteId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('2026-06-12'); // default context date
  const [horaAgendamento, setHoraAgendamento] = useState('09:00');
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState<AgendamentoStatus>('Agendado');

  // Validation & alerts
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // React on action navigation from dashboard
  useEffect(() => {
    if (forceOpenCreateModal) {
      openRegisterModal();
      onClearForceOpen();
    }
  }, [forceOpenCreateModal]);

  // Filter schedules
  const filteredAgendamentos = agendamentos.filter(ag => {
    // 1. Filter by Search input
    const term = search.toLowerCase();
    const matchesSearch =
      (ag.cliente?.nome || '').toLowerCase().includes(term) ||
      (ag.servico?.nome || '').toLowerCase().includes(term) ||
      (ag.observacao || '').toLowerCase().includes(term) ||
      ag.data_agendamento.includes(term) ||
      ag.hora_agendamento.includes(term);

    // 2. Filter by status tabs
    const matchesStatus =
      selectedStatusFilter === 'Todos' || ag.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgendamentos.length / itemsPerPage) || 1;
  const paginatedAgendamentos = filteredAgendamentos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openRegisterModal = (agendamento?: Agendamento) => {
    if (agendamento) {
      setEditingAgendamento(agendamento);
      setClienteId(agendamento.cliente_id);
      setServicoId(agendamento.servico_id);
      setDataAgendamento(agendamento.data_agendamento);
      setHoraAgendamento(agendamento.hora_agendamento);
      setObservacao(agendamento.observacao || '');
      setStatus(agendamento.status);
    } else {
      setEditingAgendamento(null);
      // Pega o primeiro cliente/serviço por padrão, se houver
      setClienteId(clientes.length > 0 ? clientes[0].id : '');
      setServicoId(servicos.length > 0 ? servicos[0].id : '');
      setDataAgendamento('2026-06-12');
      setHoraAgendamento('09:00');
      setObservacao('');
      setStatus('Agendado');
    }
    setValidationError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setValidationError('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteId) {
      setValidationError('Selecione uma criança/aluno assistido para registrar o agendamento.');
      return;
    }

    if (!servicoId) {
      setValidationError('Selecione uma modalidade de terapia para realizar o agendamento.');
      return;
    }

    if (!dataAgendamento) {
      setValidationError('A data do agendamento é obrigatória.');
      return;
    }

    if (!horaAgendamento) {
      setValidationError('A hora do agendamento é obrigatória.');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      await onSalvar({
        id: editingAgendamento?.id,
        cliente_id: clienteId,
        servico_id: servicoId,
        data_agendamento: dataAgendamento,
        hora_agendamento: horaAgendamento,
        observacao: observacao.trim(),
        status
      });
      handleCloseModal();
    } catch (err: any) {
      setValidationError(err.message || 'Falha ao salvar agendamento.');
      setIsSubmitting(false);
    }
  };

  const changeStatusQuickly = async (ag: Agendamento, newStatus: AgendamentoStatus) => {
    try {
      await onSalvar({
        id: ag.id,
        cliente_id: ag.cliente_id,
        servico_id: ag.servico_id,
        data_agendamento: ag.data_agendamento,
        hora_agendamento: ag.hora_agendamento,
        observacao: ag.observacao || '',
        status: newStatus
      });
    } catch (err: any) {
      alert(`Falha ao alterar status: ${err.message}`);
    }
  };

  const formatPreco = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Funções legíveis auxiliares para datas
  const helperFormatDate = (dateStr: string) => {
    if (dateStr === '2026-06-12') return <strong className="text-blue-600">Hoje (12/06/2026)</strong>;
    if (dateStr === '2026-06-13') return <span className="text-emerald-700">Amanhã (13/06/2026)</span>;
    // Formatar DD/MM/YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div id="agendamentos-view-root" className="space-y-6">
      {/* Top Controls Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Atendimentos & Consultas</h2>
          <p className="text-xs text-slate-500">Planeje horários lúdicos, fonoaudiológicos e psicopedagógicos das crianças</p>
        </div>

        <button
          id="btn-criar-agendamento"
          onClick={() => openRegisterModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Agendar Atendimento
        </button>
      </div>

      {/* Tabs list for filtering by status */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-1">
        {['Todos', 'Agendado', 'Confirmado', 'Concluído', 'Cancelado'].map((st) => (
          <button
            key={st}
            id={`tab-filter-${st}`}
            onClick={() => {
              setSelectedStatusFilter(st);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition cursor-pointer
              ${selectedStatusFilter === st
                ? 'border-blue-600 text-blue-700 bg-blue-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="input-pesquisar-agendamentos"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar cliente, serviço, observações, hora..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Loading / Empty States */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs">Buscando compromissos agendados...</p>
          </div>
        ) : filteredAgendamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 text-slate-300 mb-3">
              <Calendar className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Nenhum agendamento encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
              {search || selectedStatusFilter !== 'Todos'
                ? 'Nenhum resultado atende à sua busca ou status selecionado.'
                : 'Você ainda não possui horários marcados. Agende um horário para começar!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Horário & Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Serviço Pretendido</th>
                  <th className="px-6 py-4">Observações</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedAgendamentos.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/40 transition">
                    {/* Data e Hora */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-md bg-blue-50 border border-blue-100 px-2 py-1 text-xs font-bold text-blue-700 font-mono">
                          {ag.hora_agendamento}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                          {helperFormatDate(ag.data_agendamento)}
                        </span>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {ag.cliente?.nome || <span className="text-rose-500 italic">Desconhecido</span>}
                        </div>
                        {ag.cliente?.telefone && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ag.cliente.telefone}</div>
                        )}
                      </div>
                    </td>

                    {/* Serviço */}
                    <td className="px-6 py-4">
                      {ag.servico ? (
                        <div>
                          <div className="font-semibold text-slate-800">{ag.servico.nome}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ag.servico.duracao_minutos} min • <span className="font-bold text-blue-600">{formatPreco(ag.servico.preco)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-500 italic">Serviço indisponível</span>
                      )}
                    </td>

                    {/* Observação */}
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={ag.observacao}>
                      {ag.observacao || <span className="text-slate-300 italic">Nenhuma observação</span>}
                    </td>

                    {/* Status Toggle Box */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <select
                          id={`select-status-agendamento-${ag.id}`}
                          value={ag.status}
                          onChange={(e) => changeStatusQuickly(ag, e.target.value as AgendamentoStatus)}
                          className={`text-xs font-bold tracking-wider uppercase rounded-md border border-slate-200 px-2.5 py-1 focus:outline-hidden
                            ${ag.status === 'Confirmado' ? 'bg-blue-50 text-blue-700' : ''}
                            ${ag.status === 'Agendado' ? 'bg-amber-50 text-amber-700' : ''}
                            ${ag.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700' : ''}
                            ${ag.status === 'Cancelado' ? 'bg-rose-50 text-rose-700' : ''}
                          `}
                        >
                          <option value="Agendado">📅 Agendado</option>
                          <option value="Confirmado">✅ Confirmado</option>
                          <option value="Concluído">✔️ Concluído</option>
                          <option value="Cancelado">❌ Cancelado</option>
                        </select>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-editar-agendamento-${ag.id}`}
                          onClick={() => openRegisterModal(ag)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-excluir-agendamento-${ag.id}`}
                          onClick={() => onExcluir(ag.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-500">
                <span>
                  Exibindo página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> (
                  Total de <strong>{filteredAgendamentos.length}</strong> agendamentos)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    id="pagination-prev"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    id="pagination-next"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduler Dialog modal */}
      <AnimatePresence>
        {modalOpen && (
          <div id="agendamento-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs"
            />

            {/* Form modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl p-6 z-10 border border-slate-100"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-bold text-slate-950">
                {editingAgendamento ? 'Editar Horário Marcado' : 'Agendar Novo Atendimento'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira as detalhes temporais do serviço e confira conflitos instantaneamente.
              </p>

              {clientes.length === 0 || servicos.length === 0 ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Pré-requisitos Faltantes</span>
                  </div>
                  <p>
                    Para registrar um novo agendamento, primeiro você precisa de no mínimo <strong>1 cliente</strong> e <strong>1 serviço</strong> cadastrados no sistema.
                  </p>
                  <p className="text-[11px] font-sans text-amber-900">
                    Por favor, utilize o menu lateral para cadastrar serviços e clientes primeiro!
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      id="btn-close-required-warn"
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded bg-white border border-amber-200 px-3 py-1 font-bold text-amber-900 hover:bg-amber-100 transition"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {validationError && (
                    <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 font-semibold leading-relaxed">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Cliente Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Selecione o Cliente <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-agendamento-cliente"
                      required
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="" disabled>-- Selecione um cliente cadastrado --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `(${c.telefone})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Servico Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Selecione o Serviço <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-agendamento-servico"
                      required
                      value={servicoId}
                      onChange={(e) => setServicoId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="" disabled>-- Selecione o serviço pretendido --</option>
                      {servicos.map(s => (
                        <option key={s.id} value={s.id}>{s.nome} ({s.duracao_minutos} min • {formatPreco(s.preco)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Data & Hora */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Data do Atendimento <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-agendamento-data"
                        type="date"
                        required
                        value={dataAgendamento}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Hora de Início <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="input-agendamento-hora"
                        type="time"
                        required
                        value={horaAgendamento}
                        onChange={(e) => setHoraAgendamento(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Status & Observação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Status Inicial do Agendamento
                      </label>
                      <select
                        id="select-agendamento-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AgendamentoStatus)}
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="Agendado">📅 Agendado</option>
                        <option value="Confirmado">✅ Confirmado</option>
                        <option value="Concluído">✔️ Concluído</option>
                        <option value="Cancelado">❌ Cancelado</option>
                      </select>
                    </div>

                    <div className="flex items-end text-[11px] text-slate-400 pb-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="flex items-start gap-1.5">
                        <CalendarCheck className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Bloqueio de Agenda:</strong> status diferentes de <strong>Cancelado</strong> restringem a agenda de aceitar reservas no mesmo dia e horário.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Observações & Detalhes Adicionais
                    </label>
                    <textarea
                      id="textarea-agendamento-observacoes"
                      rows={2.5}
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Levar fotos de referência, restrições a produtos de salão..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      id="btn-modal-cancelar"
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                    >
                      Cancelar
                    </button>
                    <button
                      id="btn-modal-salvar"
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-md shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Validando Horários...' : 'Registrar Agendamento'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
