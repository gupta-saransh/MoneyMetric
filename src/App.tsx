// Placeholder for the analytics dashboard. Logging happens via the iOS Shortcut;
// this surface is only for viewing (charts/summaries) and gets built out later.
export default function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '48px auto',
        padding: '0 16px',
        lineHeight: 1.5,
      }}
    >
      <h1>MoneyMetric</h1>
      <p>Back-tap expense tracker. Expenses are logged from your iPhone via an iOS Shortcut.</p>
      <p>This web app is the analytics dashboard — coming soon.</p>
      <h2>API</h2>
      <ul>
        <li>
          <code>POST /api/expense</code> — log an expense
        </li>
        <li>
          <code>GET /api/options</code> — category &amp; account lists
        </li>
      </ul>
    </main>
  );
}
