-- 初期マイグレーション
-- 空のベースライン。後続の migration でテーブル + RLS を追加する。

-- 必要な拡張機能を先に有効化しておく（Supabase デフォルトで入っている）。
-- テーブル固有の RLS ポリシーは、各テーブル追加 migration に同梱すること。

-- Example: uuid 生成に使う pgcrypto（Supabase ではデフォルトで extensions スキーマに入っている）
-- CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
