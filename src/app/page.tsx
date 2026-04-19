export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Next.js + Supabase AI Starter</h1>
      <p>
        このページは初期テンプレです。Supabase Auth と example feature は
        後続の PR で投入されます。
      </p>
      <ul>
        <li>
          API ヘルスチェック: <code>GET /api/health</code>
        </li>
      </ul>
    </main>
  );
}
