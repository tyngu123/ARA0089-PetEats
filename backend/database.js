const { readFileSync } = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const { connectionOptions, database } = require('./db');
const { hashPassword } = require('./auth');

const schemaPath = path.join(__dirname, '..', 'database', 'setup.sql');

const splitStatements = (sql) =>
  sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

// Cria o banco (se o usuário tiver permissão) antes de abrir o pool.
const createDatabaseIfMissing = async () => {
  const connection = await mysql.createConnection({ ...connectionOptions, connectTimeout: 10000 });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
};

const runSchema = async (pool) => {
  for (const statement of splitStatements(readFileSync(schemaPath, 'utf8'))) {
    await pool.query(statement);
  }
};

// Bancos criados pela versão anterior do projeto não tinham estas colunas.
const migrate = async (pool) => {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'petshops'`
  );
  const names = new Set(columns.map((column) => column.name || column.COLUMN_NAME));
  if (!names.has('owner_user_id')) {
    await pool.query('ALTER TABLE petshops ADD COLUMN owner_user_id INT UNSIGNED NULL');
  }
  if (!names.has('address')) {
    await pool.query('ALTER TABLE petshops ADD COLUMN address VARCHAR(255) NULL');
  }
};

const demoCompanies = [
  {
    shopId: 'casa-do-bicho',
    username: 'casadobicho',
    name: 'Casa do Bicho',
    address: 'Rua da Conceição, 100 – Centro, Niterói',
    products: [
      ['Ração Adulto Carne 10,1 kg', 'Ração cães', 'Ração premium para cães adultos', 139.9],
      ['Ração Filhote Frango 3 kg', 'Ração cães', 'Para filhotes de porte pequeno e médio', 59.9],
      ['Ração Gatos Castrados Salmão 3 kg', 'Ração gatos', 'Controle de peso para gatos castrados', 79.9],
      ['Petisco Ossinho Natural 200 g', 'Petiscos', 'Ossinho natural para cães', 18.5],
    ],
  },
];

// Loja Casa do Bicho já cadastrada (empresa: casadobicho / senha 123456).
const seedDemo = async (pool) => {
  const password = hashPassword('123456');

  for (const company of demoCompanies) {
    const [shops] = await pool.query('SELECT id, owner_user_id FROM petshops WHERE id = ?', [
      company.shopId,
    ]);
    if (shops.length === 0) continue;

    if (!shops[0].owner_user_id) {
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [
        company.username,
      ]);
      let ownerId = existing[0]?.id;
      if (!ownerId) {
        const [result] = await pool.query(
          `INSERT INTO users (role, name, username, password_hash, phone, address)
           VALUES ('empresa', ?, ?, ?, NULL, ?)`,
          [company.name, company.username, password, company.address]
        );
        ownerId = result.insertId;
      }
      await pool.query('UPDATE petshops SET owner_user_id = ?, address = ? WHERE id = ?', [
        ownerId,
        company.address,
        company.shopId,
      ]);
    }

    const [count] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE petshop_id = ?', [
      company.shopId,
    ]);
    if (Number(count[0].total) === 0) {
      for (const [name, category, description, price] of company.products) {
        await pool.query(
          'INSERT INTO products (petshop_id, name, category, description, price) VALUES (?, ?, ?, ?, ?)',
          [company.shopId, name, category, description, price]
        );
      }
    }
  }

};

// Versões anteriores criavam outras lojas e uma conta "cliente" de demonstração.
// Aqui elas são retiradas do app (pedidos já feitos continuam no histórico).
const removeOldDemo = async (pool) => {
  const oldShops = ['patas-e-racoes', 'aumiau-market'];
  await pool.query(
    `UPDATE petshops SET is_active = FALSE, owner_user_id = NULL WHERE id IN (${oldShops.map(() => '?').join(', ')})`,
    oldShops
  );
  for (const username of ['patas', 'aumiau', 'cliente']) {
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) continue;
    const [orders] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?', [users[0].id]);
    await pool.query('DELETE FROM sessions WHERE user_id = ?', [users[0].id]);
    if (Number(orders[0].total) === 0) {
      await pool.query('DELETE FROM users WHERE id = ?', [users[0].id]);
    }
  }
};

const prepareDatabase = async (pool, { createDatabase = true, seed = true } = {}) => {
  if (createDatabase) {
    try {
      await createDatabaseIfMissing();
    } catch (error) {
      // Alguns provedores não permitem CREATE DATABASE; nesse caso usamos o banco existente.
      console.warn('Aviso ao criar o banco:', error.code || error.message);
    }
  }
  await runSchema(pool);
  await migrate(pool);
  await removeOldDemo(pool);
  if (seed) await seedDemo(pool);
};

module.exports = { prepareDatabase, runSchema, migrate, seedDemo, splitStatements, schemaPath };
