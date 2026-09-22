import React, { useState, useEffect } from 'react';
import { Agendamento, Cliente, Servico, AgendamentoStatus } from '../types';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Campo from './ui/Campo';
import Dialogo from './ui/Dialogo';
import Paginacao from './ui/Paginacao';
import AcoesLinha from './ui/AcoesLinha';
import EstadoVazio from './ui/EstadoVazio';
import { COR_SITUACAO, SITUACOES, formatarContribuicao, plural, rotuloDia } from './ui/formatos';

interface AgendamentosViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  servicos: Servico[];
  /** Dia de hoje em AAAA-MM-DD. */
  hoje: string;
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
  hoje,
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
  const [dataAgendamento, setDataAgendamento] = useState(hoje);
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
      setDataAgendamento(hoje);
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

    if (!clienteId || !servicoId) {
      setValidationError('Escolha a criança e a terapia da sessão.');
      return;
    }

    if (!dataAgendamento || !horaAgendamento) {
      setValidationError('Informe o dia e a hora do atendimento.');
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
      setValidationError(err.message || 'Não deu para salvar a sessão.');
      setIsSubmitting(false);
    }
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
                          className={`mt-0.5 text-[12px] ${ag.data_agendamento === hoje ? 'text-accent-700' : 'text-neutral-700'}`}
                        >
                          {rotuloDia(ag.data_agendamento, hoje)}
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

      <Dialogo
        id="agendamento-modal"
        aberto={modalOpen}
        onFechar={handleCloseModal}
        tituloId="agendamento-modal-titulo"
        largura="max-w-[560px]"
      >
        <h3 id="agendamento-modal-titulo" className="dialog-title mb-1.5 text-[28px]">
          {editingAgendamento ? 'Ajustar a sessão' : 'Marcar um atendimento'}
        </h3>

        {clientes.length === 0 || servicos.length === 0 ? (
          <>
            <p className="m-0 text-[15px] text-neutral-800">
              Antes de marcar uma sessão, cadastre pelo menos uma criança e uma terapia. Os dois cadastros ficam no
              índice, em Crianças e Terapias.
            </p>
            <div className="dialog-actions mt-7 gap-3.5">
              <button id="btn-close-required-warn" type="button" onClick={handleCloseModal} className="btn btn-primary">
                Entendi
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-6 text-[14px] text-neutral-700">
              Escolha a criança, a terapia e o horário. A gente avisa se já houver alguém nesse mesmo espaço.
            </p>

            <form onSubmit={handleSubmit} noValidate className="contents">
              {validationError && (
                <div role="alert" className="mb-4 text-[13px] text-accent-2-700">
                  {validationError}
                </div>
              )}

              <div className="flex flex-col gap-[18px]">
                <Campo rotulo="Criança">
                  <select
                    id="select-agendamento-cliente"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="input"
                  >
                    <option value="" disabled>Escolha a criança</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Terapia">
                  <select
                    id="select-agendamento-servico"
                    value={servicoId}
                    onChange={(e) => setServicoId(e.target.value)}
                    className="input"
                  >
                    <option value="" disabled>Escolha a terapia</option>
                    {servicos.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome} ({s.duracao_minutos} min)</option>
                    ))}
                  </select>
                </Campo>

                <div className="grid gap-[18px] sm:grid-cols-2">
                  <Campo rotulo="Dia">
                    <input
                      id="input-agendamento-data"
                      type="date"
                      value={dataAgendamento}
                      onChange={(e) => setDataAgendamento(e.target.value)}
                      className="input"
                    />
                  </Campo>
                  <Campo rotulo="Começa às">
                    <input
                      id="input-agendamento-hora"
                      type="time"
                      value={horaAgendamento}
                      onChange={(e) => setHoraAgendamento(e.target.value)}
                      className="input"
                    />
                  </Campo>
                </div>

                <Campo rotulo="Situação">
                  <select
                    id="select-agendamento-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AgendamentoStatus)}
                    className="input"
                  >
                    {SITUACOES.map((situacao) => (
                      <option key={situacao} value={situacao}>{situacao}</option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Recados para a sessão">
                  <textarea
                    id="textarea-agendamento-observacoes"
                    rows={3}
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex.: chegou cansado da escola, evitar sons altos"
                    className="input"
                  />
                </Campo>
              </div>

              <div className="dialog-actions mt-7 gap-3.5">
                <button id="btn-modal-cancelar" type="button" onClick={handleCloseModal} className="btn btn-ghost">
                  Cancelar
                </button>
                <button id="btn-modal-salvar" type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Salvando…' : 'Salvar na agenda'}
                </button>
              </div>
            </form>
          </>
        )}
      </Dialogo>
    </section>
  );
}
