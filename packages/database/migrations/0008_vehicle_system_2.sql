ALTER TABLE owned_vehicles
  ADD COLUMN insurance_status ENUM('none','basic','full') NOT NULL DEFAULT 'none' AFTER mileage,
  ADD COLUMN insurance_expires_at DATETIME NULL AFTER insurance_status,
  ADD COLUMN oil_level DECIMAL(5,2) NOT NULL DEFAULT 100.00 AFTER engine_health,
  ADD COLUMN battery_level DECIMAL(5,2) NOT NULL DEFAULT 100.00 AFTER oil_level,
  ADD COLUMN tire_health DECIMAL(5,2) NOT NULL DEFAULT 100.00 AFTER battery_level,
  ADD COLUMN inspection_expires_at DATETIME NULL AFTER tire_health,
  ADD COLUMN impounded BOOLEAN NOT NULL DEFAULT FALSE AFTER stored,
  ADD COLUMN impound_reason VARCHAR(160) NULL AFTER impounded,
  ADD COLUMN impound_fee BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER impound_reason,
  ADD COLUMN last_service_at DATETIME NULL AFTER impound_fee;

CREATE TABLE IF NOT EXISTS vehicle_keys (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  key_type ENUM('owner','spare','temporary') NOT NULL DEFAULT 'spare',
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY vehicle_keys_vehicle_character_uq (vehicle_id, character_id),
  INDEX vehicle_keys_character_idx (character_id),
  CONSTRAINT vehicle_keys_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES owned_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_keys_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_owner_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  from_character_id BIGINT UNSIGNED NULL,
  to_character_id BIGINT UNSIGNED NOT NULL,
  transfer_type ENUM('purchase','market','gift','admin','initial') NOT NULL,
  price BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vehicle_owner_history_vehicle_idx (vehicle_id, created_at),
  CONSTRAINT vehicle_owner_history_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES owned_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_owner_history_from_fk FOREIGN KEY (from_character_id) REFERENCES characters(id) ON DELETE SET NULL,
  CONSTRAINT vehicle_owner_history_to_fk FOREIGN KEY (to_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_service_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  service_type ENUM('repair','oil','battery','tires','inspection','insurance','impound_release') NOT NULL,
  cost BIGINT UNSIGNED NOT NULL DEFAULT 0,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vehicle_service_vehicle_idx (vehicle_id, created_at),
  CONSTRAINT vehicle_service_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES owned_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_service_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

INSERT IGNORE INTO vehicle_keys (vehicle_id, character_id, key_type)
SELECT id, character_id, 'owner' FROM owned_vehicles;

INSERT INTO vehicle_owner_history (vehicle_id, to_character_id, transfer_type)
SELECT v.id, v.character_id, 'initial' FROM owned_vehicles v
WHERE NOT EXISTS (SELECT 1 FROM vehicle_owner_history h WHERE h.vehicle_id = v.id);