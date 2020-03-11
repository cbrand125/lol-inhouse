DROP INDEX IF EXISTS sessions_cookie_idx;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS pgcrypto;
---
CREATE EXTENSION pgcrypto;
---
CREATE TABLE users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  create_date DATE NOT NULL DEFAULT CURRENT_DATE,
  first_name TEXT,
  last_name TEXT
);
---
CREATE TABLE tournaments (
  name TEXT NOT NULL PRIMARY KEY,
  creator_id UUID REFERENCES users
);
---
CREATE TABLE sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users,
  key TEXT NOT NULL DEFAULT gen_salt('md5'),
  create_date DATE NOT NULL DEFAULT CURRENT_DATE
);
---
CREATE INDEX sessions_cookie_idx ON sessions(
  (
    id || '-' || encode(hmac(id :: text, key, 'sha256'), 'hex')
  )
);
---
DROP TABLE IF EXISTS game_data;
---
CREATE TABLE game_data (
  player TEXT NOT NULL,
  game_id TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  PRIMARY KEY(player, game_id, tournament_name),
  kills SMALLINT,
  deaths SMALLINT,
  assists SMALLINT,
  champ TEXT,
  position TEXT,
  win BOOLEAN
);