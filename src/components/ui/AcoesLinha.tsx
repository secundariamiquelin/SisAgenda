import React from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';

interface AcoesLinhaProps {
  /** Complemento do rótulo acessível: "Editar {descricao}", "Excluir {descricao}". */
  descricao: string;
  idEditar: string;
  idExcluir: string;
  onEditar: () => void;
  onExcluir: () => void;
}

/** Ícones de editar (hover ciano) e excluir (hover magenta) no fim de cada linha. */
export default function AcoesLinha({ descricao, idEditar, idExcluir, onEditar, onExcluir }: AcoesLinhaProps) {
  return (
    <div className="flex justify-end gap-2.5">
      <button
        id={idEditar}
        type="button"
        onClick={onEditar}
        title="Editar"
        aria-label={`Editar ${descricao}`}
        className="cursor-pointer px-1.5 py-px text-neutral-700 hover:text-accent-700"
      >
        <PencilSimple aria-hidden="true" />
      </button>
      <button
        id={idExcluir}
        type="button"
        onClick={onExcluir}
        title="Excluir"
        aria-label={`Excluir ${descricao}`}
        className="cursor-pointer px-1.5 py-px text-neutral-700 hover:text-accent-2-700"
      >
        <Trash aria-hidden="true" />
      </button>
    </div>
  );
}
