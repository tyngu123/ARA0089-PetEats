// Pool "falso" que imita o mysql2 usando SQLite em memória (Node 22.5+).
// Usado apenas nos testes automatizados, para não precisar de um MySQL rodando.
const { DatabaseSync } = require('node:sqlite');

const translate = (sql) =>
  sql
    .replace(/INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/\)\s*ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4/g, ')')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/INSERT IGNORE/g, 'INSERT OR IGNORE');

const toParam = (value) =>
  value === undefined ? null : typeof value === 'boolean' ? (value ? 1 : 0) : value;

const createSqlitePool = () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  const query = async (sql, params = []) => {
    if (/information_schema\.COLUMNS/i.test(sql)) {
      return [db.prepare('PRAGMA table_info(petshops)').all().map((column) => ({ name: column.name }))];
    }
    const statement = db.prepare(translate(sql));
    const values = params.map(toParam);
    if (/^\s*SELECT/i.test(sql)) return [statement.all(...values).map((row) => ({ ...row }))];
    const result = statement.run(...values);
    return [{ insertId: Number(result.lastInsertRowid), affectedRows: Number(result.changes) }];
  };

  const connection = {
    query,
    beginTransaction: async () => db.exec('BEGIN'),
    commit: async () => db.exec('COMMIT'),
    rollback: async () => db.exec('ROLLBACK'),
    release() {},
  };

  return { query, getConnection: async () => connection, end: async () => db.close() };
};

module.exports = { createSqlitePool };
