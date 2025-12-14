-- free_quota_history 테이블에 consumed_at 컬럼 추가
ALTER TABLE free_quota_history 
ADD COLUMN IF NOT EXISTS consumed_at DATETIME NULL COMMENT '무료 제공분 소진 시점' AFTER is_consumed;

