CREATE TABLE IF NOT EXISTS wanted_records (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  issuer_character_id BIGINT UNSIGNED NULL,
  level TINYINT UNSIGNED NOT NULL,
  reason VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cleared_at DATETIME NULL,
  INDEX wanted_character_idx (character_id, active, created_at),
  CONSTRAINT wanted_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS police_cases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open','investigation','court','closed') NOT NULL DEFAULT 'open',
  lead_character_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS police_case_people (
  case_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  role ENUM('suspect','victim','witness','officer','other') NOT NULL,
  notes VARCHAR(500) NULL,
  PRIMARY KEY (case_id, character_id, role),
  CONSTRAINT police_case_people_case_fk FOREIGN KEY (case_id) REFERENCES police_cases(id) ON DELETE CASCADE,
  CONSTRAINT police_case_people_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidence (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  case_id BIGINT UNSIGNED NULL,
  collected_by_character_id BIGINT UNSIGNED NOT NULL,
  evidence_type VARCHAR(48) NOT NULL,
  serial_number VARCHAR(64) NULL,
  description VARCHAR(500) NOT NULL,
  metadata LONGTEXT NULL,
  storage_location VARCHAR(96) NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX evidence_case_idx (case_id, collected_at),
  CONSTRAINT evidence_case_fk FOREIGN KEY (case_id) REFERENCES police_cases(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS medical_records (
  character_id BIGINT UNSIGNED PRIMARY KEY,
  blood_type VARCHAR(8) NULL,
  allergies VARCHAR(500) NULL,
  notes TEXT NULL,
  updated_by_character_id BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT medical_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS injuries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  injury_type VARCHAR(48) NOT NULL,
  body_part VARCHAR(32) NOT NULL,
  severity TINYINT UNSIGNED NOT NULL DEFAULT 1,
  treated BOOLEAN NOT NULL DEFAULT FALSE,
  metadata LONGTEXT NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  treated_at DATETIME NULL,
  INDEX injuries_character_idx (character_id, treated, occurred_at),
  CONSTRAINT injury_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quest_progress (
  character_id BIGINT UNSIGNED NOT NULL,
  quest_key VARCHAR(64) NOT NULL,
  stage VARCHAR(64) NOT NULL DEFAULT 'start',
  progress LONGTEXT NULL,
  status ENUM('active','completed','failed') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (character_id, quest_key),
  CONSTRAINT quest_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  character_id BIGINT UNSIGNED NOT NULL,
  achievement_key VARCHAR(64) NOT NULL,
  progress INT UNSIGNED NOT NULL DEFAULT 0,
  unlocked_at DATETIME NULL,
  PRIMARY KEY (character_id, achievement_key),
  CONSTRAINT achievement_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crime_reputation (
  character_id BIGINT UNSIGNED PRIMARY KEY,
  street_rep INT UNSIGNED NOT NULL DEFAULT 0,
  heat INT UNSIGNED NOT NULL DEFAULT 0,
  prison_time_minutes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT crime_reputation_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
