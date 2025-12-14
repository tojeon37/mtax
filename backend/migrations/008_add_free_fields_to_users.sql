-- User 테이블에 무료 제공 건수 및 결제수단 필드 추가
ALTER TABLE users 
ADD COLUMN free_invoice_remaining INT NOT NULL DEFAULT 5,
ADD COLUMN free_statuscheck_remaining INT NOT NULL DEFAULT 5,
ADD COLUMN has_payment_method BOOLEAN NOT NULL DEFAULT FALSE;

-- 기존 사용자들에게 기본값 설정 (이미 DEFAULT로 처리되지만 명시적으로 설정)
UPDATE users 
SET free_invoice_remaining = 5, 
    free_statuscheck_remaining = 5, 
    has_payment_method = FALSE
WHERE free_invoice_remaining IS NULL OR free_statuscheck_remaining IS NULL OR has_payment_method IS NULL;

