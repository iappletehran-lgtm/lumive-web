-- Lumive AI — consultation bookings (crypto-paid strategy calls).
-- A booking is created (status 'pending') when a visitor submits the /book form
-- with their USDT-TRC20 transaction hash. An admin verifies the TXID on-chain,
-- then confirms (emails the Cal.com link) or rejects.
--
-- RLS: enabled with NO policies, so anon and authenticated users get nothing.
-- Only the service_role key (server-side admin/API) can read or write — it
-- bypasses RLS entirely. This keeps payment records admin-only.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  full_name        text,
  email            text,
  txid             text,            -- USDT-TRC20 transaction hash, verified manually
  preferred_times  text,
  booking_link     text,            -- Cal.com link an admin pastes on confirm; emailed to the payer
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'rejected')),
  created_at       timestamptz not null default now()
);

-- Idempotent: if an earlier version of this table already exists, add the column.
alter table public.bookings add column if not exists booking_link text;

create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at desc);

-- Lock the table down: RLS on, no policies → service_role only.
alter table public.bookings enable row level security;
