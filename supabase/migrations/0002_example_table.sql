-- examples: Feature Slice のサンプル用テーブル。
-- auth.users(id) を参照し、作成者本人のみが read/write できる RLS を強制する。

create table if not exists public.examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists examples_user_id_created_at_idx
  on public.examples (user_id, created_at desc);

alter table public.examples enable row level security;

-- SELECT: 本人の行のみ。
create policy "examples_select_own"
  on public.examples
  for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT: user_id を自分の uid に固定する必要がある。
create policy "examples_insert_own"
  on public.examples
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: 本人の行のみ、user_id の付け替えも本人に限定。
create policy "examples_update_own"
  on public.examples
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: 本人の行のみ。
create policy "examples_delete_own"
  on public.examples
  for delete
  to authenticated
  using (auth.uid() = user_id);
