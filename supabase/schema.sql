
create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  adresse text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

create table if not exists public.bouteilles (
  id uuid primary key default gen_random_uuid(),
  format_kg integer not null check (format_kg in (6, 12)),
  quantite integer not null default 0 check (quantite >= 0),
  emplacement text not null default 'Entreprise',
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

create table if not exists public.chauffeurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  camion text,
  capacite_bouteilles integer not null default 0
    check (capacite_bouteilles >= 0),
  format_kg integer check (format_kg in (6, 12)),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

create table if not exists public.rations (
  id uuid primary key default gen_random_uuid(),
  date_travail date not null,
  nom_travailleur text not null,
  present boolean not null default false,
  montant_fcfa integer not null default 500
    check (montant_fcfa >= 0),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  unique (date_travail, nom_travailleur, created_by)
);

create table if not exists public.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  date_mouvement date not null default current_date,
  format_kg integer not null check (format_kg in (6, 12)),
  quantite integer not null check (quantite > 0),
  type_mouvement text not null
    check (type_mouvement in ('entree', 'sortie', 'retour', 'ajustement')),
  motif text,
  client_id uuid references public.clients(id),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

create table if not exists public.livraisons (
  id uuid primary key default gen_random_uuid(),
  date_livraison date not null default current_date,
  client_id uuid references public.clients(id),
  format_kg integer not null check (format_kg in (6, 12)),
  quantite integer not null check (quantite > 0),
  prix_unitaire_fcfa integer not null check (prix_unitaire_fcfa >= 0),
  montant_total_fcfa integer generated always as
    (quantite * prix_unitaire_fcfa) stored,
  observations text,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

create table if not exists public.operations_comptables (
  id uuid primary key default gen_random_uuid(),
  date_operation date not null default current_date,
  categorie text not null,
  libelle text not null,
  type_operation text not null
    check (type_operation in ('recette', 'depense')),
  montant_fcfa integer not null check (montant_fcfa >= 0),
  mode_paiement text,
  reference text,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid()
);

alter table public.clients enable row level security;
alter table public.bouteilles enable row level security;
alter table public.chauffeurs enable row level security;
alter table public.rations enable row level security;
alter table public.mouvements_stock enable row level security;
alter table public.livraisons enable row level security;
alter table public.operations_comptables enable row level security;

create policy "clients_owner_only"
on public.clients for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "bouteilles_owner_only"
on public.bouteilles for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "chauffeurs_owner_only"
on public.chauffeurs for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "rations_owner_only"
on public.rations for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "mouvements_stock_owner_only"
on public.mouvements_stock for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "livraisons_owner_only"
on public.livraisons for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "operations_comptables_owner_only"
on public.operations_comptables for all to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

grant usage on schema public to authenticated;
grant select, insert, update, delete
on public.clients, public.bouteilles, public.chauffeurs,
   public.rations, public.mouvements_stock, public.livraisons,
   public.operations_comptables
to authenticated;

