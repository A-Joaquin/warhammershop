# Base de datos — Supabase (esquema acordado)

> **Estado: DECISIONES TOMADAS — listo para ejecutar.** Refleja lo acordado en la
> [§12](#12-decisiones-tomadas): todas las recomendaciones ✅, **reservas con
> `user_id`** preparado, BD de ventas **limpia** (solo la venta real),
> `profiles.email` **conservado** y **par de monedas BOB/USD** para medir
> inflación. Suma dos funcionalidades nuevas: **contador de clicks por producto** y
> **estadísticas de inflación** (tipo de cambio implícito BOB/USD en el tiempo).
> Refleja además todo el frontend mock (`lib/data.ts`, `lib/admin-data.ts`,
> `lib/legions.ts`, `lib/types.ts`, `lib/account-context.tsx`) y el brief.
> Ejecuta de la §3 a la §11 en orden.

Índice:
1. Cómo usar este archivo
2. Decisiones de diseño (resumen)
3. Extensiones
4. Tipos (enums)
5. Tablas de catálogo (`factions`, `categories`, `legions`)
6. Tablas de negocio (`products`, `product_costs`, `product_images`, `sales`, `reservations`)
7. Perfiles y rol admin (`profiles`)
8. Funciones y triggers (incl. `increment_product_clicks`)
9. RLS (seguridad por fila)
10. Storage (imágenes)
11. Seed (datos de prueba)
12. **Decisiones tomadas**
13. Funcionalidades nuevas (resumen)
14. **Estadísticas nuevas (inflación + clicks)**
15. Fuera del SQL (configurar en el panel)

---

## 1. Cómo usar este archivo

- ⭐ **Atajo:** el script completo y listo para pegar de una sola vez está en
  [`docs/supabase-schema.sql`](./supabase-schema.sql). Es **idempotente**
  (re-ejecutarlo no rompe ni duplica). Este `.md` es la versión explicada/seccionada.
- Cada bloque ```sql``` está pensado para pegarse en **Supabase → SQL Editor**.
- **Orden importa**: ejecuta de la §3 a la §11 en orden (o todo de una vez).
- El **seed (§11)** es opcional / para desarrollo. En producción cargas tu
  inventario real.
- Después de crear tu usuario admin, hay un paso manual para asignarte el rol
  (ver §7 y §15).

---

## 2. Decisiones de diseño (resumen)

- **Claves naturales** (`text`) para catálogos estables usados en código/URLs:
  `factions.slug`, `legions.id`, `categories.name`. **UUID** para filas
  transaccionales (`products`, `sales`, etc.).
- **Costos separados**: el precio de compra y el impuesto viven en
  `product_costs` (solo admin), **no** en `products`. Así la vitrina pública
  puede leer `products` sin filtrar columnas sensibles. *(ver §12.1)*
- **Snapshots en `sales`**: nombre, SKU, costo y categorías se copian al vender,
  para que el historial sobreviva aunque el producto cambie o se borre.
- **`mark_product_sold()`**: función transaccional (cambia estado + inserta
  venta), igual que el mock.
- **Perfil + legión** en `profiles`, ligado a `auth.users`; se crea solo con un
  trigger al registrarse.
- **Par de monedas (BOB/USD)**: el costo de compra se guarda en **bolivianos y en
  dólares**; el **tipo de cambio implícito** (`fx_rate`, columna generada) queda
  registrado por producto para **apreciar la inflación/devaluación** en las
  estadísticas. *(§12.10)*
- **Contador de clicks**: `products.clicks` se incrementa con la función pública
  `increment_product_clicks()` (el visitante anónimo NO escribe `products`
  directamente; lo hace una función `security definer`). *(nuevo)*

---

## 3. Extensiones

```sql
-- gen_random_uuid() ya viene disponible en Supabase (pgcrypto).
create extension if not exists pgcrypto;
```

---

## 4. Tipos (enums)

```sql
create type product_condition  as enum ('nuevo', 'caja_abierta', 'usado');
create type product_status     as enum ('available', 'reserved', 'sold', 'coming_soon');
create type image_kind         as enum ('official', 'store');
create type sale_channel       as enum ('whatsapp', 'en_tienda', 'otro');
create type reservation_status as enum ('pendiente', 'confirmada', 'cumplida', 'cancelada');
create type legion_allegiance  as enum ('loyalist', 'traitor');
create type user_role          as enum ('customer', 'admin');
```

---

## 5. Tablas de catálogo

```sql
-- Facciones de producto (ejércitos): Space Marines, Necrons, etc.
create table factions (
  slug   text primary key,
  name   text not null,
  accent text not null,           -- color hex de acento
  blurb  text
);

-- Categorías (tipo de pieza). El admin puede crear nuevas al vuelo.
create table categories (
  name       text primary key,
  created_at timestamptz not null default now()
);

-- Legiones/Capítulos a los que el CLIENTE declara lealtad.
create table legions (
  id         text primary key,         -- slug: 'blood-angels'
  name       text not null,
  accent     text not null,
  allegiance legion_allegiance not null,
  motto      text,
  logo       text                       -- ruta al logo (futuro)
);
```

---

## 6. Tablas de negocio

```sql
create table products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,           -- /producto/<slug>
  name         text not null,
  faction      text not null references factions(slug),
  line         text,                            -- set / línea
  sku          text not null,                   -- código de búsqueda
  description  text,
  condition    product_condition not null default 'nuevo',
  price        numeric(10,2) not null,          -- precio de VENTA (público)
  currency     text not null default 'BOB',
  status       product_status not null default 'available',
  release_date date,                            -- para coming_soon
  is_preorder  boolean not null default false,
  stock_qty    int not null default 1,
  featured     boolean not null default false,
  clicks       int not null default 0,          -- nº de visitas a la ficha (público)
  category     text,                            -- categoría principal
  category2    text,                            -- 2ª categoría (opcional)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Datos financieros internos: SEPARADOS para no exponerlos a la vitrina.
-- Par de monedas: guardamos el costo en BOB y en USD del MOMENTO de la compra.
create table product_costs (
  product_id         uuid primary key references products(id) on delete cascade,
  purchase_price     numeric(10,2) not null default 0,   -- costo en BOB (sin impuesto)
  purchase_price_usd numeric(10,2),                       -- costo equivalente en USD (sin impuesto)
  tax_rate           numeric(5,2)  not null default 0,    -- % de impuesto sobre la compra
  -- Tipo de cambio IMPLÍCITO (BOB por 1 USD) al registrar el costo. Generado a
  -- partir del par de montos: comparar este valor entre fechas = ver la inflación.
  fx_rate            numeric(10,4) generated always as (
                       case when purchase_price_usd is null or purchase_price_usd = 0
                            then null
                            else round(purchase_price / purchase_price_usd, 4) end
                     ) stored,
  captured_at        timestamptz not null default now()   -- cuándo se fijó este costo/cambio
);

create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null,
  kind       image_kind not null default 'official',
  alt_text   text,
  sort_order int not null default 0
);

create table sales (
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
  category2    text,                  -- 2ª categoría asignada en la venta
  buyer_note   text,
  sold_at      timestamptz not null default now()
);

create table reservations (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete set null,
  product_name  text not null,        -- snapshot
  customer_name text not null,
  whatsapp      text not null,
  email         text,
  note          text,
  status        reservation_status not null default 'pendiente',
  user_id       uuid references auth.users(id) on delete set null, -- si reservó logueado (futuro)
  created_at    timestamptz not null default now()
);

-- Índices útiles
create index on products (status);
create index on products (faction);
create index on products (category);
create index on products (clicks desc);   -- ranking "más vistos"
create index on product_images (product_id);
create index on sales (sold_at);
create index on reservations (status);
```

---

## 7. Perfiles y rol admin

```sql
create table profiles (
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
```

> **Hacerte admin:** tras registrarte (con tu email real), ejecuta una vez:
> ```sql
> update profiles set role = 'admin'
> where email = 'TU-CORREO-AQUI';
> ```

---

## 8. Funciones y triggers

```sql
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

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 8.5 Marcar vendido (transacción): estado -> sold + inserta en sales
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

-- 8.6 Sumar un click/visita a la ficha de un producto.
-- Público y anónimo: el visitante NO tiene permiso de UPDATE sobre products, así
-- que el incremento ocurre del lado servidor de forma controlada (security definer).
create or replace function public.increment_product_clicks(p_product_id uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.products set clicks = clicks + 1 where id = p_product_id;
$$;

-- Solo esta función puede tocar el contador; nadie más escribe products.
revoke all on function public.increment_product_clicks(uuid) from public;
grant execute on function public.increment_product_clicks(uuid) to anon, authenticated;
```

---

## 9. RLS (seguridad por fila)

```sql
alter table factions       enable row level security;
alter table categories     enable row level security;
alter table legions        enable row level security;
alter table products       enable row level security;
alter table product_costs  enable row level security;
alter table product_images enable row level security;
alter table sales          enable row level security;
alter table reservations   enable row level security;
alter table profiles       enable row level security;

-- Catálogo: lectura pública, escritura solo admin
create policy "catalogo lectura publica" on factions       for select using (true);
create policy "catalogo lectura publica" on categories     for select using (true);
create policy "catalogo lectura publica" on legions        for select using (true);
create policy "catalogo lectura publica" on products       for select using (true);
create policy "catalogo lectura publica" on product_images for select using (true);

create policy "admin escribe factions"   on factions       for all using (is_admin()) with check (is_admin());
create policy "admin escribe categories" on categories     for all using (is_admin()) with check (is_admin());
create policy "admin escribe legions"    on legions        for all using (is_admin()) with check (is_admin());
create policy "admin escribe products"   on products       for all using (is_admin()) with check (is_admin());
create policy "admin escribe imagenes"   on product_images for all using (is_admin()) with check (is_admin());

-- Costos: SOLO admin (ni lectura pública)
create policy "admin gestiona costos" on product_costs for all using (is_admin()) with check (is_admin());

-- Ventas: solo admin
create policy "admin gestiona ventas" on sales for all using (is_admin()) with check (is_admin());

-- Reservas: insert público (formulario), gestión solo admin
create policy "reserva insert publico" on reservations for insert with check (true);
create policy "admin gestiona reservas" on reservations for select using (is_admin());
create policy "admin actualiza reservas" on reservations for update using (is_admin()) with check (is_admin());
create policy "admin borra reservas" on reservations for delete using (is_admin());

-- Perfiles: cada quien el suyo; admin ve todos
create policy "perfil propio lectura"  on profiles for select using (auth.uid() = id or is_admin());
create policy "perfil propio update"   on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
```

---

## 10. Storage (imágenes)

```sql
-- Bucket público para fotos de producto (oficiales y de tienda)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Lectura pública, escritura solo admin
create policy "imagenes lectura publica"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "imagenes admin escribe"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "imagenes admin actualiza"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "imagenes admin borra"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
```

---

## 11. Seed (datos de prueba)

```sql
-- 11.1 Facciones
insert into factions (slug, name, accent, blurb) values
('space-marines',   'Adeptus Astartes', '#1c1c1c', 'Los Ángeles de la Muerte del Emperador.'),
('necrons',         'Necrons',          '#3ba776', 'Dinastías eternas que despiertan del sueño.'),
('tyranids',        'Tyránidos',        '#7c4dff', 'La Gran Devoradora avanza, hambrienta.'),
('chaos',           'Caos',             '#b3001b', 'La traición que arde en la Disformidad.'),
('astra-militarum', 'Astra Militarum',  '#6b7c3f', 'El martillo incontable de la Humanidad.'),
('aeldari',         'Aeldari',          '#1f7a8c', 'El arte mortal de una raza moribunda.');

-- 11.2 Categorías
insert into categories (name) values
('Personaje'), ('Escuadra'), ('Tropas'), ('Vehículo'), ('Monstruo');

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
('word-bearers',      'Word Bearers',       '#6e1f1f', 'traitor',  'Por la Palabra');

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
('necron-doomsday-ark','Arca del Juicio Final','necrons','Necrons · Vehículos','NEC-DA-013','Vehículo flotante con cañón del juicio final. Pieza central imponente. Lanzamiento del próximo reabastecimiento de la dinastía.','nuevo',1280,'BOB','coming_soon','2026-07-30',true,1,false,'Vehículo');

-- 11.5 Costos internos (compra en BOB y USD + impuesto 13%).
-- El fx_rate (BOB/USD) se calcula solo. Aquí ronda ~6.96 (cambio oficial),
-- pero si más adelante compras a un cambio más alto, el fx_rate lo reflejará.
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
join products p on p.slug = v.slug;

-- 11.5b Clicks demo (para que el ranking "más vistos" no salga vacío)
update products p set clicks = v.clicks
from (values
  ('black-templar-sword-brother',142),
  ('emperors-champion',128),
  ('chaos-lord-khorne',97),
  ('tyranid-hive-tyrant',83),
  ('necron-overlord-resurrection',61),
  ('primaris-crusader-squad',54),
  ('marshal-helbrecht',47),
  ('necron-doomsday-ark',39),
  ('aeldari-farseer',31),
  ('termagant-brood',22),
  ('cadian-command-squad',18),
  ('canoptek-wraith',9)
) as v(slug, clicks)
where p.slug = v.slug;

-- 11.6 Imágenes (placeholders actuales en /public/products)
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
join products p on p.slug = v.slug;

-- 11.7 Venta de ejemplo (consistente con el estado 'sold' de la pieza).
-- Snapshot del costo en BOB y USD + tipo de cambio implícito.
insert into sales (product_id, product_name, sku, sold_price, cost, cost_usd, fx_rate, currency, channel, category, buyer_note, sold_at)
select p.id, p.name, p.sku, 360,
       coalesce(c.purchase_price,0)     * (1 + coalesce(c.tax_rate,0)/100.0),
       coalesce(c.purchase_price_usd,0) * (1 + coalesce(c.tax_rate,0)/100.0),
       c.fx_rate,
       p.currency, 'whatsapp', p.category, 'Cliente recurrente.', '2026-06-08T16:20:00Z'
from products p
left join product_costs c on c.product_id = p.id
where p.slug = 'canoptek-wraith';

-- 11.8 Reservas de ejemplo
insert into reservations (product_id, product_name, customer_name, whatsapp, note, status, created_at)
select p.id, p.name, v.cust, v.wa, v.note, v.status::reservation_status, v.created::timestamptz
from (values
  ('marshal-helbrecht','Marco Antezana','59171234567','Pasa a recoger el sábado.','confirmada','2026-06-10T09:12:00Z'),
  ('cadian-command-squad','Lucía Vargas','59176543210',null,'pendiente','2026-06-18T20:40:00Z'),
  ('aeldari-farseer','Diego Rojas','59170011223','¿Aceptan QR?','pendiente','2026-06-20T13:05:00Z'),
  ('necron-doomsday-ark','Sofía Mendoza','59178899001',null,'cumplida','2026-05-30T17:50:00Z')
) as v(slug, cust, wa, note, status, created)
join products p on p.slug = v.slug;
```

> **Nota sobre el seed de ventas:** el mock tenía 4 ventas de ejemplo, pero 3 de
> ellas eran sobre productos que seguían "disponibles" (inconsistente para una BD
> real). Aquí dejé **solo la venta de la pieza realmente vendida**. Si quieres más
> datos para que las estadísticas se vean pobladas, ver §12.8.

---

## 12. Decisiones tomadas

> Cerrado según tus respuestas. ✅ = aplicado en el esquema de arriba.

**12.1 — Costos en tabla separada (`product_costs`).** ✅ *Aplicado.*
Evita exponer precio de compra/impuesto a los clientes. El admin lee `products` +
`product_costs` con un join sencillo.

**12.2 — Claves naturales (`text`) en catálogos.** ✅ *Aplicado.*
`factions.slug`, `legions.id`, `categories.name` como PK, encajan con el front.

**12.3 — `categories` sin FK estricta.** ✅ *Aplicado.*
`products.category` es texto libre (crear categorías al vuelo); `categories`
alimenta el desplegable.

**12.4 — Snapshots en `sales`/`reservations`.** ✅ *Aplicado.*
Nombre/SKU/costo/categoría se copian al vender; el historial sobrevive a ediciones
o borrados (`on delete set null`).

**12.5 — `mark_product_sold()` como función de BD.** ✅ *Aplicado.*
Transacción atómica del lado servidor (`supabase.rpc('mark_product_sold', …)`).
Ahora también guarda el snapshot del costo en USD y el `fx_rate`.

**12.6 — Rol admin en `profiles.role`.** ✅ *Aplicado* (v1 simple, vía `is_admin()`).

**12.7 — Reservas con `user_id` opcional.** ✅ *Sí, preparada.*
La columna `reservations.user_id` queda lista para vincular reservas de un cliente
logueado a su cuenta. El formulario anónimo sigue funcionando (queda en `null`).

**12.8 — Riqueza del seed de ventas.** ✅ *Solo la venta real.*
BD limpia: una única venta de ejemplo (la pieza realmente vendida). Sin ventas
demo extra.

**12.9 — `profiles.email`.** ✅ *Se conserva.*
Lo mantenemos para consultas cómodas y para asignar el rol admin por email.

**12.10 — Par de monedas (BOB/USD) + inflación.** ✅ *Aplicado.*
El costo se registra en **bolivianos y dólares** (`purchase_price`,
`purchase_price_usd`); el `fx_rate` (BOB/USD) se calcula solo y queda guardado por
producto y como snapshot en cada venta. Así, si el boliviano se devalúa, comparar
el `fx_rate` entre fechas muestra la inflación. Consultas listas en la
[§14](#14-estadisticas-nuevas-inflacion--clicks).

---

## 13. Funcionalidades nuevas (resumen)

- **Contador de clicks** (`products.clicks`): cada visita a `/producto/[slug]`
  llama a `increment_product_clicks(id)`. Alimenta el ranking "más vistos" y la
  conversión clicks→venta. *(ver §8.6 y §14)*
- **Par de monedas e inflación** (§12.10): costo en BOB+USD con `fx_rate` implícito;
  nuevo bloque de estadísticas de devaluación en el panel.

---

## 14. Estadísticas nuevas (inflación + clicks)

> Consultas de referencia para el panel `/admin/estadisticas`. (Ejecutables con
> `supabase.rpc`/`from(...).select(...)` o como vistas.)

```sql
-- 14.1 Tipo de cambio implícito promedio por mes (curva de devaluación).
-- Sube el número de Bs por dólar => el boliviano pierde valor (inflación).
select date_trunc('month', captured_at) as mes,
       round(avg(fx_rate), 4)           as bob_por_usd_prom,
       count(*)                          as productos_registrados
from product_costs
where fx_rate is not null
group by 1
order by 1;

-- 14.2 Costo total del inventario disponible, en ambas monedas.
select round(sum(c.purchase_price), 2)     as costo_total_bob,
       round(sum(c.purchase_price_usd), 2)  as costo_total_usd
from products p
join product_costs c on c.product_id = p.id
where p.status = 'available';

-- 14.3 Ventas: ganancia en BOB y en USD (usa los snapshots de la venta).
select date_trunc('month', sold_at) as mes,
       round(sum(sold_price - cost), 2)                                  as ganancia_bob,
       round(sum((sold_price / nullif(fx_rate,0)) - cost_usd), 2)        as ganancia_usd_aprox,
       round(avg(fx_rate), 4)                                            as fx_venta_prom
from sales
group by 1
order by 1;

-- 14.4 Productos más vistos (ranking de clicks).
select name, faction, status, clicks
from products
order by clicks desc
limit 10;

-- 14.5 Conversión clicks -> venta (qué tan "efectivo" es cada producto).
select name, clicks, status,
       case when clicks > 0 and status = 'sold' then round(100.0 / clicks, 2) end as pct_conversion
from products
order by clicks desc;
```

---

## 15. Fuera del SQL (configurar en el panel de Supabase)

- **Auth → Providers → Google**: activar y pegar Client ID/Secret (OAuth de
  Google). El botón "Continuar con Google" del front se conecta aquí.
- **Auth → Email**: decidir si pides confirmación por correo.
- **Storage**: el bucket `product-images` se crea en §10; subir las fotos reales
  y reemplazar los placeholders.
- **Variables de entorno del front** (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y el número real de WhatsApp.
- **Contrato de metadata en signUp:** al registrarse, el front debe pasar
  `options.data = { name, legion, provider, phone, department }` para que el
  trigger 8.3 llene el perfil.

---

> **Siguiente paso:** ejecuta [`docs/supabase-schema.sql`](./supabase-schema.sql)
> en el SQL Editor, hazte admin (§7) y configura el panel (§15). Luego
> **conectamos el código** (cliente Supabase + reemplazar los helpers mock de
> `lib/data.ts`, `lib/admin-store.tsx` y `lib/account-context.tsx`).

---

## 16. Post-venta: envío, confirmación de entrega y reseñas (2026-07-16)

> Migración añadida al final de `supabase-schema.sql`. Resumen — ver el script
> para el SQL completo.

- **`sales`** gana columnas: `user_id` (cliente registrado, opcional — lo elige el
  admin al registrar la venta), `delivery_status` (`pendiente` → `enviado` →
  `entregado`), `shipping_department`, `shipping_note`, `shipped_at`, `delivered_at`.
- **`product_reviews`** (nueva): reseña 1-5 estrellas + comentario, ligada 1:1 a
  una venta (`sale_id` único). `user_id` es **nullable** — queda `null` cuando la
  carga el admin a nombre de un comprador sin cuenta. `submitted_by`
  (`customer`/`admin`) es solo referencia interna, **nunca se muestra** en el
  front público (las reseñas cargadas por el admin se ven igual que las reales).
- **Vista `product_ratings`**: promedio y conteo de reseñas por producto, para la
  ficha pública.
- **RPCs nuevas** (todas `security definer`, mismo patrón que `mark_product_sold`):
  - `mark_sale_shipped(sale_id, depto?, nota?)` — admin marca envío.
  - `confirm_delivery(sale_id)` — el cliente confirma que le llegó (desde su cuenta).
  - `submit_product_review(sale_id, rating, comment?)` — el cliente califica una
    compra ya entregada (una vez por venta).
  - `admin_submit_product_review(sale_id, rating, comment?, reviewer_name?)` —
    el admin carga una reseña aproximada a nombre de un comprador (típicamente
    sin cuenta); no exige `delivery_status = 'entregado'`.
  - `mark_product_sold` se redefine para aceptar `p_user_id` opcional.
- **RLS**: `sales` gana policy de lectura propia (`auth.uid() = user_id`, "Mis
  compras" en `/cuenta`); `product_reviews` es de lectura pública + gestión
  admin. Las mutaciones de cliente (confirmar entrega, calificar) no necesitan
  policy de UPDATE/INSERT propia porque van por RPC `security definer`.

### 16.1 Moderación de reseñas (2026-07-16 b)

- **`product_reviews`** gana `hidden` (admin oculta una reseña de la ficha
  pública sin borrarla — mismo patrón que `sales.hidden`) y `admin_seen`
  (el "visto" de la bandeja de moderación).
- **`product_ratings`** ahora excluye las ocultas del promedio.
- **RLS**: lectura pública solo `not hidden`; el autor (`auth.uid() = user_id`)
  siempre ve la suya, esté oculta o no — así puede seguir viéndola en "Mis
  compras" aunque el admin la haya ocultado del resto. El admin ya tenía
  acceso total (policy "admin gestiona resenas"), así que ocultar/mostrar y
  marcar "visto" son `update` directos, sin RPC nueva.
- **Aviso al admin**: sin email/push — es un badge dentro del panel
  (`/admin/resenas` + sidebar + dashboard) que cuenta reseñas de ≤3★ con
  `admin_seen = false`. Se limpia cuando el admin abre esa página.
