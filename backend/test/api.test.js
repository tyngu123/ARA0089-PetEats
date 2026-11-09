const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const { createApp } = require('../app');
const { prepareDatabase } = require('../database');
const { createSqlitePool } = require('./sqlite-pool');

let server;
let baseUrl;
let pool;

const api = async (method, path, body, token) => {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};

before(async () => {
  pool = createSqlitePool();
  await prepareDatabase(pool, { createDatabase: false });
  await prepareDatabase(pool, { createDatabase: false }); // rodar duas vezes não duplica nada
  server = createApp(pool).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('lista a loja Casa do Bicho no formato do app', async () => {
  const { status, body } = await api('GET', '/api/petshops');
  assert.equal(status, 200);
  assert.equal(body.petshops.length, 1);
  assert.deepEqual(
    { ...body.petshops[0], address: undefined },
    {
      id: 'casa-do-bicho',
      name: 'Casa do Bicho',
      category: 'Rações e acessórios',
      neighborhood: 'Centro',
      address: undefined,
      rating: '4,8',
      deliveryTime: '25–35 min',
      deliveryFee: 'R$\u00a04,90',
      deliveryFeeValue: 4.9,
    }
  );
  const products = await api('GET', '/api/petshops/casa-do-bicho/products');
  assert.equal(products.body.products.length, 4);
  const all = await api('GET', '/api/products');
  assert.equal(all.body.products.length, 4);
  assert.equal(all.body.products[0].petshop.name, 'Casa do Bicho');
});

test('fluxo completo: empresa cadastra, cliente pede, empresa aceita e envia', async () => {
  const company = await api('POST', '/api/auth/register', {
    role: 'empresa', name: 'Ana', username: 'petfeliz', password: '123456',
    storeName: 'Pet Feliz', neighborhood: 'Icaraí', address: 'Rua A, 1', deliveryFee: '4,50',
  });
  assert.equal(company.status, 201);
  const shopId = company.body.shop.id;

  const product = await api('POST', '/api/my/products',
    { name: 'Ração 1 kg', category: 'Ração cães', price: '25,90' }, company.body.token);
  assert.equal(product.body.product.price, 25.9);

  const customer = await api('POST', '/api/auth/register', {
    role: 'cliente', name: 'Maria', username: 'maria', password: '123456', address: 'Rua B, 2',
  });
  assert.equal(customer.status, 201);

  const order = await api('POST', '/api/orders', {
    petshopId: shopId,
    items: [{ productId: product.body.product.id, quantity: 2 }],
    address: 'Rua B, 2',
    paymentMethod: 'Pix na entrega',
  }, customer.body.token);
  assert.equal(order.status, 201);
  assert.equal(order.body.order.total, 56.3);
  assert.equal(order.body.order.status, 'pendente');
  assert.equal(order.body.order.deliveryTime, '30–50 min');
  const id = order.body.order.id;

  const received = await api('GET', '/api/orders', null, company.body.token);
  assert.equal(received.body.orders[0].customerName, 'Maria');

  assert.equal((await api('PATCH', `/api/orders/${id}/status`, { status: 'enviado' }, company.body.token)).status, 409);
  assert.equal((await api('PATCH', `/api/orders/${id}/status`, { status: 'aceito' }, company.body.token)).body.order.status, 'aceito');
  assert.equal((await api('PATCH', `/api/orders/${id}/status`, { status: 'enviado' }, company.body.token)).body.order.status, 'enviado');

  const seen = await api('GET', `/api/orders/${id}`, null, customer.body.token);
  assert.equal(seen.body.order.status, 'enviado');

  const other = await api('POST', '/api/auth/login', { username: 'casadobicho', password: '123456' });
  assert.equal((await api('GET', `/api/orders/${id}`, null, other.body.token)).status, 404);
});

test('recusa credenciais inválidas e usuário repetido', async () => {
  assert.equal((await api('POST', '/api/auth/login', { username: 'casadobicho', password: 'x' })).status, 401);
  const repeated = await api('POST', '/api/auth/register', {
    role: 'cliente', name: 'Outro', username: 'maria', password: '123456', address: 'Rua C',
  });
  assert.equal(repeated.status, 409);
});

test('remove as lojas e a conta de demonstração antigas', async () => {
  const old = createSqlitePool();
  await prepareDatabase(old, { createDatabase: false });
  await old.query(
    `INSERT INTO petshops (id, name, category, neighborhood, rating, delivery_min_minutes,
       delivery_max_minutes, delivery_fee, sort_order, owner_user_id)
     VALUES ('patas-e-racoes', 'Patas', 'x', 'y', 4.7, 30, 40, 5.9, 2, 1)`
  );
  await old.query(
    `INSERT INTO users (role, name, username, password_hash) VALUES ('cliente', 'Demo', 'cliente', 'x')`
  );
  await prepareDatabase(old, { createDatabase: false });
  const [shops] = await old.query('SELECT id FROM petshops WHERE is_active = TRUE');
  assert.deepEqual(shops.map((shop) => shop.id), ['casa-do-bicho']);
  const [users] = await old.query("SELECT id FROM users WHERE username = 'cliente'");
  assert.equal(users.length, 0);
  await old.end();
});

test('não devolve dados fictícios quando o banco falha', async () => {
  const failing = createApp({ query: async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }); } });
  const temp = failing.listen(0, '127.0.0.1');
  await new Promise((resolve) => temp.once('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${temp.address().port}/api/petshops`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.petshops, undefined);
  await new Promise((resolve) => temp.close(resolve));
});
