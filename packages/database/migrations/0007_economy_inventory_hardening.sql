ALTER TABLE character_wallets
  ADD COLUMN bank_account VARCHAR(12) NULL AFTER bank,
  ADD COLUMN bank_frozen TINYINT(1) NOT NULL DEFAULT 0 AFTER bank_account;

UPDATE character_wallets
SET bank_account = CONCAT('NR', LPAD(character_id, 10, '0'))
WHERE bank_account IS NULL;

ALTER TABLE character_wallets
  MODIFY COLUMN bank_account VARCHAR(12) NOT NULL,
  ADD UNIQUE KEY character_wallets_bank_account_uq (bank_account),
  ADD KEY character_wallets_bank_frozen_idx (bank_frozen);

CREATE TABLE inventory_use_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  character_id BIGINT UNSIGNED NOT NULL,
  item_key VARCHAR(80) NOT NULL,
  effect VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY inventory_use_log_character_idx (character_id),
  KEY inventory_use_log_created_idx (created_at),
  CONSTRAINT inventory_use_log_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
