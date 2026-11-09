require('dotenv').config();

const { createPool } = require('./db');
const { prepareDatabase } = require('./database');

const setup = async () => {
  const pool = createPool();
  try {
    await prepareDatabase(pool, { seed: process.env.SEED_DEMO !== 'false' });
    console.log('Banco PetEats preparado (tabelas e contas de demonstração).');
  } catch (error) {
    console.error('Falha ao preparar o banco MySQL:', error.code || error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

setup();
