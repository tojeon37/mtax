-- 결제수단 테이블 생성 마이그레이션

CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    method_type ENUM('card', 'bank') NOT NULL,
    masked_number VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'toss',
    toss_billing_key VARCHAR(255) NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

