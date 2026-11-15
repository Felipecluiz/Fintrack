-- 004-auth: contas de usuário e dono de cada registro.

CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,          -- sempre em minúsculas (BR-401)
  password_hash  TEXT NOT NULL,          -- PBKDF2, nunca a senha (BR-403)
  created_at     TEXT NOT NULL
);

CREATE UNIQUE INDEX ux_users_email ON users (email);

-- Linhas criadas antes desta migration ficam com user_id NULL: nenhum usuário
-- as enxerga. O seed de demonstração as adota para a conta demo.
ALTER TABLE categories   ADD COLUMN user_id TEXT REFERENCES users (id);
ALTER TABLE transactions ADD COLUMN user_id TEXT REFERENCES users (id);

-- BR-102 passa a valer por usuário: dois usuários podem ter "Mercado".
DROP INDEX ux_categories_name_type;
CREATE UNIQUE INDEX ux_categories_user_name_type ON categories (user_id, name COLLATE NOCASE, type);

CREATE INDEX ix_transactions_user_occurred_on ON transactions (user_id, occurred_on DESC, created_at DESC);
CREATE INDEX ix_transactions_user_category ON transactions (user_id, category_id);
