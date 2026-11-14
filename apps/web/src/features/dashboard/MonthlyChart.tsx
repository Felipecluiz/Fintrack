import type { MonthlyTotalDTO } from '@fintrack/contracts';
import { useState } from 'react';
import { formatMonth } from '../../shared/lib/dates';
import { formatCents, formatCentsCompact } from '../../shared/lib/money';
import { useElementWidth } from '../../shared/ui/useElementWidth';
import { niceCeiling, topRoundedBar } from './chartMath';

const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 64 };
const BAR_GAP = 2;
const MAX_BAR_WIDTH = 28;
const TICK_COUNT = 4;

const SERIES = [
  { key: 'incomeCents', label: 'Receitas', className: 'series--income' },
  { key: 'expenseCents', label: 'Despesas', className: 'series--expense' },
] as const;

/**
 * Barras agrupadas receita × despesa por mês (AC-308): uma única escala Y,
 * legenda sempre visível, tooltip por mês e alternativa em tabela.
 */
export function MonthlyChart({ data }: { data: MonthlyTotalDTO[] }) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const maxValue = niceCeiling(Math.max(...data.flatMap((d) => [d.incomeCents, d.expenseCents])));
  const yOf = (value: number) => plotHeight - (value / maxValue) * plotHeight;

  const bandWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(MAX_BAR_WIDTH, (bandWidth * 0.7 - BAR_GAP) / 2);
  const groupWidth = barWidth * 2 + BAR_GAP;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (maxValue / TICK_COUNT) * i);

  const hovered = hoveredIndex === null ? null : data[hoveredIndex];

  return (
    <section className="card">
      <header className="card__header">
        <h2 className="card__title">Receitas × despesas por mês</h2>
        <div className="legend" aria-label="Legenda">
          {SERIES.map((s) => (
            <span key={s.key} className="legend__item">
              <span className={`swatch ${s.className}`} aria-hidden />
              {s.label}
            </span>
          ))}
          <button
            className="button button--ghost button--small"
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? 'Ver gráfico' : 'Ver tabela'}
          </button>
        </div>
      </header>

      {/* O container fica sempre montado para o ResizeObserver continuar medindo. */}
      <div ref={containerRef} className="chart" onMouseLeave={() => setHoveredIndex(null)}>
        {showTable ? (
          <MonthlyTable data={data} />
        ) : (
          <>
            <svg width={width} height={HEIGHT} role="img" aria-label="Gráfico de barras mensal">
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {ticks.map((tick) => (
                  <g key={tick} transform={`translate(0,${yOf(tick)})`}>
                    <line
                      x2={plotWidth}
                      className={tick === 0 ? 'chart__baseline' : 'chart__grid'}
                    />
                    <text x={-8} dy="0.32em" textAnchor="end" className="chart__tick">
                      {formatCentsCompact(tick)}
                    </text>
                  </g>
                ))}

                {data.map((month, index) => {
                  const groupX = index * bandWidth + (bandWidth - groupWidth) / 2;
                  return (
                    <g key={month.month}>
                      {hoveredIndex === index && (
                        <rect
                          x={index * bandWidth}
                          width={bandWidth}
                          height={plotHeight}
                          className="chart__hover-band"
                        />
                      )}
                      {SERIES.map((series, s) => {
                        const value = month[series.key];
                        return (
                          <path
                            key={series.key}
                            className={series.className}
                            d={topRoundedBar(
                              groupX + s * (barWidth + BAR_GAP),
                              yOf(value),
                              barWidth,
                              plotHeight - yOf(value),
                            )}
                          />
                        );
                      })}
                      <text
                        x={index * bandWidth + bandWidth / 2}
                        y={plotHeight + 18}
                        textAnchor="middle"
                        className="chart__tick"
                      >
                        {formatMonth(month.month)}
                      </text>
                      {/* Área de hover maior que as barras */}
                      <rect
                        x={index * bandWidth}
                        width={bandWidth}
                        height={plotHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(index)}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {hovered && hoveredIndex !== null && (
              <div
                className="tooltip"
                style={{
                  left: MARGIN.left + hoveredIndex * bandWidth + bandWidth / 2,
                  top: MARGIN.top,
                }}
                role="status"
              >
                <strong>{formatMonth(hovered.month)}</strong>
                {SERIES.map((s) => (
                  <span key={s.key} className="tooltip__row">
                    <span className={`swatch ${s.className}`} aria-hidden />
                    {s.label}
                    <span className="tooltip__value">{formatCents(hovered[s.key])}</span>
                  </span>
                ))}
                <span className="tooltip__row tooltip__row--total">
                  Saldo
                  <span className="tooltip__value">
                    {formatCents(hovered.incomeCents - hovered.expenseCents)}
                  </span>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function MonthlyTable({ data }: { data: MonthlyTotalDTO[] }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col" className="numeric">
              Receitas
            </th>
            <th scope="col" className="numeric">
              Despesas
            </th>
            <th scope="col" className="numeric">
              Saldo
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.month}>
              <td>{formatMonth(m.month)}</td>
              <td className="numeric">{formatCents(m.incomeCents)}</td>
              <td className="numeric">{formatCents(m.expenseCents)}</td>
              <td className="numeric">{formatCents(m.incomeCents - m.expenseCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
