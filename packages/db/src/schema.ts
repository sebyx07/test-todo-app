// SQLite schema for @todo/db — table/column name constants + the DDL string.
// Pure module: no imports (no bun:sqlite, no @todo/domain) so it can be reused by migrations.

export const TODOS_TABLE = 'todos';

export const COLUMN_ID = 'id';
export const COLUMN_TITLE = 'title';
export const COLUMN_COMPLETED = 'completed';
export const COLUMN_CREATED_AT = 'created_at';
export const COLUMN_UPDATED_AT = 'updated_at';

export const CREATE_TODOS_SQL = `CREATE TABLE IF NOT EXISTS ${TODOS_TABLE} (
  ${COLUMN_ID} TEXT PRIMARY KEY,
  ${COLUMN_TITLE} TEXT NOT NULL,
  ${COLUMN_COMPLETED} INTEGER NOT NULL DEFAULT 0,
  ${COLUMN_CREATED_AT} TEXT NOT NULL,
  ${COLUMN_UPDATED_AT} TEXT NOT NULL
);`;

export const USERS_TABLE = 'users';
export const SESSIONS_TABLE = 'sessions';

export const COLUMN_EMAIL = 'email';
export const COLUMN_PASSWORD_HASH = 'password_hash';
export const COLUMN_ROLE = 'role';
export const COLUMN_TOKEN = 'token';
export const COLUMN_USER_ID = 'user_id';
export const COLUMN_EXPIRES_AT = 'expires_at';

export const CREATE_USERS_SQL = `CREATE TABLE IF NOT EXISTS ${USERS_TABLE} (
  ${COLUMN_ID} TEXT PRIMARY KEY,
  ${COLUMN_EMAIL} TEXT NOT NULL UNIQUE,
  ${COLUMN_PASSWORD_HASH} TEXT NOT NULL,
  ${COLUMN_ROLE} TEXT NOT NULL DEFAULT 'user',
  ${COLUMN_CREATED_AT} TEXT NOT NULL,
  ${COLUMN_UPDATED_AT} TEXT NOT NULL
);`;

export const CREATE_SESSIONS_SQL = `CREATE TABLE IF NOT EXISTS ${SESSIONS_TABLE} (
  ${COLUMN_TOKEN} TEXT PRIMARY KEY,
  ${COLUMN_USER_ID} TEXT NOT NULL,
  ${COLUMN_EXPIRES_AT} TEXT NOT NULL,
  ${COLUMN_CREATED_AT} TEXT NOT NULL,
  FOREIGN KEY (${COLUMN_USER_ID}) REFERENCES ${USERS_TABLE}(${COLUMN_ID})
);`;
