-- 후불 과금 시스템 테이블 생성 마이그레이션

-- billing_cycles 테이블 생성
CREATE TABLE IF NOT EXISTS billing_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    year_month VARCHAR(6) NOT NULL,
    total_usage_amount DECIMAL(10, 0) NOT NULL DEFAULT 0,
    monthly_fee DECIMAL(10, 0) NOT NULL DEFAULT 0,
    total_bill_amount DECIMAL(10, 0) NOT NULL,
    status ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
    due_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_year_month (year_month),
    INDEX idx_status (status),
    UNIQUE KEY unique_user_year_month (user_id, year_month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- usage_logs 테이블 생성
CREATE TABLE IF NOT EXISTS usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    usage_type ENUM('invoice_issue', 'status_check') NOT NULL,
    unit_price DECIMAL(10, 0) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 0) NOT NULL,
    billing_cycle_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_usage_type (usage_type),
    INDEX idx_billing_cycle_id (billing_cycle_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- payments 테이블 생성
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    billing_cycle_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 0) NOT NULL,
    payment_method ENUM('card', 'bank') NOT NULL,
    transaction_id VARCHAR(255) NULL,
    paid_at DATETIME NULL,
    status ENUM('success', 'failed') NOT NULL DEFAULT 'success',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_billing_cycle_id (billing_cycle_id),
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status),
    FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

