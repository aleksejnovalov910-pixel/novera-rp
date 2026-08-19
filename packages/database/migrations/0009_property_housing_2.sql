ALTER TABLE properties
  ADD COLUMN rent_price BIGINT UNSIGNED NULL AFTER price,
  ADD COLUMN rentable BOOLEAN NOT NULL DEFAULT FALSE AFTER rent_price,
  ADD COLUMN owner_history_enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER rentable;

CREATE TABLE IF NOT EXISTS property_access (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  access_type ENUM('owner','resident','guest','tenant') NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY property_access_uq (property_id, character_id),
  INDEX property_access_character_idx (character_id, revoked),
  CONSTRAINT property_access_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT property_access_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_rentals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  tenant_character_id BIGINT UNSIGNED NOT NULL,
  landlord_character_id BIGINT UNSIGNED NOT NULL,
  rent_amount BIGINT UNSIGNED NOT NULL,
  status ENUM('active','ended','cancelled') NOT NULL DEFAULT 'active',
  starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_until DATETIME NOT NULL,
  ended_at DATETIME NULL,
  INDEX property_rental_tenant_idx (tenant_character_id, status),
  INDEX property_rental_property_idx (property_id, status),
  CONSTRAINT property_rental_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT property_rental_tenant_fk FOREIGN KEY (tenant_character_id) REFERENCES characters(id) ON DELETE CASCADE,
  CONSTRAINT property_rental_landlord_fk FOREIGN KEY (landlord_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_containers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  container_key VARCHAR(48) NOT NULL,
  name VARCHAR(96) NOT NULL,
  capacity_slots SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  max_weight DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY property_container_uq (property_id, container_key),
  CONSTRAINT property_container_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_container_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  container_id BIGINT UNSIGNED NOT NULL,
  item_key VARCHAR(64) NOT NULL,
  amount INT UNSIGNED NOT NULL DEFAULT 1,
  slot SMALLINT UNSIGNED NOT NULL,
  durability SMALLINT UNSIGNED NULL,
  metadata LONGTEXT NULL,
  UNIQUE KEY property_container_slot_uq (container_id, slot),
  CONSTRAINT property_container_item_fk FOREIGN KEY (container_id) REFERENCES property_containers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_owner_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  from_character_id BIGINT UNSIGNED NULL,
  to_character_id BIGINT UNSIGNED NULL,
  transfer_type ENUM('purchase','sale','admin','initial') NOT NULL,
  price BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX property_history_idx (property_id, created_at),
  CONSTRAINT property_history_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);
