CREATE DATABASE IF NOT EXISTS peteats
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE peteats;

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
  CONSTRAINT chk_petshops_rating CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT chk_petshops_delivery_time CHECK (
    delivery_max_minutes >= delivery_min_minutes
  ),
  CONSTRAINT chk_petshops_delivery_fee CHECK (delivery_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4;

INSERT IGNORE INTO petshops (
  id, name, category, neighborhood, rating,
  delivery_min_minutes, delivery_max_minutes, delivery_fee, sort_order
) VALUES
  ('casa-do-bicho', 'Casa do Bicho', 'Rações e acessórios', 'Centro',
   4.8, 25, 35, 4.90, 1),
  ('patas-e-racoes', 'Patas & Rações', 'Alimentos e petiscos', 'Jardim América',
   4.7, 30, 40, 5.90, 2),
  ('aumiau-market', 'AuMiau Market', 'Cuidados e brinquedos', 'Vila Nova',
   4.9, 35, 45, 6.90, 3);
