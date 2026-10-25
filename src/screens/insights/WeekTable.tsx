import { weekRows } from '../../domain/charts';
import type { Model } from '../../domain/model';
import { hmm } from '../../domain/time';

/** The last 7 dygn as h:mm, newest first. */
export function WeekTable({ m }: { m: Model }) {
  const rows = weekRows(m);
  if (!rows.length) return null;
  return (
    <section className="card week-card">
      <div className="chart-head week-head">
        <h3 className="chart-title">Veckotabell</h3>
        <span className="chart-question">Senaste 7 dygnen · timmar:minuter</span>
      </div>
      <table className="table week-table">
        <thead>
          <tr>
            <th>Dygn</th>
            <th>Sömn</th>
            <th>Natt</th>
            <th>Längst</th>
            <th>Lurar</th>
            <th>{m.words.tableHead}</th>
            {m.useBottle && <th>ml</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.D}>
              <td>{r.label}</td>
              <td>{hmm(r.total)}</td>
              <td>{hmm(r.night)}</td>
              <td>{hmm(r.longest)}</td>
              <td>{r.naps}</td>
              <td>{r.sessions}</td>
              {m.useBottle && <td>{r.ml}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
