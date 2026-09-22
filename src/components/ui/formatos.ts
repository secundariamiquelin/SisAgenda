// Formatação de datas e valores exibidos na interface.

/** Data de referência do sistema: a mesma base dos dados de exemplo em services/db.ts. */
export const HOJE = '2026-06-12';

/** Converte AAAA-MM-DD em Date ao meio-dia local, longe de viradas de fuso. */
const comoData = (dataIso: string) => new Date(`${dataIso}T12:00:00`);

/** "sexta-feira, 12 de junho de 2026" */
export const dataPorExtenso = (dataIso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(comoData(dataIso));

/** "12/06/2026" */
export const dataCompleta = (dataIso: string) => dataIso.split('-').reverse().join('/');
