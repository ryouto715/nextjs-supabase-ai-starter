"use client";

import { useCallback, useEffect, useState } from "react";
import type { Example } from "./types";

type State = {
  examples: Example[];
  loading: boolean;
  error: string | null;
};

export function useExample() {
  const [state, setState] = useState<State>({ examples: [], loading: false, error: null });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch("/api/examples", { cache: "no-store" });
      if (!res.ok) throw new Error(`failed to fetch examples: ${res.status}`);
      const json = (await res.json()) as { examples: Example[] };
      setState({ examples: json.examples, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "unknown error",
      }));
    }
  }, []);

  const create = useCallback(
    async (title: string) => {
      const res = await fetch("/api/examples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`failed to create example: ${res.status}`);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh, create };
}
