const mysql = require('mysql2/promise');

const connectionOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '27115728',
};

const createPool = () =>
  mysql.createPool({
    ...connectionOptions,
    database: 'peteats',
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 5000,
  });

module.exports = { connectionOptions, createPool };
