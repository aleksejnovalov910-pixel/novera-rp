-- NOVERA RP playable baseline schema
CREATE TABLE IF NOT EXISTS novera_characters (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id INT UNSIGNED NOT NULL,
  slot TINYINT UNSIGNED NOT NULL DEFAULT 1,
  first_name VARCHAR(32) NOT NULL,
  last_name VARCHAR(32) NOT NULL,
  age TINYINT UNSIGNED NOT NULL DEFAULT 18,
  gender TINYINT UNSIGNED NOT NULL DEFAULT 0,
  appearance_json LONGTEXT NULL,
  cash INT NOT NULL DEFAULT 5000,
  bank INT NOT NULL DEFAULT 15000,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  xp INT UNSIGNED NOT NULL DEFAULT 0,
  pos_x DOUBLE NOT NULL DEFAULT 215.76,
  pos_y DOUBLE NOT NULL DEFAULT -810.12,
  pos_z DOUBLE NOT NULL DEFAULT 30.73,
  heading FLOAT NOT NULL DEFAULT 0,
  dimension INT UNSIGNED NOT NULL DEFAULT 0,
  last_seen TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_novera_account_slot (account_id, slot),
  KEY idx_novera_character_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS novera_inventory (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  character_id INT UNSIGNED NOT NULL,
  item_key VARCHAR(64) NOT NULL,
  amount INT UNSIGNED NOT NULL DEFAULT 1,
  metadata_json LONGTEXT NULL,
  PRIMARY KEY (id),
  KEY idx_novera_inventory_character (character_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS novera_vehicles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  character_id INT UNSIGNED NOT NULL,
  model VARCHAR(64) NOT NULL,
  plate VARCHAR(16) NOT NULL,
  garage_key VARCHAR(64) NULL,
  fuel FLOAT NOT NULL DEFAULT 100,
  locked TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_novera_vehicle_plate (plate),
  KEY idx_novera_vehicle_character (character_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS novera_properties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  character_id INT UNSIGNED NULL,
  property_key VARCHAR(64) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  locked TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_novera_property_key (property_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
