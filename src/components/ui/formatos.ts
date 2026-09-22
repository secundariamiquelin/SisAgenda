// Formatação de datas, valores e situações exibidos na interface.
import { AgendamentoStatus } from '../../types';

/** Data de referência do sistema: a mesma base dos dados de exemplo em services/db.ts. */
export const HOJE = '2026-06-12';

/** Converte AAAA-MM-DD em Date ao meio-dia local, longe de viradas de fuso. */
const comoData = (dataIso: string) => new Date(`${dataIso}T12:00:00`);

const somarDias = (dataIso: string, dias: number) => {
  const data = comoData(dataIso);
  data.setDate(data.getDate() + dias);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
};

const AMANHA = somarDias(HOJE, 1);
const ONTEM = somarDias(HOJE, -1);

/** "Hoje", "Amanhã", "Ontem" ou "DD/MM". */
export function rotuloDia(dataIso: string) {
  if (dataIso === HOJE) return 'Hoje';
  if (dataIso === AMANHA) return 'Amanhã';
  if (dataIso === ONTEM) return 'Ontem';
  const [, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}`;
}

/**
 * Cor de cada situação em toda a aplicação. "Concluído" usa neutral-700, não 600:
 * a regra de contraste do handoff proíbe neutral-600 em texto menor que 18px.
 * Classes completas para o Tailwind encontrá-las no código.
 */
export const COR_SITUACAO: Record<AgendamentoStatus, { texto: string; marca: string }> = {
  Agendado: { texto: 'text-neutral-800', marca: 'bg-neutral-800' },
  Confirmado: { texto: 'text-accent-700', marca: 'bg-accent-700' },
  Concluído: { texto: 'text-neutral-700', marca: 'bg-neutral-700' },
  Cancelado: { texto: 'text-accent-2-700', marca: 'bg-accent-2-700' }
};

/** "1 sessão", "3 sessões". */
export const plural = (quantidade: number, singular: string, varias: string) =>
  `${quantidade} ${quantidade === 1 ? singular : varias}`;

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
