import { useEffect, useState } from 'react';
import { hojeIso } from './formatos';

/** Data de hoje (AAAA-MM-DD) que se atualiza sozinha na virada da meia-noite. */
export function useHoje() {
  const [hoje, setHoje] = useState(hojeIso);

  useEffect(() => {
    let timer: number;
    const agendarProximaVirada = () => {
      const agora = new Date();
      const proximaMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
      // Um segundo de folga para o relógio já estar no dia seguinte quando o timer disparar
      timer = window.setTimeout(() => {
        setHoje(hojeIso());
        agendarProximaVirada();
      }, proximaMeiaNoite.getTime() - agora.getTime() + 1000);
    };
    agendarProximaVirada();
    return () => window.clearTimeout(timer);
  }, []);

  return hoje;
}
