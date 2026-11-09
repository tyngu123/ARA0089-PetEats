-- Estrutura do banco PetEats (MySQL 8 / MariaDB).
-- O backend executa este arquivo automaticamente ao iniciar (veja backend/database.js),
-- dentro do banco definido em DB_NAME. Pode ser executado várias vezes sem apagar dados.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(10) NOT NULL,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_role CHECK (role IN ('cliente', 'empresa'))
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS petshops (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(120) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  rating DECIMAL(2, 1) NOT NULL,
  delivery_min_minutes SMALLINT UNSIGNED NOT NULL,
  delivery_max_minutes SMALLINT UNSIGNED NOT NULL,
  delivery_fee DECIMAL(7, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order TINYINT UNSIGNED NOT NULL,
  owner_user_id INT UNSIGNED NULL,
  address VARCHAR(255) NULL,
  CONSTRAINT chk_petshops_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT chk_petshops_delivery_time CHECK (
    delivery_max_minutes >= delivery_min_minutes
  ),
  CONSTRAINT chk_petshops_delivery_fee CHECK (delivery_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  petshop_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  description VARCHAR(255) NULL,
  price DECIMAL(8, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_petshop FOREIGN KEY (petshop_id) REFERENCES petshops (id),
  CONSTRAINT chk_products_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  petshop_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  subtotal DECIMAL(9, 2) NOT NULL,
  delivery_fee DECIMAL(7, 2) NOT NULL,
  total DECIMAL(9, 2) NOT NULL,
  address VARCHAR(255) NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id),
  CONSTRAINT fk_orders_petshop FOREIGN KEY (petshop_id) REFERENCES petshops (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(8, 2) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

INSERT IGNORE INTO petshops (
  id, name, category, neighborhood, rating,
  delivery_min_minutes, delivery_max_minutes, delivery_fee, sort_order
) VALUES
  ('casa-do-bicho', 'Casa do Bicho', 'Rações e acessórios', 'Centro',
   4.8, 25, 35, 4.90, 1);
