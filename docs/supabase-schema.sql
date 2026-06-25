-- =============================================================================
-- El Arsenal del Emperador — Esquema Supabase (script ejecutable)
-- =============================================================================
-- Pégalo COMPLETO en Supabase → SQL Editor y dale "Run". Está pensado para una
-- base nueva, pero es idempotente: re-ejecutarlo no rompe nada (tipos, tablas,
-- políticas y triggers usan guards; el seed no duplica).
--
-- Documentación y decisiones: docs/supabase-schema.md
-- Orden: extensiones → enums → tablas → perfiles → índices → funciones →
--        triggers → RLS → storage → seed.
--
-- Tras registrarte con tu email real, hazte admin (una vez):
--   update public.profiles set role = 'admin' where email = 'TU-CORREO-AQUI';
-- =============================================================================

-- ------------------------------------------------------------------ 3. EXTENSIONES
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------- 4. ENUMS
do $$ begin create type product_condition  as enum ('nuevo','caja_abierta','usado');
  exception when duplicate_object then null; end $$;
do $$ begin create type product_status     as enum ('available','reserved','sold','coming_soon');
  exception when duplicate_object then null; end $$;
do $$ begin create type image_kind         as enum ('official','store');
  exception when duplicate_object then null; end $$;
do $$ begin create type sale_channel       as enum ('whatsapp','en_tienda','otro');
  exception when duplicate_object then null; end $$;
do $$ begin create type reservation_status as enum ('pendiente','confirmada','cumplida','cancelada');
  exception when duplicate_object then null; end $$;
do $$ begin create type legion_allegiance  as enum ('loyalist','traitor');
  exception when duplicate_object then null; end $$;
do $$ begin create type user_role          as enum ('customer','admin');
  exception when duplicate_object then null; end $$;

-- ------------------------------------------------------ 5. TABLAS DE CATÁLOGO
create table if not exists factions (
  slug   text primary key,
  name   text not null,
  accent text not null,                 -- color hex de acento
  blurb  text,
  logo   text                           -- ruta del ícono (ej. /legiones_logos/ultramarines.png)
);
-- Para bases existentes: añade la columna si falta (idempotente).
alter table factions add column if not exists logo text;

create table if not exists categories (
  name       text primary key,
  created_at timestamptz not null default now()
);

create table if not exists legions (
  id         text primary key,          -- slug: 'blood-angels'
  name       text not null,
  accent     text not null,
  allegiance legion_allegiance not null,
  motto      text,
  logo       text
);

-- ------------------------------------------------------- 6. TABLAS DE NEGOCIO
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,           -- /producto/<slug>
  name         text not null,
  faction      text not null references factions(slug),
  line         text,
  sku          text not null,
  description  text,
  condition    product_condition not null default 'nuevo',
  price        numeric(10,2) not null,          -- precio de VENTA (público)
  currency     text not null default 'BOB',
  status       product_status not null default 'available',
  release_date date,
  is_preorder  boolean not null default false,
  stock_qty    int not null default 1,
  featured     boolean not null default false,
  clicks       int not null default 0,          -- nº de visitas a la ficha (público)
  category     text,
  category2    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Costos internos (solo admin). Par de monedas: BOB + USD del momento de compra.
create table if not exists product_costs (
  product_id         uuid primary key references products(id) on delete cascade,
  purchase_price     numeric(10,2) not null default 0,   -- costo en BOB (sin impuesto)
  purchase_price_usd numeric(10,2),                       -- costo en USD (sin impuesto)
  tax_rate           numeric(5,2)  not null default 0,    -- % de impuesto sobre la compra
  -- Tipo de cambio IMPLÍCITO (BOB por 1 USD). Generado: comparar entre fechas = inflación.
  fx_rate            numeric(10,4) generated always as (
                       case when purchase_price_usd is null or purchase_price_usd = 0
                            then null
                            else round(purchase_price / purchase_price_usd, 4) end
                     ) stored,
  captured_at        timestamptz not null default now()
);

create table if not exists product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  kind       image_kind not null default 'official',
  alt_text   text,
  sort_order int not null default 0
);

create table if not exists sales (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references products(id) on delete set null,  -- conserva historial
  product_name text not null,         -- snapshot
  sku          text not null,         -- snapshot
  sold_price   numeric(10,2) not null,
  cost         numeric(10,2) not null default 0,   -- snapshot (compra + impuesto) en BOB
  cost_usd     numeric(10,2),                       -- snapshot del costo en USD
  fx_rate      numeric(10,4),                       -- snapshot del tipo de cambio (BOB/USD)
  currency     text not null default 'BOB',
  channel      sale_channel not null,
  category     text,                  -- snapshot para estadísticas
  category2    text,
  buyer_note   text,
  sold_at      timestamptz not null default now()
);

create table if not exists reservations (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,        -- snapshot
  customer_name text not null,
  whatsapp      text not null,
  email         text,
  note          text,
  status        reservation_status not null default 'pendiente',
  user_id       uuid references auth.users(id) on delete set null, -- cliente logueado (opcional)
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------- 7. PERFILES + ROL ADMIN
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  phone      text,                     -- WhatsApp / teléfono de contacto
  department text,                     -- departamento de Bolivia (para envíos)
  legion     text references legions(id) on delete set null,
  provider   text default 'email',     -- 'email' | 'google'
  role       user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Migración para bases ya creadas (idempotente): añade las columnas si faltan.
alter table profiles add column if not exists phone      text;
alter table profiles add column if not exists department text;

-- ------------------------------------------------------------------- ÍNDICES
create index if not exists idx_products_status        on products (status);
create index if not exists idx_products_faction       on products (faction);
create index if not exists idx_products_category      on products (category);
create index if not exists idx_products_clicks        on products (clicks desc);  -- "más vistos"
create index if not exists idx_product_images_product on product_images (product_id);
create index if not exists idx_sales_sold_at          on sales (sold_at);
create index if not exists idx_reservations_status    on reservations (status);

-- --------------------------------------------------------- 8. FUNCIONES Y TRIGGERS
-- 8.1 ¿El usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 8.2 updated_at automático en products
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists products_touch_updated on public.products;
create trigger products_touch_updated
  before update on public.products
  for each row execute function public.touch_updated_at();

-- 8.3 Crear profile al registrarse
-- (lee metadata del signUp: name, legion, provider, phone, department)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, department, legion, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'legion',
    coalesce(new.raw_user_meta_data->>'provider', 'email')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8.4 Evitar que un cliente se auto-promueva a admin.
-- Solo restringe a un usuario AUTENTICADO que no es admin. Desde el SQL editor /
-- service role auth.uid() es null → permite el bootstrap del primer admin.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'No puedes cambiar tu rol';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 8.5 Marcar vendido (transacción): estado -> sold + inserta en sales (snapshots BOB/USD)
create or replace function public.mark_product_sold(
  p_product_id uuid,
  p_sold_price numeric,
  p_channel    sale_channel,
  p_category2  text default null,
  p_buyer_note text default null
)
returns public.sales
language plpgsql security definer set search_path = public
as $$
declare
  v_product  public.products;
  v_cost     numeric;
  v_cost_usd numeric;
  v_fx       numeric;
  v_sale     public.sales;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'Producto no encontrado'; end if;

  -- Snapshot del costo en ambas monedas + tipo de cambio implícito.
  select coalesce(purchase_price, 0)     * (1 + coalesce(tax_rate, 0) / 100.0),
         coalesce(purchase_price_usd, 0) * (1 + coalesce(tax_rate, 0) / 100.0),
         fx_rate
    into v_cost, v_cost_usd, v_fx
    from public.product_costs where product_id = p_product_id;
  v_cost := coalesce(v_cost, 0);

  update public.products
     set status = 'sold', stock_qty = 0,
         category2 = coalesce(p_category2, category2),
         updated_at = now()
   where id = p_product_id;

  insert into public.sales
    (product_id, product_name, sku, sold_price, cost, cost_usd, fx_rate, currency, channel, category, category2, buyer_note)
  values
    (v_product.id, v_product.name, v_product.sku, p_sold_price, v_cost, v_cost_usd, v_fx, v_product.currency,
     p_channel, v_product.category, coalesce(p_category2, v_product.category2), p_buyer_note)
  returning * into v_sale;

  return v_sale;
end;
$$;

-- 8.6 Sumar un click/visita a la ficha (público y anónimo, sin permiso de UPDATE).
create or replace function public.increment_product_clicks(p_product_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.products set clicks = clicks + 1 where id = p_product_id;
$$;

revoke all on function public.increment_product_clicks(uuid) from public;
grant execute on function public.increment_product_clicks(uuid) to anon, authenticated;

-- ------------------------------------------------------------------------- 9. RLS
alter table factions       enable row level security;
alter table categories     enable row level security;
alter table legions        enable row level security;
alter table products       enable row level security;
alter table product_costs  enable row level security;
alter table product_images enable row level security;
alter table sales          enable row level security;
alter table reservations   enable row level security;
alter table profiles       enable row level security;

-- Catálogo: lectura pública
drop policy if exists "catalogo lectura publica" on factions;
create policy "catalogo lectura publica" on factions       for select using (true);
drop policy if exists "catalogo lectura publica" on categories;
create policy "catalogo lectura publica" on categories     for select using (true);
drop policy if exists "catalogo lectura publica" on legions;
create policy "catalogo lectura publica" on legions        for select using (true);
drop policy if exists "catalogo lectura publica" on products;
create policy "catalogo lectura publica" on products       for select using (true);
drop policy if exists "catalogo lectura publica" on product_images;
create policy "catalogo lectura publica" on product_images for select using (true);

-- Catálogo: escritura solo admin
drop policy if exists "admin escribe factions"   on factions;
create policy "admin escribe factions"   on factions       for all using (is_admin()) with check (is_admin());
drop policy if exists "admin escribe categories" on categories;
create policy "admin escribe categories" on categories     for all using (is_admin()) with check (is_admin());
drop policy if exists "admin escribe legions"    on legions;
create policy "admin escribe legions"    on legions        for all using (is_admin()) with check (is_admin());
drop policy if exists "admin escribe products"   on products;
create policy "admin escribe products"   on products       for all using (is_admin()) with check (is_admin());
drop policy if exists "admin escribe imagenes"   on product_images;
create policy "admin escribe imagenes"   on product_images for all using (is_admin()) with check (is_admin());

-- Costos: SOLO admin (ni lectura pública)
drop policy if exists "admin gestiona costos" on product_costs;
create policy "admin gestiona costos" on product_costs for all using (is_admin()) with check (is_admin());

-- Ventas: solo admin
drop policy if exists "admin gestiona ventas" on sales;
create policy "admin gestiona ventas" on sales for all using (is_admin()) with check (is_admin());

-- Reservas: insert público (formulario), gestión solo admin
drop policy if exists "reserva insert publico" on reservations;
create policy "reserva insert publico" on reservations for insert with check (true);
drop policy if exists "admin gestiona reservas" on reservations;
create policy "admin gestiona reservas" on reservations for select using (is_admin());
drop policy if exists "admin actualiza reservas" on reservations;
create policy "admin actualiza reservas" on reservations for update using (is_admin()) with check (is_admin());
drop policy if exists "admin borra reservas" on reservations;
create policy "admin borra reservas" on reservations for delete using (is_admin());

-- Perfiles: cada quien el suyo; admin ve todos
drop policy if exists "perfil propio lectura" on profiles;
create policy "perfil propio lectura"  on profiles for select using (auth.uid() = id or is_admin());
drop policy if exists "perfil propio update" on profiles;
create policy "perfil propio update"   on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ------------------------------------------------------------------- 10. STORAGE
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "imagenes lectura publica" on storage.objects;
create policy "imagenes lectura publica"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "imagenes admin escribe" on storage.objects;
create policy "imagenes admin escribe"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "imagenes admin actualiza" on storage.objects;
create policy "imagenes admin actualiza"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "imagenes admin borra" on storage.objects;
create policy "imagenes admin borra"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================================
-- 11. SEED (datos de prueba) — opcional. En producción carga tu inventario real.
--     Es seguro re-ejecutarlo: no duplica.
-- ============================================================================

-- 11.1 Facciones
insert into factions (slug, name, accent, blurb) values
('space-marines',   'Adeptus Astartes', '#1c1c1c', 'Los Ángeles de la Muerte del Emperador.'),
('necrons',         'Necrons',          '#3ba776', 'Dinastías eternas que despiertan del sueño.'),
('tyranids',        'Tyránidos',        '#7c4dff', 'La Gran Devoradora avanza, hambrienta.'),
('chaos',           'Caos',             '#b3001b', 'La traición que arde en la Disformidad.'),
('astra-militarum', 'Astra Militarum',  '#6b7c3f', 'El martillo incontable de la Humanidad.'),
('aeldari',         'Aeldari',          '#1f7a8c', 'El arte mortal de una raza moribunda.')
on conflict (slug) do nothing;

-- 11.2 Categorías
insert into categories (name) values
('Personaje'), ('Escuadra'), ('Tropas'), ('Vehículo'), ('Monstruo')
on conflict (name) do nothing;

-- 11.3 Legiones
insert into legions (id, name, accent, allegiance, motto) values
('ultramarines',      'Ultramarines',       '#2f5fb0', 'loyalist', 'Courage and Honour'),
('blood-angels',      'Blood Angels',       '#b3001b', 'loyalist', 'Por el Sanguinius'),
('dark-angels',       'Dark Angels',        '#1f4d2e', 'loyalist', 'Repent! For tomorrow you die'),
('space-wolves',      'Space Wolves',       '#6f8390', 'loyalist', 'For Russ and the Allfather'),
('imperial-fists',    'Imperial Fists',     '#e3b007', 'loyalist', 'Primarch-Progenitor'),
('iron-hands',        'Iron Hands',         '#3a3d42', 'loyalist', 'The flesh is weak'),
('salamanders',       'Salamanders',        '#1f7a3d', 'loyalist', 'Into the fires of battle'),
('raven-guard',       'Raven Guard',        '#1b1b22', 'loyalist', 'Victorus aut Mortis'),
('white-scars',       'White Scars',        '#c2453b', 'loyalist', 'For the Khan!'),
('black-templars',    'Black Templars',     '#17171b', 'loyalist', 'No pity, no remorse, no fear'),
('grey-knights',      'Grey Knights',       '#7f8a93', 'loyalist', 'Sigillite''s chosen'),
('world-eaters',      'World Eaters',       '#8a1014', 'traitor',  'Blood for the Blood God'),
('death-guard',       'Death Guard',        '#6f7340', 'traitor',  'Por Nurgle'),
('thousand-sons',     'Thousand Sons',      '#16776b', 'traitor',  'All is dust'),
('emperors-children', 'Emperor''s Children','#7a2d72', 'traitor',  'Por Slaanesh'),
('iron-warriors',     'Iron Warriors',      '#52525a', 'traitor',  'Iron within, iron without'),
('night-lords',       'Night Lords',        '#26344f', 'traitor',  'Ave Dominus Nox'),
('alpha-legion',      'Alpha Legion',       '#1f7068', 'traitor',  'For the Emperor (?)'),
('word-bearers',      'Word Bearers',       '#6e1f1f', 'traitor',  'Por la Palabra')
on conflict (id) do nothing;

-- 11.4 Productos
insert into products (slug, name, faction, line, sku, description, condition, price, currency, status, release_date, is_preorder, stock_qty, featured, category) values
('black-templar-sword-brother','Black Templar — Sword Brother','space-marines','Adeptus Astartes · Black Templars','BT-SB-001','Hermano de Espada de los Templarios Negros, portando la hoja Excelsior. Pintado a nivel exposición sobre armadura Mk X. Pieza única de colección, montada y sellada.','nuevo',480,'BOB','available',null,false,1,true,'Personaje'),
('primaris-crusader-squad','Escuadra Cruzada Primaris','space-marines','Adeptus Astartes · Black Templars','BT-CR-010','Set de cinco Cruzados Primaris listos para asaltar las líneas enemigas. Incluye opciones de armas y estandarte de la capilla.','caja_abierta',720,'BOB','available',null,false,1,true,'Escuadra'),
('marshal-helbrecht','Mariscal Helbrecht','space-marines','Personajes · Black Templars','BT-HB-002','El Alto Mariscal de los Templarios Negros, espada Fuego Eterno en mano. Personaje épico, base personalizada con escombros de batalla.','nuevo',950,'BOB','reserved',null,false,1,false,'Personaje'),
('necron-overlord-resurrection','Señor Necrón — Resurrección','necrons','Necrons · Dinastía Szarekh','NEC-OL-004','Señor Necrón con vara de mando, terminado en metal negro y energía verde gauss. Brilla en la oscuridad de cualquier vitrina.','nuevo',540,'BOB','available',null,false,1,true,'Personaje'),
('canoptek-wraith','Espectro Canóptek','necrons','Necrons · Canóptek','NEC-CW-007','Constructo Canóptek de patrullaje, articulado y suspendido sobre vástago. Pieza ya vendida — referencia de nuestro trabajo de pintura.','usado',360,'BOB','sold',null,false,0,false,'Tropas'),
('tyranid-hive-tyrant','Tirano de la Colmena','tyranids','Tyránidos · Flota Enjambre Leviathan','TYR-HT-011','Criatura sináptica masiva con alas membranosas y garras óseas. Esquema Leviathan púrpura y hueso. Domina cualquier mesa de exhibición.','nuevo',880,'BOB','available',null,false,1,false,'Monstruo'),
('termagant-brood','Camada de Termagantes','tyranids','Tyránidos · Tropas','TYR-TG-012','Doce Termagantes con cañones de espinas, montados en bases de ceniza. Marea biológica lista para inundar al enemigo.','caja_abierta',410,'BOB','available',null,false,1,false,'Tropas'),
('chaos-lord-khorne','Señor del Caos — Khorne','chaos','Heréticos Astartes · Devoradores de Mundos','CHS-KL-008','Señor del Caos consagrado a Khorne, hacha sedienta de sangre y capa de cráneos. Rojo sangre con bronce envejecido. ¡Sangre para el Dios de la Sangre!','nuevo',620,'BOB','available',null,false,1,true,'Personaje'),
('cadian-command-squad','Escuadra de Mando Cadiana','astra-militarum','Astra Militarum · 8.º Cadiano','AM-CC-015','Escuadra de mando completa: oficial, portaestandarte, vox y médico. Pre-pedido del próximo reabastecimiento.','nuevo',560,'BOB','coming_soon','2026-08-15',true,1,false,'Escuadra'),
('aeldari-farseer','Vidente Aeldari','aeldari','Aeldari · Mundo Astronave Ulthwé','AEL-FS-009','Vidente sobre runas flotantes, lanza singular en alto. Esquema Ulthwé negro y hueso con gemas turquesa. Lanzamiento estimado para la próxima ola.','nuevo',590,'BOB','coming_soon','2026-09-01',true,1,false,'Personaje'),
('emperors-champion','Campeón del Emperador','space-marines','Personajes · Black Templars','BT-EC-003','El Campeón del Emperador, portando el Filo del Cruzado y el Armorum de Fe. Joya de cualquier colección Templaria.','nuevo',1100,'BOB','available',null,false,1,false,'Personaje'),
('necron-doomsday-ark','Arca del Juicio Final','necrons','Necrons · Vehículos','NEC-DA-013','Vehículo flotante con cañón del juicio final. Pieza central imponente. Lanzamiento del próximo reabastecimiento de la dinastía.','nuevo',1280,'BOB','coming_soon','2026-07-30',true,1,false,'Vehículo')
on conflict (slug) do nothing;

-- 11.5 Costos internos (compra en BOB y USD + impuesto 13%). fx_rate se calcula solo (~6.96).
insert into product_costs (product_id, purchase_price, purchase_price_usd, tax_rate)
select p.id, v.pp, v.usd, v.tr
from (values
  ('black-templar-sword-brother',290,41.67,13),
  ('primaris-crusader-squad',430,61.78,13),
  ('marshal-helbrecht',560,80.46,13),
  ('necron-overlord-resurrection',320,45.98,13),
  ('canoptek-wraith',210,30.17,13),
  ('tyranid-hive-tyrant',520,74.71,13),
  ('termagant-brood',240,34.48,13),
  ('chaos-lord-khorne',360,51.72,13),
  ('cadian-command-squad',330,47.41,13),
  ('aeldari-farseer',350,50.29,13),
  ('emperors-champion',640,91.95,13),
  ('necron-doomsday-ark',760,109.20,13)
) as v(slug, pp, usd, tr)
join products p on p.slug = v.slug
on conflict (product_id) do nothing;

-- 11.5b Clicks demo — DESACTIVADO.
-- Antes sembraba clicks ficticios (142, 128…) para que el ranking "más vistos"
-- no saliera vacío en la maqueta. Eso hacía que el panel pareciera "no real".
-- Ahora los clicks se cuentan SOLO de visitas reales a la ficha
-- (RPC increment_product_clicks, ver §8.6). Si necesitas limpiar los valores de
-- demo ya sembrados en una base existente, corre:
--   update products set clicks = 0;            -- borrón y cuenta nueva
-- (o limita el update a los slugs de demo para conservar visitas reales).

-- 11.6 Imágenes (placeholders en /public/products). Solo si aún no hay imágenes.
insert into product_images (product_id, url, kind, alt_text, sort_order)
select p.id, v.url, v.kind::image_kind, v.alt, v.sort
from (values
  ('black-templar-sword-brother','/products/bt-01.jpg','official','Black Templar Sword Brother, vista frontal',0),
  ('black-templar-sword-brother','/products/bt-02.jpg','official','Black Templar Sword Brother, perfil',1),
  ('black-templar-sword-brother','/products/bt-03.jpg','store','Foto real de la pieza en tienda',2),
  ('black-templar-sword-brother','/products/bt-04.jpg','store','Detalle del escudo y la espada',3),
  ('primaris-crusader-squad','/products/bt-05.jpg','official','Escuadra Cruzada Primaris',0),
  ('primaris-crusader-squad','/products/bt-06.jpg','store','Foto real de la escuadra',1),
  ('marshal-helbrecht','/products/bt-07.jpg','official','Mariscal Helbrecht',0),
  ('marshal-helbrecht','/products/bt-01.jpg','store','Foto real del Mariscal',1),
  ('necron-overlord-resurrection','/products/bt-02.jpg','official','Señor Necrón',0),
  ('necron-overlord-resurrection','/products/bt-03.jpg','store','Foto real del Señor Necrón',1),
  ('canoptek-wraith','/products/bt-04.jpg','official','Espectro Canóptek',0),
  ('canoptek-wraith','/products/bt-05.jpg','store','Foto real del Espectro',1),
  ('tyranid-hive-tyrant','/products/bt-06.jpg','official','Tirano de la Colmena',0),
  ('tyranid-hive-tyrant','/products/bt-07.jpg','store','Foto real del Tirano',1),
  ('termagant-brood','/products/bt-01.jpg','official','Camada de Termagantes',0),
  ('termagant-brood','/products/bt-02.jpg','store','Foto real de la camada',1),
  ('chaos-lord-khorne','/products/bt-03.jpg','official','Señor del Caos de Khorne',0),
  ('chaos-lord-khorne','/products/bt-04.jpg','store','Foto real del Señor del Caos',1),
  ('cadian-command-squad','/products/bt-05.jpg','official','Escuadra de Mando Cadiana',0),
  ('aeldari-farseer','/products/bt-06.jpg','official','Vidente Aeldari',0),
  ('emperors-champion','/products/bt-07.jpg','official','Campeón del Emperador',0),
  ('emperors-champion','/products/bt-01.jpg','store','Foto real del Campeón',1),
  ('emperors-champion','/products/bt-02.jpg','store','Detalle del filo del Cruzado',2),
  ('necron-doomsday-ark','/products/bt-03.jpg','official','Arca del Juicio Final',0)
) as v(slug, url, kind, alt, sort)
join products p on p.slug = v.slug
where not exists (select 1 from product_images);

-- 11.7 Venta de ejemplo (consistente con el estado 'sold'). Snapshot BOB + USD + fx.
insert into sales (product_id, product_name, sku, sold_price, cost, cost_usd, fx_rate, currency, channel, category, buyer_note, sold_at)
select p.id, p.name, p.sku, 360,
       coalesce(c.purchase_price,0)     * (1 + coalesce(c.tax_rate,0)/100.0),
       coalesce(c.purchase_price_usd,0) * (1 + coalesce(c.tax_rate,0)/100.0),
       c.fx_rate,
       p.currency, 'whatsapp', p.category, 'Cliente recurrente.', '2026-06-08T16:20:00Z'
from products p
left join product_costs c on c.product_id = p.id
where p.slug = 'canoptek-wraith'
  and not exists (select 1 from sales);

-- 11.8 Reservas de ejemplo
insert into reservations (product_id, product_name, customer_name, whatsapp, note, status, created_at)
select p.id, p.name, v.cust, v.wa, v.note, v.status::reservation_status, v.created::timestamptz
from (values
  ('marshal-helbrecht','Marco Antezana','59171234567','Pasa a recoger el sábado.','confirmada','2026-06-10T09:12:00Z'),
  ('cadian-command-squad','Lucía Vargas','59176543210',null,'pendiente','2026-06-18T20:40:00Z'),
  ('aeldari-farseer','Diego Rojas','59170011223','¿Aceptan QR?','pendiente','2026-06-20T13:05:00Z'),
  ('necron-doomsday-ark','Sofía Mendoza','59178899001',null,'cumplida','2026-05-30T17:50:00Z')
) as v(slug, cust, wa, note, status, created)
join products p on p.slug = v.slug
where not exists (select 1 from reservations);

-- =============================================================================
-- FIN. Recuerda: tras registrarte, hazte admin con el UPDATE del encabezado.
-- Fuera del SQL (panel de Supabase): Auth → Google/Email, subir imágenes a
-- Storage, y en el front .env.local con NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.
-- =============================================================================
