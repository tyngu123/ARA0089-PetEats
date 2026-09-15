const express = require('express');
const cors = require('cors');

const petshopsQuery = `
  SELECT id, name, category, neighborhood, rating,
         delivery_min_minutes, delivery_max_minutes, delivery_fee
  FROM petshops
  WHERE is_active = TRUE
  ORDER BY sort_order ASC, id ASC
  LIMIT 3
`;

const formatShop = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  neighborhood: row.neighborhood,
  rating: Number(row.rating).toFixed(1).replace('.', ','),
  deliveryTime: `${row.delivery_min_minutes}–${row.delivery_max_minutes} min`,
  deliveryFee: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(row.delivery_fee)),
});

const createApp = (pool) => {
  const app = express();

  app.use(cors());

  app.get('/api/petshops', async (_request, response) => {
    try {
      const [rows] = await pool.query(petshopsQuery);
      response.json({ petshops: rows.slice(0, 3).map(formatShop) });
    } catch (error) {
      console.error('Falha ao consultar petshops no MySQL:', error.code || error.message);
      response.status(503).json({ error: 'Petshops indisponíveis no momento.' });
    }
  });

  return app;
};

module.exports = { createApp, petshopsQuery };
