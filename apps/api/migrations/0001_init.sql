-- 001-categories, 002-transactions
PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- BR-102: nome único por tipo, sem diferenciar maiúsculas/minúsculas.
CREATE UNIQUE INDEX ux_categories_name_type ON categories (name COLLATE NOCASE, type);

CREATE TABLE transactions (
  id            TEXT PRIMARY KEY,
  description   TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),            -- BR-201
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id   TEXT NOT NULL REFERENCES categories (id) ON DELETE RESTRICT, -- BR-104
  occurred_on   TEXT NOT NULL,                                         -- YYYY-MM-DD
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX ix_transactions_occurred_on ON transactions (occurred_on DESC, created_at DESC);
CREATE INDEX ix_transactions_category_id ON transactions (category_id);
