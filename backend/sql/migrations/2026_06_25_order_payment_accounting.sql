ALTER TABLE orders
  MODIFY request_channel ENUM('KAKAO', 'PHONE', 'SMS', 'ADMIN', 'SHOP', 'ETC') NOT NULL DEFAULT 'ADMIN'
  COMMENT '주문 접수 경로: KAKAO 카카오톡, PHONE 전화, SMS 문자, ADMIN 관리자입력, SHOP 사용자페이지, ETC 기타';

ALTER TABLE payments
  ADD COLUMN provider VARCHAR(30) NULL COMMENT '결제 제공사: TOSS 등' AFTER paid_at,
  ADD COLUMN provider_payment_key VARCHAR(120) NULL COMMENT '외부 결제 승인 키' AFTER provider,
  ADD COLUMN provider_order_id VARCHAR(120) NULL COMMENT '외부 결제 주문번호' AFTER provider_payment_key,
  ADD COLUMN provider_transaction_id VARCHAR(120) NULL COMMENT '외부 거래 식별자' AFTER provider_order_id,
  ADD COLUMN receipt_url VARCHAR(500) NULL COMMENT '영수증 URL' AFTER provider_transaction_id,
  ADD COLUMN raw_payload JSON NULL COMMENT '결제사 원본 응답' AFTER receipt_url,
  ADD COLUMN accounting_status ENUM('UNMATCHED', 'MATCHED', 'EXCLUDED') NOT NULL DEFAULT 'UNMATCHED'
    COMMENT '회계/입금 매칭 상태' AFTER raw_payload,
  ADD COLUMN deposit_account_id BIGINT UNSIGNED NULL COMMENT '입금 확인 계좌 ID' AFTER accounting_status,
  ADD COLUMN bank_transaction_id BIGINT UNSIGNED NULL COMMENT '매칭된 은행 거래내역 ID' AFTER deposit_account_id,
  ADD COLUMN reconciled_at DATETIME NULL COMMENT '정산 매칭 일시' AFTER bank_transaction_id,
  ADD UNIQUE KEY uq_payments_provider_payment_key (provider_payment_key),
  ADD KEY idx_payments_provider_order_id (provider_order_id),
  ADD KEY idx_payments_accounting_status (accounting_status);
