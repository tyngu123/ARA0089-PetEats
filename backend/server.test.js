const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const { createApp } = require('./app');

const rows = [
  {
    id: 'casa-do-bicho',
    name: 'Casa do Bicho',
    category: 'Rações e acessórios',
    neighborhood: 'Centro',
    rating: '4.8',
    delivery_min_minutes: 25,
    delivery_max_minutes: 35,
    delivery_fee: '4.90',
  },
  {
    id: 'patas-e-racoes',
    name: 'Patas & Rações',
    category: 'Alimentos e petiscos',
    neighborhood: 'Jardim América',
    rating: '4.7',
    delivery_min_minutes: 30,
    delivery_max_minutes: 40,
    delivery_fee: '5.90',
  },
  {
    id: 'aumiau-market',
    name: 'AuMiau Market',
    category: 'Cuidados e brinquedos',
    neighborhood: 'Vila Nova',
    rating: '4.9',
    delivery_min_minutes: 35,
    delivery_max_minutes: 45,
    delivery_fee: '6.90',
  },
  {
    id: 'extra',
    name: 'Loja extra',
    category: 'Rações',
    neighborhood: 'Centro',
    rating: '4.0',
    delivery_min_minutes: 40,
    delivery_max_minutes: 50,
    delivery_fee: '7.00',
  },
];

let server;
let baseUrl;
let shouldFail = false;
let lastQuery;

const pool = {
  query: async (sql) => {
    lastQuery = sql;

    if (shouldFail) {
      const error = new Error('Banco indisponível');
      error.code = 'ECONNREFUSED';
      throw error;
    }

    return [rows];
  },
};

before(async () => {
  server = createApp(pool).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('consulta MySQL e lista no máximo três petshops no formato do app', async () => {
  const response = await fetch(`${baseUrl}/api/petshops`);
  const { petshops } = await response.json();

  assert.equal(response.status, 200);
  assert.match(lastQuery, /FROM petshops[\s\S]*LIMIT 3/i);
  assert.equal(petshops.length, 3);
  assert.deepEqual(petshops[0], {
    id: 'casa-do-bicho',
    name: 'Casa do Bicho',
    category: 'Rações e acessórios',
    neighborhood: 'Centro',
    rating: '4,8',
    deliveryTime: '25–35 min',
    deliveryFee: 'R$ 4,90',
  });
});

test('permite leitura da API pelo app web', async () => {
  const response = await fetch(`${baseUrl}/api/petshops`, {
    headers: { Origin: 'http://localhost:8081' },
  });

  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});

test('não devolve dados fictícios quando a consulta falha', async () => {
  shouldFail = true;

  const response = await fetch(`${baseUrl}/api/petshops`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.petshops, undefined);
  assert.equal(body.error, 'Petshops indisponíveis no momento.');

  shouldFail = false;
});
