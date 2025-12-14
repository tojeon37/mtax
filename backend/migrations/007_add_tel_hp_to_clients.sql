-- clients 테이블에 전화번호 및 휴대폰번호 컬럼 추가
ALTER TABLE clients 
ADD COLUMN tel VARCHAR(50) NULL COMMENT '전화번호',
ADD COLUMN hp VARCHAR(50) NULL COMMENT '휴대폰번호';

