-- BillingCharge 테이블 생성
CREATE TABLE IF NOT EXISTS billing_charges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    charge_type ENUM('invoice', 'statuscheck') NOT NULL,
    amount INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

