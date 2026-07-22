create table if not exists public.app_items (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('calendar', 'goals', 'habits')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);
alter table public.app_items enable row level security;
create policy "Users can read their own items" on public.app_items for select using (auth.uid() = user_id);
create policy "Users can insert their own items" on public.app_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own items" on public.app_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own items" on public.app_items for delete using (auth.uid() = user_id);
alter publication supabase_realtime add table public.app_items;
