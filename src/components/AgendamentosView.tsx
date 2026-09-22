import React, { useState, useEffect } from 'react';
import { Agendamento, Cliente, Servico, AgendamentoStatus } from '../types';
import { X, Calendar, AlertCircle, Clock, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Paginacao from './ui/Paginacao';
import AcoesLinha from './ui/AcoesLinha';
import EstadoVazio from './ui/EstadoVazio';
import { COR_SITUACAO, HOJE, SITUACOES, formatarContribuicao, plural, rotuloDia } from './ui/formatos';

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
  onMudarSituacao: (agendamento: Agendamento, status: AgendamentoStatus) => void;
  onExcluir: (id: string) => void;
  carregando: boolean;
  forceOpenCreateModal: boolean;
  onClearForceOpen: () => void;
}

const FILTROS = ['Todas', ...SITUACOES];

export default function AgendamentosView({
  agendamentos,
  clientes,
  servicos,
  onSalvar,
  onMudarSituacao,
  onExcluir,
  carregando,
  forceOpenCreateModal,
  onClearForceOpen
}: AgendamentosViewProps) {
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);

  // Form fields
  const [clienteId, setClienteId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState(HOJE);
  const [horaAgendamento, setHoraAgendamento] = useState('09:00');
  const [observacao, setObservacao] = useState('');
  const [status, setStatus] = useState<AgendamentoStatus>('Agendado');

  // Validation & alerts
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      selectedStatusFilter === 'Todas' || ag.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgendamentos.length / itemsPerPage) || 1;
  // Depois de uma exclusão a página atual pode deixar de existir
  const paginaAtual = Math.min(currentPage, totalPages);
  const paginatedAgendamentos = filteredAgendamentos.slice(
    (paginaAtual - 1) * itemsPerPage,
    paginaAtual * itemsPerPage
  );
  const buscando = search !== '' || selectedStatusFilter !== 'Todas';

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
      setDataAgendamento(HOJE);
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

  const formatPreco = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <section id="agendamentos-view-root" className="pt-11">
      <CabecalhoPagina
        titulo="A agenda"
        descricao="Todas as sessões marcadas — quem vem, com quem, a que horas."
        acao={
          <button id="btn-criar-agendamento" type="button" onClick={() => openRegisterModal()} className="btn btn-primary">
            Marcar atendimento
          </button>
        }
      />

      {/* Filtros de situação e busca */}
      <div className="mt-[34px] flex flex-wrap items-center gap-6 border-b border-divider pb-3">
        {FILTROS.map((filtro) => {
          const ativo = selectedStatusFilter === filtro;
          return (
            <button
              key={filtro}
              id={`tab-filter-${filtro}`}
              type="button"
              aria-pressed={ativo}
              onClick={() => {
                setSelectedStatusFilter(filtro);
                setCurrentPage(1);
              }}
              className={`cursor-pointer border-b-2 pb-1 text-[13px] tracking-[0.1em] uppercase hover:text-accent-700
                ${ativo ? 'border-accent text-text' : 'border-transparent text-neutral-700'}`}
            >
              {filtro}
            </button>
          );
        })}
        <input
          id="input-pesquisar-agendamentos"
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Buscar na agenda"
          placeholder="Buscar criança, terapia, horário…"
          className="input sm:ml-auto sm:w-auto sm:min-w-[280px]"
        />
      </div>

      {carregando ? (
        <p role="status" className="py-[70px] text-[15px] text-neutral-700">Carregando a agenda…</p>
      ) : filteredAgendamentos.length === 0 ? (
        buscando ? (
          <EstadoVazio
            titulo="Nada encontrado"
            texto="Nenhuma sessão corresponde à busca ou ao filtro escolhido. Tente outro termo ou volte para “Todas”."
          />
        ) : (
          <EstadoVazio
            titulo="A agenda está em branco"
            texto="Nenhuma sessão marcada ainda. Que tal chamar a primeira família da lista de espera?"
            acao={
              <button type="button" onClick={() => openRegisterModal()} className="btn btn-secondary">
                Marcar a primeira
              </button>
            }
          />
        )
      ) : (
        <>
          <div className="mt-2 overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Criança</th>
                  <th>Terapia</th>
                  <th>Observações</th>
                  <th>Situação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgendamentos.map((ag) => {
                  const nome = ag.cliente?.nome || 'Criança removida';
                  return (
                    <tr key={ag.id} className="hover:bg-neutral-100">
                      <td>
                        <div className="text-[18px] font-bold">{ag.hora_agendamento}</div>
                        <div
                          className={`mt-0.5 text-[12px] ${ag.data_agendamento === HOJE ? 'text-accent-700' : 'text-neutral-700'}`}
                        >
                          {rotuloDia(ag.data_agendamento)}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{nome}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-700">{ag.cliente?.telefone || '—'}</div>
                      </td>
                      <td>
                        <div>{ag.servico?.nome || 'Terapia removida'}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-700">
                          {ag.servico
                            ? `${ag.servico.duracao_minutos} min · ${formatarContribuicao(ag.servico.preco)}`
                            : '—'}
                        </div>
                      </td>
                      <td className="max-w-[240px] text-[13px] text-neutral-700">{ag.observacao || '—'}</td>
                      <td>
                        <select
                          id={`select-status-agendamento-${ag.id}`}
                          value={ag.status}
                          onChange={(e) => onMudarSituacao(ag, e.target.value as AgendamentoStatus)}
                          aria-label={`Situação da sessão de ${nome}`}
                          className={`input px-2 py-[5px] text-[12px] tracking-[0.06em] uppercase ${COR_SITUACAO[ag.status].texto}`}
                        >
                          {SITUACOES.map((situacao) => (
                            <option key={situacao} value={situacao}>
                              {situacao}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <AcoesLinha
                          descricao={`a sessão de ${nome}`}
                          idEditar={`btn-editar-agendamento-${ag.id}`}
                          idExcluir={`btn-excluir-agendamento-${ag.id}`}
                          onEditar={() => openRegisterModal(ag)}
                          onExcluir={() => onExcluir(ag.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Paginacao
            resumo={`Página ${paginaAtual} de ${totalPages} · ${plural(filteredAgendamentos.length, 'sessão', 'sessões')}`}
            pagina={paginaAtual}
            totalPaginas={totalPages}
            onMudarPagina={setCurrentPage}
          />
        </>
      )}

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
    </section>
  );
}
