import React from 'react';

interface CampoProps {
  rotulo: string;
  children: React.ReactNode;
}

/** Rótulo pequeno em caixa-alta sobre o controle, padrão dos formulários do handoff. */
export default function Campo({ rotulo, children }: CampoProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">{rotulo}</span>
      {children}
    </label>
  );
}
