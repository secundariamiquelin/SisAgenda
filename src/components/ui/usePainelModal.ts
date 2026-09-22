import { useEffect, useRef } from 'react';

/**
 * Teclado em painéis modais (diálogos e índice lateral): ao abrir, o foco vai para o
 * painel; Esc fecha; ao fechar, o foco volta para o elemento que abriu o painel.
 * Devolve a ref a ser ligada ao painel, que precisa de tabIndex={-1}.
 */
export function usePainelModal<T extends HTMLElement>(aberto: boolean, onFechar: () => void) {
  const painelRef = useRef<T>(null);
  const fecharRef = useRef(onFechar);

  // Guarda sempre o onFechar mais recente sem reabrir o efeito de foco a cada render.
  useEffect(() => {
    fecharRef.current = onFechar;
  });

  useEffect(() => {
    if (!aberto) return;

    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    painelRef.current?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fecharRef.current();
    };
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      anterior?.focus();
    };
  }, [aberto]);

  return painelRef;
}
