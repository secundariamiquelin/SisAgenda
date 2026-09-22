import React, { useState } from 'react';
import { Servico } from '../types';
import { X, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Paginacao from './ui/Paginacao';
import AcoesLinha from './ui/AcoesLinha';
import EstadoVazio from './ui/EstadoVazio';
import { formatarContribuicao, plural } from './ui/formatos';

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
  // Depois de uma exclusão a página atual pode deixar de existir
  const paginaAtual = Math.min(currentPage, totalPages);
  const paginatedServicos = filteredServicos.slice(
    (paginaAtual - 1) * itemsPerPage,
    paginaAtual * itemsPerPage
  );
  const quantidade = plural(filteredServicos.length, 'modalidade oferecida', 'modalidades oferecidas');

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

  return (
    <section id="servicos-view-root" className="pt-11">
      <CabecalhoPagina
        titulo="As terapias"
        descricao="O que o instituto oferece, quanto dura cada sessão e o valor simbólico cobrado."
        acao={
          <button id="btn-cadastrar-servico" type="button" onClick={() => openRegisterModal()} className="btn btn-primary">
            Cadastrar terapia
          </button>
        }
      />

      <div className="mt-[34px] flex justify-end border-b border-divider pb-3">
        <input
          id="input-pesquisar-servicos"
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset page on filter
          }}
          aria-label="Buscar terapia"
          placeholder="Buscar terapia…"
          className="input sm:w-auto sm:min-w-[320px]"
        />
      </div>

      {carregando ? (
        <p role="status" className="py-[70px] text-[15px] text-neutral-700">Carregando as terapias…</p>
      ) : filteredServicos.length === 0 ? (
        search ? (
          <EstadoVazio titulo="Nada encontrado" texto="Nenhuma terapia corresponde à busca. Tente outro termo." />
        ) : (
          <EstadoVazio
            titulo="Nenhuma terapia cadastrada"
            texto="Cadastre as modalidades que o instituto oferece para poder marcar as sessões."
          />
        )
      ) : (
        <>
          <div className="mt-2 overflow-x-auto">
            <table className="table min-w-[520px]">
              <thead>
                <tr>
                  <th>Modalidade</th>
                  <th>Duração</th>
                  <th>Contribuição</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServicos.map((servico) => (
                  <tr key={servico.id} className="hover:bg-neutral-100">
                    <td className="text-[17px] font-semibold">{servico.nome}</td>
                    <td>{servico.duracao_minutos} minutos</td>
                    <td>{formatarContribuicao(servico.preco)}</td>
                    <td>
                      <AcoesLinha
                        descricao={servico.nome}
                        idEditar={`btn-editar-servico-${servico.id}`}
                        idExcluir={`btn-excluir-servico-${servico.id}`}
                        onEditar={() => openRegisterModal(servico)}
                        onExcluir={() => onExcluir(servico.id)}
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
    </section>
  );
}
