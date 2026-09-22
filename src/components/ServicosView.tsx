import React, { useState } from 'react';
import { Servico } from '../types';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Campo from './ui/Campo';
import Dialogo from './ui/Dialogo';
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
  const [duracao, setDuracao] = useState(50);
  const [preco, setPreco] = useState('0');

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
      setDuracao(50);
      setPreco('0');
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
      setValidationError('Dê um nome para a terapia.');
      return;
    }

    const duracaoNum = parseInt(duracao.toString());
    if (isNaN(duracaoNum) || duracaoNum <= 0) {
      setValidationError('A duração precisa ser um número inteiro maior que zero.');
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum < 0) {
      setValidationError('A contribuição precisa ser um valor igual ou maior que zero.');
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
      setValidationError(err.message || 'Não deu para salvar a terapia.');
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

      <Dialogo
        id="servico-modal"
        aberto={modalOpen}
        onFechar={handleCloseModal}
        tituloId="servico-modal-titulo"
        largura="max-w-[480px]"
      >
        <h3 id="servico-modal-titulo" className="dialog-title mb-1.5 text-[28px]">
          {editingServico ? 'Ajustar terapia' : 'Nova terapia'}
        </h3>
        <p className="mb-6 text-[14px] text-neutral-700">
          Modalidade de atendimento, tempo médio de sessão e a contribuição sugerida à família.
        </p>

        <form onSubmit={handleSubmit} noValidate className="contents">
          {validationError && (
            <div role="alert" className="mb-4 text-[13px] text-accent-2-700">
              {validationError}
            </div>
          )}

          <div className="flex flex-col gap-[18px]">
            <Campo rotulo="Nome da terapia">
              <input
                id="input-servico-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Terapia fonoaudiológica"
                className="input"
              />
            </Campo>

            <div className="grid gap-[18px] sm:grid-cols-2">
              <Campo rotulo="Duração (min)">
                <input
                  id="input-servico-duracao"
                  type="number"
                  min={1}
                  value={duracao}
                  onChange={(e) => setDuracao(parseInt(e.target.value) || 0)}
                  className="input"
                />
              </Campo>
              <Campo rotulo="Contribuição (R$)">
                <input
                  id="input-servico-preco"
                  type="text"
                  inputMode="decimal"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="input"
                />
              </Campo>
            </div>
          </div>

          <div className="dialog-actions mt-7 gap-3.5">
            <button id="btn-modal-cancelar" type="button" onClick={handleCloseModal} className="btn btn-ghost">
              Cancelar
            </button>
            <button id="btn-modal-salvar" type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando…' : 'Salvar terapia'}
            </button>
          </div>
        </form>
      </Dialogo>
    </section>
  );
}
