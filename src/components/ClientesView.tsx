import React, { useState } from 'react';
import { Cliente } from '../types';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Campo from './ui/Campo';
import Dialogo from './ui/Dialogo';
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
      setValidationError('O nome da criança é obrigatório.');
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
      setValidationError(err.message || 'Não deu para salvar o cadastro.');
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

      <Dialogo
        id="cliente-modal"
        aberto={modalOpen}
        onFechar={handleCloseModal}
        tituloId="cliente-modal-titulo"
        largura="max-w-[520px]"
      >
        <h3 id="cliente-modal-titulo" className="dialog-title mb-1.5 text-[28px]">
          {editingCliente ? 'Ajustar cadastro' : 'Nova criança'}
        </h3>
        <p className="mb-6 text-[14px] text-neutral-700">
          Guarde o nome como a família chama, o contato de quem cuida e o que ajuda a criança a se sentir bem aqui.
        </p>

        <form onSubmit={handleSubmit} noValidate className="contents">
          {validationError && (
            <div role="alert" className="mb-4 text-[13px] text-accent-2-700">
              {validationError}
            </div>
          )}

          <div className="flex flex-col gap-[18px]">
            <Campo rotulo="Nome da criança">
              <input
                id="input-cliente-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Enzo Gabriel Martins"
                className="input"
              />
            </Campo>

            <Campo rotulo="Telefone do responsável">
              <input
                id="input-cliente-telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(44) 99999-9999"
                className="input"
              />
            </Campo>

            <Campo rotulo="Histórico e preferências">
              <textarea
                id="textarea-cliente-observacoes"
                rows={4}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Nível de suporte, o que acalma, o que incomoda, rotina escolar…"
                className="input"
              />
            </Campo>
          </div>

          <div className="dialog-actions mt-7 gap-3.5">
            <button id="btn-modal-cancelar" type="button" onClick={handleCloseModal} className="btn btn-ghost">
              Cancelar
            </button>
            <button id="btn-modal-salvar" type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Salvando…' : 'Salvar cadastro'}
            </button>
          </div>
        </form>
      </Dialogo>
    </section>
  );
}
