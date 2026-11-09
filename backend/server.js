require('dotenv').config();

const { createApp } = require('./app');
const { createPool } = require('./db');
const { prepareDatabase } = require('./database');

const port = Number(process.env.PORT) || 3000;

const start = async () => {
  const pool = createPool();

  try {
    // Cria as tabelas (se ainda não existirem) e as contas de demonstração.
    await prepareDatabase(pool, { seed: process.env.SEED_DEMO !== 'false' });
    const app = createApp(pool);

    app.listen(port, '0.0.0.0', () => {
      console.log(`API PetEats disponível na porta ${port}`);
    });
  } catch (error) {
    console.error('Não foi possível iniciar a API com MySQL:', error.code || error.message);
    await pool.end();
    process.exitCode = 1;
  }
};

start();
