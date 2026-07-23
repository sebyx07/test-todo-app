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
