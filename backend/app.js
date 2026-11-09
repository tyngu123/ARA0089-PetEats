const express = require('express');
const cors = require('cors');

const { hashPassword, verifyPassword, newToken } = require('./auth');

const ORDER_STATUSES = ['pendente', 'aceito', 'recusado', 'enviado', 'entregue', 'cancelado'];
const PRODUCT_CATEGORIES = ['Ração cães', 'Ração gatos', 'Petiscos', 'Outros'];
const PAYMENT_METHODS = ['Pix na entrega', 'Cartão na entrega', 'Dinheiro'];

// Quem pode mudar o pedido para cada status, a partir de qual status.
const TRANSITIONS = {
  empresa: { aceito: ['pendente'], recusado: ['pendente'], enviado: ['aceito'], entregue: ['enviado'] },
  cliente: { cancelado: ['pendente'] },
};

const petshopsQuery = `
  SELECT id, name, category, neighborhood, rating,
         delivery_min_minutes, delivery_max_minutes, delivery_fee, address
  FROM petshops
  WHERE is_active = TRUE AND owner_user_id IS NOT NULL
  ORDER BY sort_order ASC, name ASC
  LIMIT 50
`;

const brl = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

const money = (value) => Math.round(Number(value) * 100) / 100;

const formatShop = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  neighborhood: row.neighborhood,
  address: row.address || null,
  rating: Number(row.rating).toFixed(1).replace('.', ','),
  deliveryTime: `${row.delivery_min_minutes}–${row.delivery_max_minutes} min`,
  deliveryFee: brl(row.delivery_fee),
  deliveryFeeValue: money(row.delivery_fee),
});

const formatUser = (row) => ({
  id: row.id,
  role: row.role,
  name: row.name,
  username: row.username,
  phone: row.phone || null,
  address: row.address || null,
});

const formatProduct = (row) => ({
  id: row.id,
  petshopId: row.petshop_id,
  name: row.name,
  category: row.category,
  description: row.description || '',
  price: money(row.price),
  isActive: Boolean(row.is_active),
});

const toIso = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  // SQLite/MySQL podem devolver "AAAA-MM-DD HH:MM:SS" (UTC).
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? `${text.replace(' ', 'T')}Z` : text;
};

const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'loja';

const clean = (value, max = 255) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const parsePrice = (value) => {
  const number = typeof value === 'number' ? value : Number(String(value || '').replace(',', '.'));
  return Number.isFinite(number) && number >= 0 && number < 100000 ? money(number) : null;
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const withTransaction = async (pool, work) => {
  if (typeof pool.getConnection !== 'function') return work(pool);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createApp = (pool) => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  const route = (handler) => async (request, response) => {
    try {
      await handler(request, response);
    } catch (error) {
      if (error instanceof HttpError) {
        response.status(error.status).json({ error: error.message });
        return;
      }
      console.error('Erro na API:', error.code || error.message);
      response.status(503).json({ error: 'Serviço indisponível no momento. Tente novamente.' });
    }
  };

  const loadSession = async (request) => {
    const header = request.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new HttpError(401, 'Faça login para continuar.');
    const [rows] = await pool.query(
      `SELECT u.id, u.role, u.name, u.username, u.phone, u.address
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
      [token]
    );
    if (rows.length === 0) throw new HttpError(401, 'Sessão expirada. Entre novamente.');
    return formatUser(rows[0]);
  };

  const shopOfOwner = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM petshops WHERE owner_user_id = ?', [userId]);
    if (rows.length === 0) throw new HttpError(404, 'Nenhuma loja vinculada a esta conta.');
    return rows[0];
  };

  const issueSession = async (user) => {
    const token = newToken();
    await pool.query('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);
    let shop = null;
    if (user.role === 'empresa') {
      const [rows] = await pool.query('SELECT * FROM petshops WHERE owner_user_id = ?', [user.id]);
      shop = rows[0] ? formatShop(rows[0]) : null;
    }
    return { token, user, shop };
  };

  const loadOrders = async (where, params) => {
    const [orders] = await pool.query(
      `SELECT o.*, p.name AS petshop_name, p.delivery_min_minutes, p.delivery_max_minutes,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN petshops p ON p.id = o.petshop_id
       JOIN users u ON u.id = o.customer_id
       WHERE ${where}
       ORDER BY o.id DESC
       LIMIT 100`,
      params
    );
    if (orders.length === 0) return [];

    const ids = orders.map((order) => order.id);
    const [items] = await pool.query(
      `SELECT order_id, product_id, product_name, unit_price, quantity
       FROM order_items WHERE order_id IN (${ids.map(() => '?').join(', ')})
       ORDER BY id ASC`,
      ids
    );

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      petshopId: order.petshop_id,
      petshopName: order.petshop_name,
      deliveryTime: `${order.delivery_min_minutes}–${order.delivery_max_minutes} min`,
      customerName: order.customer_name,
      customerPhone: order.customer_phone || null,
      address: order.address,
      paymentMethod: order.payment_method,
      notes: order.notes || '',
      subtotal: money(order.subtotal),
      deliveryFee: money(order.delivery_fee),
      total: money(order.total),
      createdAt: toIso(order.created_at),
      updatedAt: toIso(order.updated_at),
      items: items
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          productId: item.product_id,
          name: item.product_name,
          unitPrice: money(item.unit_price),
          quantity: Number(item.quantity),
        })),
    }));
  };

  // ---------- Status ----------
  app.get('/', (_request, response) => {
    response.json({ name: 'API PetEats', status: 'ok' });
  });

  app.get(
    '/api/health',
    route(async (_request, response) => {
      await pool.query('SELECT 1 AS ok');
      response.json({ status: 'ok', database: 'ok' });
    })
  );

  // ---------- Contas ----------
  app.post(
    '/api/auth/register',
    route(async (request, response) => {
      const body = request.body || {};
      const role = body.role === 'empresa' ? 'empresa' : 'cliente';
      const name = clean(body.name, 120);
      const username = clean(body.username, 60).toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';
      const phone = clean(body.phone, 30) || null;
      const address = clean(body.address, 255) || null;

      if (!name || !username || !password) {
        throw new HttpError(400, 'Preencha nome, usuário e senha.');
      }
      if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
        throw new HttpError(400, 'O usuário deve ter ao menos 3 caracteres, sem espaços ou acentos.');
      }
      if (password.length < 6) {
        throw new HttpError(400, 'Use pelo menos 6 caracteres na senha.');
      }

      let storeName = '';
      let neighborhood = '';
      let category = '';
      let deliveryFee = 0;
      if (role === 'empresa') {
        storeName = clean(body.storeName, 120);
        neighborhood = clean(body.neighborhood, 120);
        category = clean(body.category, 120) || 'Rações e petiscos';
        deliveryFee = parsePrice(body.deliveryFee ?? 0);
        if (!storeName || !neighborhood || !address) {
          throw new HttpError(400, 'Informe o nome da loja, o bairro e o endereço.');
        }
        if (deliveryFee === null) throw new HttpError(400, 'Taxa de entrega inválida.');
      } else if (!address) {
        throw new HttpError(400, 'Informe o endereço de entrega.');
      }

      const [taken] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (taken.length > 0) throw new HttpError(409, 'Este usuário já está em uso. Escolha outro.');

      const user = await withTransaction(pool, async (db) => {
        const [result] = await db.query(
          `INSERT INTO users (role, name, username, password_hash, phone, address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [role, name, username, hashPassword(password), phone, address]
        );
        const created = { id: result.insertId, role, name, username, phone, address };

        if (role === 'empresa') {
          const shopId = `${slugify(storeName)}-${result.insertId}`;
          await db.query(
            `INSERT INTO petshops (id, name, category, neighborhood, rating,
               delivery_min_minutes, delivery_max_minutes, delivery_fee, sort_order,
               owner_user_id, address)
             VALUES (?, ?, ?, ?, 5.0, 30, 50, ?, 100, ?, ?)`,
            [shopId, storeName, category, neighborhood, deliveryFee, result.insertId, address]
          );
        }
        return created;
      });

      response.status(201).json(await issueSession(user));
    })
  );

  app.post(
    '/api/auth/login',
    route(async (request, response) => {
      const username = clean(request.body?.username, 60).toLowerCase();
      const password = typeof request.body?.password === 'string' ? request.body.password : '';
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length === 0 || !verifyPassword(password, rows[0].password_hash)) {
        throw new HttpError(401, 'Usuário e/ou senha inválidos.');
      }
      response.json(await issueSession(formatUser(rows[0])));
    })
  );

  app.post(
    '/api/auth/logout',
    route(async (request, response) => {
      const header = request.headers.authorization || '';
      if (header.startsWith('Bearer ')) {
        await pool.query('DELETE FROM sessions WHERE token = ?', [header.slice(7).trim()]);
      }
      response.json({ ok: true });
    })
  );

  app.get(
    '/api/me',
    route(async (request, response) => {
      const user = await loadSession(request);
      let shop = null;
      if (user.role === 'empresa') shop = formatShop(await shopOfOwner(user.id));
      response.json({ user, shop });
    })
  );

  // ---------- Lojas e produtos (públicos) ----------
  app.get('/api/petshops', async (_request, response) => {
    try {
      const [rows] = await pool.query(petshopsQuery);
      response.json({ petshops: rows.map(formatShop) });
    } catch (error) {
      console.error('Falha ao consultar petshops no MySQL:', error.code || error.message);
      response.status(503).json({ error: 'Petshops indisponíveis no momento.' });
    }
  });

  // Catálogo geral: produtos de todas as lojas ativas, com os dados da loja.
  app.get(
    '/api/products',
    route(async (_request, response) => {
      const [rows] = await pool.query(
        `SELECT pr.*, ps.name AS shop_name, ps.category AS shop_category, ps.neighborhood AS shop_neighborhood,
                ps.rating AS shop_rating, ps.delivery_min_minutes AS shop_min, ps.delivery_max_minutes AS shop_max,
                ps.delivery_fee AS shop_fee, ps.address AS shop_address
         FROM products pr
         JOIN petshops ps ON ps.id = pr.petshop_id
         WHERE pr.is_active = TRUE AND ps.is_active = TRUE AND ps.owner_user_id IS NOT NULL
         ORDER BY ps.sort_order ASC, pr.category ASC, pr.name ASC
         LIMIT 300`
      );
      response.json({
        products: rows.map((row) => ({
          ...formatProduct(row),
          petshop: formatShop({
            id: row.petshop_id,
            name: row.shop_name,
            category: row.shop_category,
            neighborhood: row.shop_neighborhood,
            rating: row.shop_rating,
            delivery_min_minutes: row.shop_min,
            delivery_max_minutes: row.shop_max,
            delivery_fee: row.shop_fee,
            address: row.shop_address,
          }),
        })),
      });
    })
  );

  app.get(
    '/api/petshops/:id/products',
    route(async (request, response) => {
      const [shops] = await pool.query('SELECT * FROM petshops WHERE id = ? AND is_active = TRUE', [
        request.params.id,
      ]);
      if (shops.length === 0) throw new HttpError(404, 'Loja não encontrada.');
      const [rows] = await pool.query(
        `SELECT * FROM products WHERE petshop_id = ? AND is_active = TRUE
         ORDER BY category ASC, name ASC`,
        [request.params.id]
      );
      response.json({ petshop: formatShop(shops[0]), products: rows.map(formatProduct) });
    })
  );

  // ---------- Produtos da empresa ----------
  app.get(
    '/api/my/products',
    route(async (request, response) => {
      const user = await loadSession(request);
      if (user.role !== 'empresa') throw new HttpError(403, 'Acesso apenas para empresas.');
      const shop = await shopOfOwner(user.id);
      const [rows] = await pool.query(
        'SELECT * FROM products WHERE petshop_id = ? ORDER BY is_active DESC, name ASC',
        [shop.id]
      );
      response.json({ products: rows.map(formatProduct) });
    })
  );

  app.post(
    '/api/my/products',
    route(async (request, response) => {
      const user = await loadSession(request);
      if (user.role !== 'empresa') throw new HttpError(403, 'Acesso apenas para empresas.');
      const shop = await shopOfOwner(user.id);
      const name = clean(request.body?.name, 120);
      const category = PRODUCT_CATEGORIES.includes(request.body?.category)
        ? request.body.category
        : 'Outros';
      const description = clean(request.body?.description, 255);
      const price = parsePrice(request.body?.price);
      if (!name) throw new HttpError(400, 'Informe o nome do produto.');
      if (price === null || price <= 0) throw new HttpError(400, 'Informe um preço válido.');

      const [result] = await pool.query(
        'INSERT INTO products (petshop_id, name, category, description, price) VALUES (?, ?, ?, ?, ?)',
        [shop.id, name, category, description || null, price]
      );
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
      response.status(201).json({ product: formatProduct(rows[0]) });
    })
  );

  app.patch(
    '/api/my/products/:id',
    route(async (request, response) => {
      const user = await loadSession(request);
      if (user.role !== 'empresa') throw new HttpError(403, 'Acesso apenas para empresas.');
      const shop = await shopOfOwner(user.id);
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND petshop_id = ?', [
        request.params.id,
        shop.id,
      ]);
      if (rows.length === 0) throw new HttpError(404, 'Produto não encontrado.');

      const current = rows[0];
      const body = request.body || {};
      const name = body.name !== undefined ? clean(body.name, 120) : current.name;
      const price = body.price !== undefined ? parsePrice(body.price) : money(current.price);
      const isActive = body.isActive !== undefined ? Boolean(body.isActive) : Boolean(current.is_active);
      if (!name) throw new HttpError(400, 'Informe o nome do produto.');
      if (price === null || price <= 0) throw new HttpError(400, 'Informe um preço válido.');

      await pool.query('UPDATE products SET name = ?, price = ?, is_active = ? WHERE id = ?', [
        name,
        price,
        isActive,
        current.id,
      ]);
      const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [current.id]);
      response.json({ product: formatProduct(updated[0]) });
    })
  );

  // ---------- Pedidos ----------
  app.post(
    '/api/orders',
    route(async (request, response) => {
      const user = await loadSession(request);
      if (user.role !== 'cliente') throw new HttpError(403, 'Apenas clientes podem fazer pedidos.');
      const body = request.body || {};
      const address = clean(body.address, 255);
      const paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod)
        ? body.paymentMethod
        : PAYMENT_METHODS[0];
      const notes = clean(body.notes, 255);
      const wanted = Array.isArray(body.items) ? body.items : [];

      if (!address) throw new HttpError(400, 'Informe o endereço de entrega.');
      const quantities = new Map();
      for (const item of wanted) {
        const productId = Number(item?.productId);
        const quantity = Math.floor(Number(item?.quantity));
        if (!Number.isInteger(productId) || quantity < 1 || quantity > 99) {
          throw new HttpError(400, 'Itens do pedido inválidos.');
        }
        quantities.set(productId, (quantities.get(productId) || 0) + quantity);
      }
      if (quantities.size === 0) throw new HttpError(400, 'O carrinho está vazio.');

      const [shops] = await pool.query(
        'SELECT * FROM petshops WHERE id = ? AND is_active = TRUE AND owner_user_id IS NOT NULL',
        [body.petshopId]
      );
      if (shops.length === 0) throw new HttpError(404, 'Loja não encontrada.');
      const shop = shops[0];

      const ids = [...quantities.keys()];
      const [products] = await pool.query(
        `SELECT * FROM products
         WHERE petshop_id = ? AND is_active = TRUE AND id IN (${ids.map(() => '?').join(', ')})`,
        [shop.id, ...ids]
      );
      if (products.length !== ids.length) {
        throw new HttpError(409, 'Algum produto não está mais disponível. Atualize o carrinho.');
      }

      // Os preços sempre vêm do banco, nunca do aplicativo.
      const lines = products.map((product) => ({
        product,
        quantity: quantities.get(product.id),
      }));
      const subtotal = money(lines.reduce((sum, line) => sum + money(line.product.price) * line.quantity, 0));
      const deliveryFee = money(shop.delivery_fee);
      const total = money(subtotal + deliveryFee);

      const orderId = await withTransaction(pool, async (db) => {
        const [result] = await db.query(
          `INSERT INTO orders (customer_id, petshop_id, status, subtotal, delivery_fee, total,
             address, payment_method, notes)
           VALUES (?, ?, 'pendente', ?, ?, ?, ?, ?, ?)`,
          [user.id, shop.id, subtotal, deliveryFee, total, address, paymentMethod, notes || null]
        );
        for (const line of lines) {
          await db.query(
            `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
             VALUES (?, ?, ?, ?, ?)`,
            [result.insertId, line.product.id, line.product.name, money(line.product.price), line.quantity]
          );
        }
        return result.insertId;
      });

      const [order] = await loadOrders('o.id = ?', [orderId]);
      response.status(201).json({ order });
    })
  );

  app.get(
    '/api/orders',
    route(async (request, response) => {
      const user = await loadSession(request);
      if (user.role === 'empresa') {
        const shop = await shopOfOwner(user.id);
        response.json({ orders: await loadOrders('o.petshop_id = ?', [shop.id]) });
      } else {
        response.json({ orders: await loadOrders('o.customer_id = ?', [user.id]) });
      }
    })
  );

  app.get(
    '/api/orders/:id',
    route(async (request, response) => {
      const user = await loadSession(request);
      const [order] = await loadOrders('o.id = ?', [Number(request.params.id)]);
      if (!order) throw new HttpError(404, 'Pedido não encontrado.');
      await assertCanSee(user, order);
      response.json({ order });
    })
  );

  const assertCanSee = async (user, order) => {
    if (user.role === 'empresa') {
      const shop = await shopOfOwner(user.id);
      if (shop.id !== order.petshopId) throw new HttpError(404, 'Pedido não encontrado.');
    } else {
      const [rows] = await pool.query('SELECT customer_id FROM orders WHERE id = ?', [order.id]);
      if (rows[0]?.customer_id !== user.id) throw new HttpError(404, 'Pedido não encontrado.');
    }
  };

  app.patch(
    '/api/orders/:id/status',
    route(async (request, response) => {
      const user = await loadSession(request);
      const status = request.body?.status;
      if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Status inválido.');

      const [current] = await loadOrders('o.id = ?', [Number(request.params.id)]);
      if (!current) throw new HttpError(404, 'Pedido não encontrado.');
      await assertCanSee(user, current);

      const allowedFrom = TRANSITIONS[user.role]?.[status];
      if (!allowedFrom || !allowedFrom.includes(current.status)) {
        throw new HttpError(409, `Não é possível mudar de "${current.status}" para "${status}".`);
      }

      // A condição no status evita que duas pessoas mudem o mesmo pedido ao mesmo tempo.
      const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ? AND status = ?', [
        status,
        current.id,
        current.status,
      ]);
      if (result.affectedRows === 0) {
        throw new HttpError(409, 'O pedido foi atualizado por outra pessoa. Atualize a tela.');
      }
      const [order] = await loadOrders('o.id = ?', [current.id]);
      response.json({ order });
    })
  );

  app.use((_request, response) => {
    response.status(404).json({ error: 'Rota não encontrada.' });
  });

  return app;
};

module.exports = {
  createApp,
  petshopsQuery,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  PAYMENT_METHODS,
  TRANSITIONS,
};
