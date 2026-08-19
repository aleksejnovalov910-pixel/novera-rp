ALTER TABLE characters
  ADD COLUMN slot TINYINT UNSIGNED NOT NULL AFTER account_id,
  ADD COLUMN gender ENUM('male','female') NOT NULL DEFAULT 'male' AFTER last_name,
  ADD COLUMN birth_date DATE NOT NULL DEFAULT '2000-01-01' AFTER gender,
  ADD COLUMN appearance_json LONGTEXT NOT NULL AFTER birth_date,
  ADD COLUMN pos_x DOUBLE NOT NULL DEFAULT -1037.6,
  ADD COLUMN pos_y DOUBLE NOT NULL DEFAULT -2737.8,
  ADD COLUMN pos_z DOUBLE NOT NULL DEFAULT 20.17,
  ADD COLUMN heading FLOAT NOT NULL DEFAULT 330.0,
  ADD COLUMN dimension INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN deleted_at DATETIME NULL;

CREATE UNIQUE INDEX characters_account_slot_uq ON characters(account_id, slot);
CREATE UNIQUE INDEX characters_name_uq ON characters(first_name, last_name);
