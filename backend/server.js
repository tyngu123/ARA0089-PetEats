require('dotenv').config();

const { createApp } = require('./app');
const { createPool } = require('./db');

const port = Number(process.env.PORT) || 3000;

const start = async () => {
  const pool = createPool();

  try {
    await pool.query('SELECT id FROM petshops LIMIT 1');
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
