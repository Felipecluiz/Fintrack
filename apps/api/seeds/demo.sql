-- Conta de demonstração e dados de exemplo.
--   Local:    npm run db:seed:local -w @fintrack/api
--   Produção: npm run db:seed:remote -w @fintrack/api
--
-- Login: demo@fintrack.dev / demo1234
-- As datas são relativas ao mês atual (últimos 6 meses). Rodar de novo
-- recria as transações de exemplo com datas atualizadas.

INSERT INTO users (id, name, email, password_hash, created_at) VALUES
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Conta Demo', 'demo@fintrack.dev', 'pbkdf2-sha256$100000$P0aX3XW+nZjv2wXZ4gJYNg==$uwOhn5dZsKzcAi512OF/WRhQuF7rLwAw5OP4h2jastc=', datetime('now'))
ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash;

-- Registros criados antes da 0002_users (sem dono) passam a ser da conta demo.
UPDATE categories   SET user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' WHERE user_id IS NULL;
UPDATE transactions SET user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' WHERE user_id IS NULL;

INSERT INTO categories (id, user_id, name, type, created_at, updated_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário',    'income',  datetime('now'), datetime('now')),
  ('22222222-2222-4222-8222-222222222222', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Freelance',  'income',  datetime('now'), datetime('now')),
  ('33333333-3333-4333-8333-333333333333', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Moradia',    'expense', datetime('now'), datetime('now')),
  ('44444444-4444-4444-8444-444444444444', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Mercado',    'expense', datetime('now'), datetime('now')),
  ('55555555-5555-4555-8555-555555555555', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Transporte', 'expense', datetime('now'), datetime('now')),
  ('66666666-6666-4666-8666-666666666666', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Lazer',      'expense', datetime('now'), datetime('now'))
ON CONFLICT (id) DO NOTHING;

-- Recria as transações de exemplo da conta demo.
DELETE FROM transactions WHERE user_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND id LIKE 'aaaaaaaa-0000-4000-8000-%';

INSERT INTO transactions (id, user_id, description, amount_cents, type, category_id, occurred_on, created_at, updated_at) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-5 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Projeto freelance', 120000, 'income', '22222222-2222-4222-8222-222222222222', date('now', 'start of month', '-5 months', '+17 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-5 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 82000, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-5 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 21000, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-5 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 34000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-5 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000007', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 15000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-5 months', '+25 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-4 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000009', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-4 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 85500, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-4 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000011', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 22200, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-4 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000012', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 38000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-4 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000013', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 24000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-4 months', '+25 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000014', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-3 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000015', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Projeto freelance', 150000, 'income', '22222222-2222-4222-8222-222222222222', date('now', 'start of month', '-3 months', '+17 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000016', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-3 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000017', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 89000, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-3 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000018', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 23400, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-3 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000019', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 42000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-3 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000020', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 33000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-3 months', '+25 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000021', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-2 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000022', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-2 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000023', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 92500, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-2 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000024', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 24600, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-2 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000025', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 34000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-2 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000026', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 42000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-2 months', '+25 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000027', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-1 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000028', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Projeto freelance', 180000, 'income', '22222222-2222-4222-8222-222222222222', date('now', 'start of month', '-1 months', '+17 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000029', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-1 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000030', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 96000, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-1 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000031', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 25800, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-1 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000032', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 38000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-1 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000033', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 15000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-1 months', '+25 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000034', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salário', 650000, 'income', '11111111-1111-4111-8111-111111111111', date('now', 'start of month', '-0 months', '+4 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000035', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Aluguel', 180000, 'expense', '33333333-3333-4333-8333-333333333333', date('now', 'start of month', '-0 months', '+9 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000036', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Supermercado', 99500, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-0 months', '+7 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000037', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Feira e padaria', 27000, 'expense', '44444444-4444-4444-8444-444444444444', date('now', 'start of month', '-0 months', '+21 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000038', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Combustível', 42000, 'expense', '55555555-5555-4555-8555-555555555555', date('now', 'start of month', '-0 months', '+11 days'), datetime('now'), datetime('now')),
  ('aaaaaaaa-0000-4000-8000-000000000039', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Cinema e jantar', 24000, 'expense', '66666666-6666-4666-8666-666666666666', date('now', 'start of month', '-0 months', '+25 days'), datetime('now'), datetime('now'));
