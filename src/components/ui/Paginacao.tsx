import React from 'react';

interface PaginacaoProps {
  resumo: string;
  pagina: number;
  totalPaginas: number;
  onMudarPagina: (pagina: number) => void;
}

/** Rodapé das tabelas: resumo à esquerda; Anterior/Próxima só quando há mais de uma página. */
export default function Paginacao({ resumo, pagina, totalPaginas, onMudarPagina }: PaginacaoProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 pt-[18px] text-[13px] text-neutral-700">
      <span>{resumo}</span>
      {totalPaginas > 1 && (
        <div className="flex gap-2.5">
          <button
            id="pagination-prev"
            type="button"
            disabled={pagina === 1}
            onClick={() => onMudarPagina(pagina - 1)}
            className="btn btn-ghost text-[13px]"
          >
            Anterior
          </button>
          <button
            id="pagination-next"
            type="button"
            disabled={pagina === totalPaginas}
            onClick={() => onMudarPagina(pagina + 1)}
            className="btn btn-ghost text-[13px]"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
