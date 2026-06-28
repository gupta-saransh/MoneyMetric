import { useEffect, useState } from 'react';
import './dashboard.css';
import type { DashboardData } from './types';
import { inr, inr2, fmtDate, monthLabel, monthShort, pct } from './format';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?month=${month}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as DashboardData;
      })
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(String(e?.message ?? e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [month]);

  const isCurrent = month === currentMonth();
  const empty = data && data.count === 0;
  const trendMax = data ? Math.max(1, ...data.monthlyTrend.map((t) => t.total)) : 1;
  const catMax = data && data.byCategory.length ? data.byCategory[0].total : 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">₹</span> MoneyMetric
        </div>
        <div className="monthnav">
          <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            ‹
          </button>
          <span className="monthlabel">{monthLabel(month)}</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={isCurrent}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </header>

      {loading && <div className="state">Loading…</div>}
      {error && <div className="state error">Couldn’t load data: {error}</div>}

      {data && !loading && !error && (
        <main className="content">
          {empty ? (
            <div className="state">No expenses logged in {monthLabel(month)}.</div>
          ) : (
            <>
              {/* Summary cards */}
              <section className="cards">
                <div className="card">
                  <div className="card-label">Total spent</div>
                  <div className="card-value">{inr(data.total)}</div>
                  <div className="card-sub">{data.count} transactions</div>
                </div>
                <div className="card">
                  <div className="card-label">Essential</div>
                  <div className="card-value essential">{inr(data.essential)}</div>
                  <div className="card-sub">{pct(data.essential, data.total)}% of spend</div>
                </div>
                <div className="card">
                  <div className="card-label">Discretionary</div>
                  <div className="card-value discretionary">{inr(data.discretionary)}</div>
                  <div className="card-sub">{pct(data.discretionary, data.total)}% of spend</div>
                </div>
              </section>

              {/* Essential vs discretionary split bar */}
              <section className="panel">
                <h2>Essential vs discretionary</h2>
                <div className="splitbar">
                  <div
                    className="split essential"
                    style={{ width: `${pct(data.essential, data.total)}%` }}
                    title={`Essential ${inr(data.essential)}`}
                  />
                  <div
                    className="split discretionary"
                    style={{ width: `${pct(data.discretionary, data.total)}%` }}
                    title={`Discretionary ${inr(data.discretionary)}`}
                  />
                </div>
                <div className="legend">
                  <span>
                    <i className="dot essential" /> Essential {pct(data.essential, data.total)}%
                  </span>
                  <span>
                    <i className="dot discretionary" /> Discretionary{' '}
                    {pct(data.discretionary, data.total)}%
                  </span>
                </div>
              </section>

              <div className="grid2">
                {/* Category breakdown */}
                <section className="panel">
                  <h2>By category</h2>
                  <div className="bars">
                    {data.byCategory.map((c) => (
                      <div className="barrow" key={c.category}>
                        <div className="barhead">
                          <span>
                            <i className={`dot ${c.is_discretionary ? 'discretionary' : 'essential'}`} />
                            {c.category}
                          </span>
                          <span className="amt">{inr(c.total)}</span>
                        </div>
                        <div className="track">
                          <div
                            className={`fill ${c.is_discretionary ? 'discretionary' : 'essential'}`}
                            style={{ width: `${pct(c.total, catMax)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* By account */}
                <section className="panel">
                  <h2>By account</h2>
                  <div className="bars">
                    {data.byAccount.map((a) => (
                      <div className="barrow" key={a.account}>
                        <div className="barhead">
                          <span>{a.account}</span>
                          <span className="amt">{inr(a.total)}</span>
                        </div>
                        <div className="track">
                          <div
                            className="fill accent"
                            style={{ width: `${pct(a.total, data.byAccount[0].total)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Monthly trend */}
              <section className="panel">
                <h2>Last 6 months</h2>
                <div className="trend">
                  {data.monthlyTrend.map((t) => (
                    <div className="trendcol" key={t.month}>
                      <div className="trendbar-wrap">
                        <div
                          className={`trendbar ${t.month === month ? 'current' : ''}`}
                          style={{ height: `${Math.max(4, (t.total / trendMax) * 100)}%` }}
                          title={inr(t.total)}
                        />
                      </div>
                      <div className="trendval">{inr(t.total)}</div>
                      <div className="trendmonth">{monthShort(t.month)}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent transactions */}
              <section className="panel">
                <h2>Recent</h2>
                <div className="txlist">
                  {data.recent.map((t) => (
                    <div className="tx" key={t.id}>
                      <div className="tx-date">{fmtDate(t.occurred_at)}</div>
                      <div className="tx-main">
                        <span className="tx-cat">
                          <i className={`dot ${t.is_discretionary ? 'discretionary' : 'essential'}`} />
                          {t.category}
                        </span>
                        {t.note && <span className="tx-note">{t.note}</span>}
                      </div>
                      <div className="tx-account">{t.account ?? ''}</div>
                      <div className={`tx-amt ${t.type !== 'expense' ? 'credit' : ''}`}>
                        {t.type === 'expense' ? '' : '+'}
                        {inr2(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}
