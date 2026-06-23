import React, { useState } from 'react';
import { Cliente } from '../types';
import { Search, PlusCircle, Edit2, Trash2, X, Users, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientesViewProps {
  clientes: Cliente[];
  onSalvar: (cliente: Partial<Cliente> & { nome: string }) => Promise<void>;
  onExcluir: (id: string) => void;
  carregando: boolean;
}

export default function ClientesView({
  clientes,
  onSalvar,
  onExcluir,
  carregando
}: ClientesViewProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Erros e avisos
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginação simples
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtrar clientes por pesquisa
  const filteredClientes = clientes.filter(c => {
    const term = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.telefone && c.telefone.toLowerCase().includes(term)) ||
      (c.observacoes && c.observacoes.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage) || 1;
  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openRegisterModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setNome(cliente.nome);
      setTelefone(cliente.telefone || '');
      setObservacoes(cliente.observacoes || '');
    } else {
      setEditingCliente(null);
      setNome('');
      setTelefone('');
      setObservacoes('');
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
      setValidationError('O nome do cliente é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError('');
      await onSalvar({
        id: editingCliente?.id,
        nome: nome.trim(),
        telefone: telefone.trim(),
        observacoes: observacoes.trim()
      });
      handleCloseModal();
    } catch (err: any) {
      setValidationError(err.message || 'Houve um erro ao processar o salvamento.');
      setIsSubmitting(false);
    }
  };

  return (
    <div id="clientes-view-root" className="space-y-6">
      {/* Top Controls Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Crianças & Assistidos</h2>
          <p className="text-xs text-slate-500">Cadastre e gerencie a lista de crianças com autismo atendidas e o contato dos seus pais/responsáveis</p>
        </div>

        <button
          id="btn-cadastrar-cliente"
          onClick={() => openRegisterModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          Cadastrar Criança
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
              id="input-pesquisar-clientes"
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset page on filter
              }}
              placeholder="Pesquisar por nome, telefone, observações..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Loading and Empty States */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs">Buscando lista de clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-50 p-4 text-slate-300 mb-3">
              <Users className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Nenhuma criança cadastrada</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 px-4">
              {search ? 'Nenhum resultado atende aos critérios da sua pesquisa.' : 'Adicione a primeira criança cadastrada clicando no botão acima.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Nome da Criança</th>
                  <th className="px-6 py-4">Responsável / Telefone</th>
                  <th className="px-6 py-4">Observações e Nível TEA</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{cliente.nome}</td>
                    <td className="px-6 py-4 font-mono text-xs">{cliente.telefone || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={cliente.observacoes}>
                      {cliente.observacoes || <span className="text-slate-300 italic">Sem observações</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-editar-cliente-${cliente.id}`}
                          onClick={() => openRegisterModal(cliente)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-excluir-cliente-${cliente.id}`}
                          onClick={() => onExcluir(cliente.id)}
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
                  Total de <strong>{filteredClientes.length}</strong> clientes)
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
          <div id="cliente-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                {editingCliente ? 'Editar Cadastro de Assistido' : 'Adicionar Novo Assistido'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Insira as informações de identificação, contato dos responsáveis e observações lúdicas/clínicas para acompanhamento do Instituto.
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
                    Nome Completo da Criança <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-cliente-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Enzo Gabriel Martins (Mãe: Mileide)"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telefone dos Pais / Responsáveis
                  </label>
                  <input
                    id="input-cliente-telefone"
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Ex: (44) 99999-9999"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Histórico / Observações de Suporte e TEA
                  </label>
                  <textarea
                    id="textarea-cliente-observacoes"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Nível de suporte, preferências lúdicas, restrições alimentares ou sensoriais, histórico escolar..."
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
                    {isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}
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
