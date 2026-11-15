/** Placeholders com o mesmo layout do dashboard, enquanto os dados chegam (AC-507). */
export function DashboardSkeleton() {
  return (
    <div className="grid" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid--3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card stat">
            <span className="skeleton skeleton--text" />
            <span className="skeleton skeleton--value" />
          </div>
        ))}
      </div>
      <div className="grid grid--dashboard">
        <div className="card">
          <span className="skeleton skeleton--text" />
          <span className="skeleton skeleton--chart" />
        </div>
        <div className="card">
          <span className="skeleton skeleton--text" />
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton skeleton--bar" />
          ))}
        </div>
      </div>
    </div>
  );
}
