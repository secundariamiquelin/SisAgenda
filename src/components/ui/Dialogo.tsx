import React from 'react';
import { usePainelModal } from './usePainelModal';

interface DialogoProps {
  aberto: boolean;
  onFechar: () => void;
  /** id do título, para o leitor de tela anunciar o diálogo. */
  tituloId: string;
  /** Classe de largura máxima do painel, ex.: 'max-w-[560px]'. */
  largura: string;
  /** Formulários ficam em z-70; a confirmação de exclusão vem por cima, em z-80. */
  camada?: 'z-70' | 'z-80';
  id?: string;
  children: React.ReactNode;
}

/** Diálogo do Broadsheet: fundo papel, raio pequeno e a única sombra do sistema. */
export default function Dialogo({ aberto, onFechar, tituloId, largura, camada = 'z-70', id, children }: DialogoProps) {
  const painelRef = usePainelModal<HTMLDivElement>(aberto, onFechar);

  if (!aberto) return null;

  return (
    <div id={id} className={`dialog-backdrop fixed inset-0 flex items-center justify-center p-6 ${camada}`}>
      <div className="absolute inset-0" onClick={onFechar} aria-hidden="true" />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`dialog relative max-h-[88vh] w-full overflow-auto bg-bg p-[34px] outline-none ${largura}`}
      >
        {children}
      </div>
    </div>
  );
}
