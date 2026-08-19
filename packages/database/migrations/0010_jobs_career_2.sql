ALTER TABLE jobs_progress
  ADD COLUMN skill_points INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN reputation INT NOT NULL DEFAULT 0,
  ADD COLUMN total_earnings BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN streak INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN last_completed_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS job_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  job_key VARCHAR(64) NOT NULL,
  session_token VARCHAR(96) NOT NULL UNIQUE,
  task_key VARCHAR(64) NOT NULL,
  state ENUM('active','completed','cancelled','expired') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  INDEX job_sessions_character_idx (character_id, state),
  CONSTRAINT job_sessions_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_skill_unlocks (
  character_id BIGINT UNSIGNED NOT NULL,
  job_key VARCHAR(64) NOT NULL,
  skill_key VARCHAR(64) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id, job_key, skill_key),
  CONSTRAINT job_skill_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_equipment (
  character_id BIGINT UNSIGNED NOT NULL,
  job_key VARCHAR(64) NOT NULL,
  equipment_key VARCHAR(64) NOT NULL,
  durability INT UNSIGNED NOT NULL DEFAULT 100,
  equipped BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id, job_key, equipment_key),
  CONSTRAINT job_equipment_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_completion_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  job_key VARCHAR(64) NOT NULL,
  task_key VARCHAR(64) NOT NULL,
  pay BIGINT UNSIGNED NOT NULL,
  experience INT UNSIGNED NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX job_completion_character_idx (character_id, created_at),
  CONSTRAINT job_completion_character_fk FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);