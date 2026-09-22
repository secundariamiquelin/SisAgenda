import React from 'react';

interface CabecalhoPaginaProps {
  titulo: string;
  descricao: string;
  acao: React.ReactNode;
}

/** Abertura das telas de lista: título de 44px, lead curto e a ação principal à direita. */
export default function CabecalhoPagina({ titulo, descricao, acao }: CabecalhoPaginaProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-[56ch]">
        <h1 className="mb-2 text-[44px]">{titulo}</h1>
        <p className="m-0 text-[17px] text-neutral-800">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}
