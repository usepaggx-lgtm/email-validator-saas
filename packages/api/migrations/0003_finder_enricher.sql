CREATE TABLE IF NOT EXISTS user_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'finder',
  monthly_limit INTEGER NOT NULL DEFAULT 100,
  used INTEGER NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  UNIQUE(user_id, feature, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS finder_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  result TEXT DEFAULT '',
  email_found TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enricher_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  title TEXT DEFAULT '',
  result TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id, feature, month);
CREATE INDEX IF NOT EXISTS idx_finder_queries_user ON finder_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_enricher_queries_user ON enricher_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_enricher_queries_email ON enricher_queries(email);
