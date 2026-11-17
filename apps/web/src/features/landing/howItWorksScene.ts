import { HERO_ENTRIES, type HeroEntry } from './heroData';

export const STEPS = [
  { title: 'Crie sua conta', text: 'Nome, e-mail e senha. Leva menos de um minuto.' },
  { title: 'Monte suas categorias', text: 'Salário, Moradia, Mercado… do jeito que você pensa.' },
  { title: 'Lance e acompanhe', text: 'Cada lançamento atualiza o saldo e o dashboard na hora.' },
] as const;

/** Dados da pessoa fictícia que aparece preenchendo o cadastro. */
export const EXAMPLE_SIGNUP = { name: 'Ana Souza', email: 'ana@exemplo.com', password: '••••••••' };

export const EXAMPLE_CATEGORIES = [
  { name: 'Salário', type: 'income' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Mercado', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Lazer', type: 'expense' },
] as const;

/** Os três primeiros lançamentos do mês do hero: a história continua a mesma. */
export const EXAMPLE_ENTRIES: readonly HeroEntry[] = HERO_ENTRIES.slice(0, 3);

export interface HowItWorksScene {
  /** Passo em foco (0, 1 ou 2). */
  step: number;
  /** Quantos caracteres de cada campo do cadastro já foram "digitados". */
  typed: { name: number; email: number; password: number };
  visibleCategories: number;
  visibleEntries: number;
  balanceCents: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Dentro de um passo, a cena termina antes do fim para "assentar" um pouco. */
const SETTLE = 0.8;

/** Converte o progresso da rolagem (0–1) no que a cena de "Como funciona" mostra. */
export function howItWorksScene(progress: number): HowItWorksScene {
  const p = clamp01(progress) * STEPS.length;
  const step = Math.min(STEPS.length - 1, Math.floor(p));
  const local = (index: number) => clamp01((p - index) / SETTLE);

  const signup = local(0);
  const typed = {
    name: Math.round(clamp01(signup * 3) * EXAMPLE_SIGNUP.name.length),
    email: Math.round(clamp01(signup * 3 - 1) * EXAMPLE_SIGNUP.email.length),
    password: Math.round(clamp01(signup * 3 - 2) * EXAMPLE_SIGNUP.password.length),
  };
  const visibleCategories = Math.round(local(1) * EXAMPLE_CATEGORIES.length);
  const visibleEntries = Math.round(local(2) * EXAMPLE_ENTRIES.length);
  const balanceCents = EXAMPLE_ENTRIES.slice(0, visibleEntries).reduce(
    (sum, entry) => sum + entry.amountCents,
    0,
  );

  return { step, typed, visibleCategories, visibleEntries, balanceCents };
}
