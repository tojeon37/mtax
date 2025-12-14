-- clients 테이블에서 address_detail 컬럼 제거
ALTER TABLE clients DROP COLUMN IF EXISTS address_detail;

-- companies 테이블에서 address_detail 컬럼 제거
ALTER TABLE companies DROP COLUMN IF EXISTS address_detail;

-- 기존 address_detail 데이터가 있다면 address에 병합하는 마이그레이션
-- (필요시 수동 실행)
-- UPDATE clients SET address = CONCAT(address, ' ', address_detail) WHERE address_detail IS NOT NULL AND address_detail != '';
-- UPDATE companies SET address = CONCAT(address, ' ', address_detail) WHERE address_detail IS NOT NULL AND address_detail != '';

