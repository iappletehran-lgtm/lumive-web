-- Lumive AI — bookings for the AUTOMATED NOWPayments checkout (/book).
-- Replaces the earlier manual-TXID bookings table. A booking is created
-- (status 'waiting') when a visitor submits the /book form and we open a
-- NOWPayments invoice; the NOWPayments IPN webhook then advances payment_status
-- and, on 'confirmed', emails the Cal.com booking link.
--
-- Safe to run as-is: the old bookings table holds no real data, so we drop and
-- recreate it to the new shape. RLS is enabled with NO policies → only the
-- service_role key (server-side) can read/write; payment records stay admin-only.

create extension if not exists pgcrypto;

drop table if exists public.bookings cascade;

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  full_name        text,
  email            text,
  preferred_times  text,
  payment_id       text,                       -- NOWPayments payment id
  payment_status   text not null default 'waiting'
                   check (payment_status in ('waiting', 'confirming', 'confirmed', 'failed')),
  booking_link     text,                       -- Cal.com link emailed after confirmation (nullable)
  created_at       timestamptz not null default now()
);

create index bookings_payment_id_idx on public.bookings (payment_id);
create index bookings_status_created_idx on public.bookings (payment_status, created_at desc);

-- Lock the table down: RLS on, no policies → service_role only.
alter table public.bookings enable row level security;
