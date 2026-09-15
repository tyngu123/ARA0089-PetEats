require('dotenv').config();

const { readFileSync } = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const { connectionOptions } = require('./db');

const setup = async () => {
  const sql = readFileSync(path.join(__dirname, '..', 'database', 'setup.sql'), 'utf8');
  let connection;

  try {
    connection = await mysql.createConnection({
      ...connectionOptions,
      multipleStatements: true,
      connectTimeout: 5000,
    });

    await connection.query(sql);
    console.log('Banco peteats e petshops de demonstração preparados.');
  } catch (error) {
    console.error('Falha ao preparar o banco MySQL:', error.code || error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setup();
