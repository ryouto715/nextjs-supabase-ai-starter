import { z } from "zod";

// Supabase の新 API キー（publishable / secret）を優先し、レガシー（anon / service_role,
// 2026年末 deprecated）にフォールバックする。返すフィールドは実態に合わせて中立な名前にする
// （anon という名前のまま publishable 値を入れると誤解を生むため）。
// 注: NEXT_PUBLIC_* は Next.js がビルド時に静的解析でインライン化するため、両方の
// 変数名を「静的に」参照する（動的キーアクセスはインライン化されない）。

const publicEnvSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/**
 * サーバー専用の secret キー（旧 service_role）。RLS をバイパスする管理操作にのみ使う。
 * 新 SUPABASE_SECRET_KEY を優先し、レガシー SUPABASE_SERVICE_ROLE_KEY にフォールバック。
 */
export function getSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is required");
  }
  return key;
}
