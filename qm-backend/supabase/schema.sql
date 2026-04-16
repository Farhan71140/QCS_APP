-- ─────────────────────────────────────────────────────────────
-- QM WorkForce OS — Supabase Schema
-- Run this in: supabase.com → Your Project → SQL Editor → New Query → Paste → Run
-- ─────────────────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT CHECK (role IN ('admin','supervisor','teamleader','participant')) DEFAULT 'participant',
  employee_id TEXT UNIQUE,
  phone       TEXT,
  supervisor_id UUID REFERENCES users(id),
  is_active   BOOLEAN DEFAULT true,
  is_flagged  BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  status      TEXT CHECK (status IN ('Present','Late','Absent','Half Day','On Leave')) DEFAULT 'Absent',
  hours_worked NUMERIC(5,2) DEFAULT 0,
  marked_by   UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(worker_id, date)
);

CREATE TABLE production (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  task_type        TEXT NOT NULL,
  hours_worked     NUMERIC(5,2) NOT NULL,
  units_completed  INTEGER NOT NULL,
  notes            TEXT,
  status           TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reviewed_by      UUID REFERENCES users(id),
  is_fraud_flagged BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE qc_checks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_by   UUID REFERENCES users(id),
  task_type      TEXT NOT NULL,
  samples_checked INTEGER NOT NULL,
  samples_passed  INTEGER NOT NULL,
  score          NUMERIC(5,2) NOT NULL,
  status         TEXT CHECK (status IN ('pass','warning','fail')) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  month        INTEGER NOT NULL,
  year         INTEGER NOT NULL,
  base_amount  NUMERIC(10,2) DEFAULT 15000,
  bonus        NUMERIC(10,2) DEFAULT 0,
  deduction    NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status       TEXT CHECK (status IN ('paid','pending','failed')) DEFAULT 'paid',
  notes        TEXT,
  processed_by UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(worker_id, month, year)
);
