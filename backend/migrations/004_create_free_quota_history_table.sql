-- 무료 제공 쿼터 이력 테이블 생성
CREATE TABLE IF NOT EXISTS free_quota_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL COMMENT '이메일 또는 사업자등록번호',
    free_invoice_total INT NOT NULL DEFAULT 5 COMMENT '지급된 총 무료 세금계산서 건수',
    free_status_total INT NOT NULL DEFAULT 5 COMMENT '지급된 총 무료 상태조회 건수',
    free_invoice_used INT NOT NULL DEFAULT 0 COMMENT '사용한 무료 세금계산서 건수',
    free_status_used INT NOT NULL DEFAULT 0 COMMENT '사용한 무료 상태조회 건수',
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE COMMENT '무료 제공분 모두 소진 여부',
    consumed_at DATETIME NULL COMMENT '무료 제공분 소진 시점',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_identifier (user_identifier),
    INDEX idx_is_consumed (is_consumed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

