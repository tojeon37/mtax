CREATE TABLE IF NOT EXISTS user_device_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  device_hash VARCHAR(255) NOT NULL,
  user_agent TEXT NOT NULL,
  ip VARCHAR(255),
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_device (user_id, device_hash)
);

