CREATE TABLE IF NOT EXISTS character_flags (
  character_id BIGINT UNSIGNED NOT NULL,
  flag_key VARCHAR(64) NOT NULL,
  flag_value VARCHAR(255) NOT NULL DEFAULT '1',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id, flag_key),
  CONSTRAINT character_flags_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

INSERT IGNORE INTO factions (faction_key, name, type, treasury) VALUES
('government', 'Government of San Andreas', 'government', 0),
('lspd', 'Los Santos Police Department', 'police', 0),
('sasd', 'San Andreas Sheriff Department', 'police', 0),
('ems', 'Emergency Medical Services', 'ems', 0),
('fire', 'Los Santos Fire Department', 'fire', 0);
