/**
 * Fundo da landing: uma folha de livro-caixa (pautas, margem dupla e colunas
 * de débito/crédito) com a linha de saldo dos últimos meses. Decorativo:
 * `aria-hidden`. As cores vêm de tokens CSS, então seguem o tema.
 *
 * `progress` (0–1) diz quanto da linha já foi traçado — a rolagem da página.
 */
const WIDTH = 1440;
const HEIGHT = 760;
const RULE_GAP = 38;

/** Saldo acumulado fictício, mês a mês: sobe com tropeços, como na vida real. */
const BALANCE_POINTS: Array<[number, number]> = [
  [140, 716],
  [300, 694],
  [440, 708],
  [600, 676],
  [760, 650],
  [910, 540],
  [1060, 470],
  [1210, 430],
  [1360, 250],
];

const balancePath = BALANCE_POINTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
const areaPath = `${balancePath} L1360 ${HEIGHT} L140 ${HEIGHT} Z`;
const rules = Array.from({ length: Math.ceil(HEIGHT / RULE_GAP) }, (_, i) => (i + 1) * RULE_GAP);

export function LedgerBackdrop({ progress = 1 }: { progress?: number }) {
  const last = BALANCE_POINTS[BALANCE_POINTS.length - 1] ?? [0, 0];
  const reached = (index: number) => progress >= index / (BALANCE_POINTS.length - 1) - 0.001;

  return (
    <svg
      className="ledger-backdrop"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ledger-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Pautas do livro */}
      <g className="ledger-backdrop__rules">
        {rules.map((y) => (
          <line key={y} x1="0" x2={WIDTH} y1={y} y2={y} />
        ))}
      </g>

      {/* Margem dupla à esquerda e colunas de débito/crédito à direita */}
      <g className="ledger-backdrop__columns">
        <line x1="96" x2="96" y1="0" y2={HEIGHT} />
        <line x1="102" x2="102" y1="0" y2={HEIGHT} />
        <line x1="1180" x2="1180" y1="0" y2={HEIGHT} />
        <line x1="1310" x2="1310" y1="0" y2={HEIGHT} />
      </g>
      <g className="ledger-backdrop__headers">
        <text x="1196" y={RULE_GAP - 12}>Débito</text>
        <text x="1326" y={RULE_GAP - 12}>Crédito</text>
      </g>

      {/* Linha de saldo */}
      <path
        d={areaPath}
        fill="url(#ledger-area)"
        className="ledger-backdrop__area"
        style={{ opacity: progress }}
      />
      <path
        d={balancePath}
        pathLength={1}
        className="ledger-backdrop__line"
        style={{ strokeDashoffset: 1 - progress }}
      />
      {BALANCE_POINTS.slice(0, -1).map(([x, y], index) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="4"
          className="ledger-backdrop__point"
          data-reached={reached(index)}
        />
      ))}
      <g className="ledger-backdrop__now" data-reached={reached(BALANCE_POINTS.length - 1)}>
        <circle cx={last[0]} cy={last[1]} r="14" className="ledger-backdrop__halo" />
        <circle cx={last[0]} cy={last[1]} r="6" className="ledger-backdrop__end" />
      </g>
    </svg>
  );
}
