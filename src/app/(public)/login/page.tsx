"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsPending(false);
      return;
    }

    router.push("/example");
    router.refresh();
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 400, fontFamily: "system-ui, sans-serif" }}>
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      </form>
      <p style={{ marginTop: "1rem" }}>
        アカウントを持っていない? <Link href="/signup">サインアップ</Link>
      </p>
    </main>
  );
}
