-- 무료 제공 쿼터 테이블 생성 마이그레이션

CREATE TABLE IF NOT EXISTS free_quota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    free_invoice_left INT NOT NULL DEFAULT 5,
    free_status_left INT NOT NULL DEFAULT 5,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_id (user_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

