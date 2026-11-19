create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name varchar(100) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (char_length(btrim(name)) > 0),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name varchar(160) not null,
  price numeric(12, 2) not null,
  sale_unit text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (char_length(btrim(name)) > 0),
  constraint products_price_positive check (price > 0),
  constraint products_sale_unit_valid check (sale_unit in ('unit', 'kg'))
);

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index products_active_name_id_idx
  on public.products (name, id)
  where is_active = true;

create index products_category_id_idx on public.products (category_id);
create index categories_parent_sort_name_idx
  on public.categories (parent_id, sort_order, name);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create function public.enforce_category_depth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_parent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A category cannot be its own parent.'
      using errcode = '23514';
  end if;

  select parent_id
  into parent_parent_id
  from public.categories
  where id = new.parent_id;

  if found and parent_parent_id is not null then
    raise exception 'Categories can only have one subcategory level.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.categories
    where parent_id = new.id
  ) then
    raise exception 'A category with subcategories cannot become a subcategory.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger categories_enforce_depth
  before insert or update of parent_id on public.categories
  for each row execute function public.enforce_category_depth();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.admin_users enable row level security;

create policy "Public can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can read all products"
  on public.products for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.categories, public.products to anon;
grant select, insert, update, delete on public.categories, public.products to authenticated;
revoke all on public.admin_users from public, anon, authenticated;