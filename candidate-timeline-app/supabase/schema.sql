-- Database for the candidate education & work timeline app.
-- Run once in your Supabase project: SQL Editor → New query → paste → Run.

create extension if not exists pgcrypto;

-- One row per candidate.
--   profile = everything the candidate entered (entries, confirmations, audit log)
--   review  = everything executives decided (corrections, accepted warnings, approval)
-- Keeping them in separate columns means the two sides never overwrite each other.
create table if not exists public.candidates (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,          -- secret part of the candidate's link
  full_name   text not null default '',
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  profile     jsonb not null default '{}'::jsonb,
  review      jsonb not null default '{}'::jsonb
);

create index if not exists candidates_updated_at_idx on public.candidates (updated_at desc);

-- Institutions / schools / hospitals verified by executives.
-- Grows with every reviewed profile, so future candidates can simply select them.
create table if not exists public.organizations (
  id          text primary key,
  kind        text not null check (kind in ('institution', 'school', 'facility')),
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- Lock both tables: only the server (service key) can read or write.
-- The browser never talks to the database directly.
alter table public.candidates enable row level security;
alter table public.organizations enable row level security;

-- Private bucket for optional diploma photos / PDFs.
insert into storage.buckets (id, name, public)
values ('candidate-documents', 'candidate-documents', false)
on conflict (id) do nothing;
