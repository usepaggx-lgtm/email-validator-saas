CREATE TABLE IF NOT EXISTS credit_balance (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('purchase','deduction','refund','bonus','admin_adjust')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT DEFAULT '',
  reference_type TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON credit_transactions(created_at);

CREATE TABLE IF NOT EXISTS product_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL DEFAULT 'consultas',
  api_group TEXT NOT NULL,
  dataset_key TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  base_price REAL NOT NULL,
  credit_cost INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product, api_group, dataset_key)
);

CREATE TABLE IF NOT EXISTS consultas_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  api_group TEXT NOT NULL,
  dataset TEXT NOT NULL,
  query_text TEXT NOT NULL,
  credit_cost INTEGER NOT NULL,
  response_status TEXT NOT NULL DEFAULT 'success',
  bigdatacorp_query_id TEXT DEFAULT '',
  elapsed_ms INTEGER DEFAULT 0,
  response_preview TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_consultas_user ON consultas_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_consultas_created ON consultas_queries(created_at);
