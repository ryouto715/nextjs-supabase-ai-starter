"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
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
    const { error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setIsPending(false);
      return;
    }

    router.push("/example");
    router.refresh();
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 400, fontFamily: "system-ui, sans-serif" }}>
      <h1>サインアップ</h1>
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
          <span>Password (6 文字以上)</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? "登録中..." : "サインアップ"}
        </button>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      </form>
      <p style={{ marginTop: "1rem" }}>
        既にアカウントを持っている? <Link href="/login">ログイン</Link>
      </p>
    </main>
  );
}
