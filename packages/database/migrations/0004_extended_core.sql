ALTER TABLE accounts ADD COLUMN admin_level INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_banned;

CREATE TABLE IF NOT EXISTS character_settings (
  character_id BIGINT UNSIGNED PRIMARY KEY,
  settings JSON NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT character_settings_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS character_stats (
  character_id BIGINT UNSIGNED PRIMARY KEY,
  play_minutes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  reputation INT NOT NULL DEFAULT 0,
  driving_skill INT UNSIGNED NOT NULL DEFAULT 0,
  strength_skill INT UNSIGNED NOT NULL DEFAULT 0,
  stamina_skill INT UNSIGNED NOT NULL DEFAULT 0,
  crafting_skill INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT character_stats_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phone_contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  contact_character_id BIGINT UNSIGNED NOT NULL,
  alias VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY phone_contact_uq (character_id, contact_character_id),
  CONSTRAINT phone_contact_owner_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  CONSTRAINT phone_contact_target_fk FOREIGN KEY (contact_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phone_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_character_id BIGINT UNSIGNED NOT NULL,
  receiver_character_id BIGINT UNSIGNED NOT NULL,
  body VARCHAR(500) NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX phone_messages_conversation_idx (sender_character_id, receiver_character_id, created_at),
  INDEX phone_messages_receiver_idx (receiver_character_id, read_at, created_at),
  CONSTRAINT phone_message_sender_fk FOREIGN KEY (sender_character_id) REFERENCES characters(id) ON DELETE CASCADE,
  CONSTRAINT phone_message_receiver_fk FOREIGN KEY (receiver_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS businesses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NULL,
  owner_character_id BIGINT UNSIGNED NULL,
  business_type VARCHAR(48) NOT NULL,
  name VARCHAR(96) NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  tax_rate DECIMAL(6,4) NOT NULL DEFAULT 0.0500,
  stock_value BIGINT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX businesses_owner_idx (owner_character_id),
  CONSTRAINT businesses_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT businesses_owner_fk FOREIGN KEY (owner_character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS business_employees (
  business_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(48) NOT NULL DEFAULT 'employee',
  salary BIGINT UNSIGNED NOT NULL DEFAULT 0,
  hired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_id, character_id),
  CONSTRAINT business_employee_business_fk FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT business_employee_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS character_licenses (
  character_id BIGINT UNSIGNED NOT NULL,
  license_key VARCHAR(48) NOT NULL,
  issued_by_character_id BIGINT UNSIGNED NULL,
  expires_at DATETIME NULL,
  suspended_until DATETIME NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id, license_key),
  CONSTRAINT license_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  issuer_character_id BIGINT UNSIGNED NULL,
  amount BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(190) NOT NULL,
  status ENUM('unpaid','paid','cancelled') NOT NULL DEFAULT 'unpaid',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  INDEX fines_character_idx (character_id, status, created_at),
  CONSTRAINT fines_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_keys (
  vehicle_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  key_type ENUM('owner','shared','temporary') NOT NULL DEFAULT 'shared',
  expires_at DATETIME NULL,
  PRIMARY KEY (vehicle_id, character_id),
  CONSTRAINT vehicle_key_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES owned_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT vehicle_key_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  service_type VARCHAR(48) NOT NULL,
  mileage DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost BIGINT UNSIGNED NOT NULL DEFAULT 0,
  details JSON NULL,
  serviced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX vehicle_maintenance_idx (vehicle_id, serviced_at),
  CONSTRAINT vehicle_maintenance_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES owned_vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_keys (
  property_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  key_type ENUM('owner','shared','tenant') NOT NULL DEFAULT 'shared',
  expires_at DATETIME NULL,
  PRIMARY KEY (property_id, character_id),
  CONSTRAINT property_key_property_fk FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT property_key_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_character_id BIGINT UNSIGNED NOT NULL,
  assigned_account_id BIGINT UNSIGNED NULL,
  subject VARCHAR(96) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  status ENUM('open','assigned','resolved','closed') NOT NULL DEFAULT 'open',
  resolution VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX admin_reports_status_idx (status, created_at),
  CONSTRAINT reports_character_fk FOREIGN KEY (reporter_character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS punishments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NULL,
  admin_account_id BIGINT UNSIGNED NOT NULL,
  punishment_type ENUM('warn','mute','jail','kick','ban') NOT NULL,
  reason VARCHAR(255) NOT NULL,
  expires_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX punishments_account_idx (account_id, created_at),
  CONSTRAINT punishments_account_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT punishments_admin_fk FOREIGN KEY (admin_account_id) REFERENCES accounts(id) ON DELETE CASCADE
);
