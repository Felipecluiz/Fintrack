/**
 * "Extrato" fictício do mês atual mostrado no hero. Os valores são os do último
 * mês da conta demo (seed), então batem com o que o visitante vê ao testá-la.
 */
export interface HeroEntry {
  /** Dia do mês em que o lançamento acontece (ordem de entrada no extrato). */
  day: number;
  description: string;
  category: string;
  /** Positivo = receita; negativo = despesa. Em centavos. */
  amountCents: number;
}

export const DAYS_IN_HERO_MONTH = 30;

export const HERO_ENTRIES: HeroEntry[] = [
  { day: 5, description: 'Depósito do salário', category: 'Salário', amountCents: 650_000 },
  { day: 8, description: 'Supermercado', category: 'Mercado', amountCents: -99_500 },
  { day: 10, description: 'Aluguel', category: 'Moradia', amountCents: -180_000 },
  { day: 12, description: 'Combustível', category: 'Transporte', amountCents: -42_000 },
  { day: 22, description: 'Feira e padaria', category: 'Mercado', amountCents: -27_000 },
  { day: 26, description: 'Cinema e jantar', category: 'Lazer', amountCents: -24_000 },
];

export const HERO_MONTH = {
  incomeCents: 650_000,
  expenseCents: 372_500,
  /** Maior categoria de despesa do mês. */
  topCategory: { name: 'Moradia', cents: 180_000 },
};

export const heroBalanceCents = HERO_MONTH.incomeCents - HERO_MONTH.expenseCents;
export const heroSavingsRate = Math.round((heroBalanceCents / HERO_MONTH.incomeCents) * 100);
export const heroTopCategoryShare = Math.round(
  (HERO_MONTH.topCategory.cents / HERO_MONTH.expenseCents) * 100,
);

/* ---------- A rolagem como o tempo passando ---------- */

/** Fração da rolagem dedicada a traçar o histórico (linha do fundo). */
const HISTORY_SHARE = 0.55;
/** A partir de onde o mês atual começa a acontecer no extrato. */
const MONTH_START = 0.2;
const MONTH_END = 0.94;

export interface HeroTimeline {
  /** 0–1: quanto da linha de saldo do fundo já foi traçado. */
  history: number;
  /** Dia do mês já alcançado (0 = mês ainda não começou). */
  day: number;
  visibleEntries: number;
  balanceCents: number;
  monthClosed: boolean;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Converte o progresso da rolagem (0–1) no "estado do mês" mostrado no hero. */
export function heroTimeline(progress: number): HeroTimeline {
  const p = clamp01(progress);
  const day = clamp01((p - MONTH_START) / (MONTH_END - MONTH_START)) * DAYS_IN_HERO_MONTH;
  const visible = HERO_ENTRIES.filter((entry) => entry.day <= day);

  return {
    history: clamp01(p / HISTORY_SHARE),
    day,
    visibleEntries: visible.length,
    balanceCents: visible.reduce((sum, entry) => sum + entry.amountCents, 0),
    monthClosed: p >= MONTH_END + 0.03,
  };
}
