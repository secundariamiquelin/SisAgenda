import React from 'react';

interface EstadoVazioProps {
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
}

/** Lista sem resultados: título de 24px e orientação curta, sem caixa nem ícone. */
export default function EstadoVazio({ titulo, texto, acao }: EstadoVazioProps) {
  return (
    <div className="max-w-[46ch] py-[70px]">
      <div className="text-[24px] font-semibold">{titulo}</div>
      <p className="mt-2 text-[15px] text-neutral-700">{texto}</p>
      {acao}
    </div>
  );
}
