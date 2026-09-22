import React, { useState } from 'react';
import { Cliente } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Paginacao from './ui/Paginacao';
import AcoesLinha from './ui/AcoesLinha';
import EstadoVazio from './ui/EstadoVazio';
import { plural } from './ui/formatos';

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
  // Depois de uma exclusão a página atual pode deixar de existir
  const paginaAtual = Math.min(currentPage, totalPages);
  const paginatedClientes = filteredClientes.slice(
    (paginaAtual - 1) * itemsPerPage,
    paginaAtual * itemsPerPage
  );
  const quantidade = plural(filteredClientes.length, 'criança em acompanhamento', 'crianças em acompanhamento');

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
    <section id="clientes-view-root" className="pt-11">
      <CabecalhoPagina
        titulo="As crianças"
        descricao="Quem o instituto acompanha, quem cuida em casa e o que cada uma precisa."
        acao={
          <button id="btn-cadastrar-cliente" type="button" onClick={() => openRegisterModal()} className="btn btn-primary">
            Cadastrar criança
          </button>
        }
      />

      <div className="mt-[34px] flex justify-end border-b border-divider pb-3">
        <input
          id="input-pesquisar-clientes"
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset page on filter
          }}
          aria-label="Buscar criança"
          placeholder="Buscar por nome, telefone, histórico…"
          className="input sm:w-auto sm:min-w-[320px]"
        />
      </div>

      {carregando ? (
        <p role="status" className="py-[70px] text-[15px] text-neutral-700">Carregando as crianças…</p>
      ) : filteredClientes.length === 0 ? (
        search ? (
          <EstadoVazio
            titulo="Nada encontrado"
            texto="Nenhuma criança corresponde à busca. Tente outro nome, telefone ou trecho do histórico."
          />
        ) : (
          <EstadoVazio
            titulo="Nenhuma criança cadastrada"
            texto="Cadastre a primeira criança para começar a marcar as sessões dela."
          />
        )
      ) : (
        <>
          <div className="mt-2 overflow-x-auto">
            <table className="table min-w-[640px]">
              <thead>
                <tr>
                  <th>Criança</th>
                  <th>Responsável e contato</th>
                  <th>Histórico e nível de suporte</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-neutral-100">
                    <td className="text-[17px] font-semibold">{cliente.nome}</td>
                    <td>{cliente.telefone || '—'}</td>
                    <td className="max-w-[360px] text-[13px] text-neutral-700">
                      {cliente.observacoes || 'Sem anotações ainda'}
                    </td>
                    <td>
                      <AcoesLinha
                        descricao={cliente.nome}
                        idEditar={`btn-editar-cliente-${cliente.id}`}
                        idExcluir={`btn-excluir-cliente-${cliente.id}`}
                        onEditar={() => openRegisterModal(cliente)}
                        onExcluir={() => onExcluir(cliente.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            resumo={totalPages > 1 ? `Página ${paginaAtual} de ${totalPages} · ${quantidade}` : quantidade}
            pagina={paginaAtual}
            totalPaginas={totalPages}
            onMudarPagina={setCurrentPage}
          />
        </>
      )}

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
    </section>
  );
}
