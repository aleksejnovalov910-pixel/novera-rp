CREATE TABLE IF NOT EXISTS character_wallets (
  character_id BIGINT UNSIGNED PRIMARY KEY,
  cash BIGINT NOT NULL DEFAULT 5000,
  bank BIGINT NOT NULL DEFAULT 25000,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT wallets_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS money_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  counterparty_character_id BIGINT UNSIGNED NULL,
  type VARCHAR(48) NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX money_tx_character_idx (character_id, created_at),
  CONSTRAINT money_tx_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  item_key VARCHAR(64) NOT NULL,
  amount INT UNSIGNED NOT NULL DEFAULT 1,
  slot SMALLINT UNSIGNED NOT NULL,
  durability SMALLINT UNSIGNED NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY inventory_character_slot_uq (character_id, slot),
  INDEX inventory_character_idx (character_id),
  CONSTRAINT inventory_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owned_vehicles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  model VARCHAR(64) NOT NULL,
  plate VARCHAR(16) NOT NULL UNIQUE,
  vin VARCHAR(32) NOT NULL UNIQUE,
  fuel DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  mileage DECIMAL(12,2) NOT NULL DEFAULT 0,
  engine_health INT NOT NULL DEFAULT 1000,
  body_health INT NOT NULL DEFAULT 1000,
  color_primary INT NOT NULL DEFAULT 0,
  color_secondary INT NOT NULL DEFAULT 0,
  pos_x DOUBLE NULL,
  pos_y DOUBLE NULL,
  pos_z DOUBLE NULL,
  heading FLOAT NULL,
  stored BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vehicles_character_idx (character_id),
  CONSTRAINT vehicles_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_character_id BIGINT UNSIGNED NULL,
  property_type ENUM('apartment','house','garage','warehouse','business') NOT NULL,
  name VARCHAR(96) NOT NULL,
  price BIGINT NOT NULL,
  entrance_x DOUBLE NOT NULL,
  entrance_y DOUBLE NOT NULL,
  entrance_z DOUBLE NOT NULL,
  interior_x DOUBLE NULL,
  interior_y DOUBLE NULL,
  interior_z DOUBLE NULL,
  dimension INT UNSIGNED NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX properties_owner_idx (owner_character_id),
  CONSTRAINT properties_owner_fk FOREIGN KEY (owner_character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS jobs_progress (
  character_id BIGINT UNSIGNED NOT NULL,
  job_key VARCHAR(64) NOT NULL,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  experience INT UNSIGNED NOT NULL DEFAULT 0,
  completed_tasks INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (character_id, job_key),
  CONSTRAINT jobs_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS factions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  faction_key VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(96) NOT NULL,
  type ENUM('government','police','ems','fire','crime','other') NOT NULL,
  treasury BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faction_members (
  faction_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL DEFAULT 1,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (faction_id, character_id),
  CONSTRAINT faction_member_faction_fk FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
  CONSTRAINT faction_member_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS families (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_character_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL UNIQUE,
  treasury BIGINT NOT NULL DEFAULT 0,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT family_owner_fk FOREIGN KEY (owner_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS family_members (
  family_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL DEFAULT 1,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (family_id, character_id),
  CONSTRAINT family_member_family_fk FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  CONSTRAINT family_member_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_character_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(32) NOT NULL,
  object_type VARCHAR(32) NOT NULL,
  object_id BIGINT UNSIGNED NOT NULL,
  price BIGINT UNSIGNED NOT NULL,
  status ENUM('active','sold','cancelled','expired') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  INDEX market_status_idx (status, category, created_at),
  CONSTRAINT market_seller_fk FOREIGN KEY (seller_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_account_id BIGINT UNSIGNED NULL,
  actor_character_id BIGINT UNSIGNED NULL,
  action VARCHAR(96) NOT NULL,
  target_type VARCHAR(48) NULL,
  target_id VARCHAR(64) NULL,
  payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX audit_action_idx (action, created_at),
  INDEX audit_character_idx (actor_character_id, created_at)
);
