import React, { useState } from 'react';
import { Servico } from '../types';
import { Search, PlusCircle, Edit2, Trash2, X, TrendingUp, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServicosViewProps {
  servicos: Servico[];
  onSalvar: (servico: Partial<Servico> & { nome: string; duracao_minutos: number; preco: number }) => Promise<void>;
  onExcluir: (id: string) => void;
  carregando: boolean;
}

export default function ServicosView({
  servicos,
  onSalvar,
  onExcluir,
  carregando
}: ServicosViewProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [duracao, setDuracao] = useState(30);
  const [preco, setPreco] = useState('');

  // Erros e avisos
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginação simples
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtrar serviços por pesquisa
  const filteredServicos = servicos.filter(s => {
    const term = search.toLowerCase();
    return (
      s.nome.toLowerCase().includes(term) ||
      s.duracao_minutos.toString().includes(term) ||
      s.preco.toString().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredServicos.length / itemsPerPage) || 1;
  const paginatedServicos = filteredServicos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openRegisterModal = (servico?: Servico) => {
    if (servico) {
      setEditingServico(servico);
      setNome(servico.nome);
      setDuracao(servico.duracao_minutos);
      setPreco(servico.preco.toString());
    } else {
      setEditingServico(null);
      setNome('');
      setDuracao(30);
      setPreco('');
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
    if (!nome.trim()) {
      setValidationError('O nome do serviço é obrigatório.');
      return;
    }

    const duracaoNum = parseInt(duracao.toString());
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setValidationError('A duração em minutos deve ser um número inteiro maior que zero.');
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum < 0) {
      setValidationError('O preço do serviço deve ser um número válido igual ou superior a zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      await onSalvar({
        id: editingServico?.id,
        nome: nome.trim(),
        duracao_minutos: duracaoNum,
        preco: precoNum
      });
      handleCloseModal();
    } catch (err: any) {
      setValidationError(err.message || 'Houve um erro ao processar o salvamento do serviço.');
      setIsSubmitting(false);
    }
  };

  // Formata preço em BRL
  const formatPreco = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div id="servicos-view-root" className="space-y-6">
      {/* Top Controls Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Terapias & Atendimentos</h2>
          <p className="text-xs text-slate-500">Defina as especialidades de atendimento oferecidas, duração média das sessões e custos simbólicos/sociais</p>
        </div>

        <button
          id="btn-cadastrar-servico"
          onClick={() => openRegisterModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Cadastrar Terapia
        </button>
      </div>

      {/* Search Bar & Table Card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-2xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/20">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="input-pesquisar-servicos"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset page on filter
              }}
              placeholder="Pesquisar por nome de serviço, preço, minutos..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Loading and Empty States */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs">Buscando lista de serviços...</p>
          </div>
        ) : filteredServicos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 text-slate-300 mb-3">
              <TrendingUp className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Nenhum serviço disponível</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
              {search ? 'Nenhum serviço atende aos critérios da sua pesquisa.' : 'Adicione seu primeiro serviço clicando no botão para compor sua lista de agendamentos.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Nome do Serviço</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedServicos.map((servico) => (
                  <tr key={servico.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{servico.nome}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {servico.duracao_minutos} minutos
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">{formatPreco(servico.preco)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-editar-servico-${servico.id}`}
                          onClick={() => openRegisterModal(servico)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-excluir-servico-${servico.id}`}
                          onClick={() => onExcluir(servico.id)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-500">
                <span>
                  Exibindo página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> (
                  Total de <strong>{filteredServicos.length}</strong> serviços)
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

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div id="servico-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs"
            />

            {/* Form Box */}
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
                {editingServico ? 'Editar Especialidade / Terapia' : 'Adicionar Nova Especialidade / Terapia'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira as detalhes da modalidade de atendimento multidisciplinar oferecido pelo Instituto.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {validationError && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome da Terapia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-servico-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Atendimento Psicopedagógico (Mileide) - TEA"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Duração (Minutos) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-servico-duracao"
                      type="number"
                      required
                      min={1}
                      value={duracao}
                      onChange={(e) => setDuracao(parseInt(e.target.value) || 0)}
                      placeholder="Ex: 45"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Preço Cobrado (R$) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-servico-preco"
                      type="text"
                      required
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="Ex: 120,00"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                    {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
