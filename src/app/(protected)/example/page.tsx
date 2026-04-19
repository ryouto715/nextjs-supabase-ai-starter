"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useExample } from "@/features/example/use-example";

export default function ExamplePage() {
  const { examples, loading, error, create } = useExample();
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    try {
      await create(title);
      setTitle("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 640, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>Examples</h1>
        <button type="button" onClick={handleSignOut}>
          サインアウト
        </button>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <label htmlFor="example-title" style={{ position: "absolute", left: -9999 }}>
          タイトル
        </label>
        <input
          id="example-title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力"
          disabled={pending}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={pending || title.length === 0}>
          {pending ? "追加中..." : "追加"}
        </button>
      </form>
      {formError && (
        <p role="alert" style={{ color: "crimson" }}>
          {formError}
        </p>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        {loading && <p>読み込み中...</p>}
        {error && (
          <p role="alert" style={{ color: "crimson" }}>
            {error}
          </p>
        )}
        {!loading && examples.length === 0 && <p>まだデータがありません。</p>}
        <ul style={{ display: "grid", gap: "0.5rem", listStyle: "none", padding: 0 }}>
          {examples.map((example) => (
            <li
              key={example.id}
              style={{ border: "1px solid #ddd", padding: "0.75rem", borderRadius: 4 }}
            >
              <strong>{example.title}</strong>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{example.createdAt}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
