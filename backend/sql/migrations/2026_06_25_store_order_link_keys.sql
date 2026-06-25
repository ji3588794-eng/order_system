ALTER TABLE store_items
  ADD COLUMN item_scope_key VARCHAR(80)
    GENERATED ALWAYS AS (CONCAT(store_id, ':', item_id, ':', COALESCE(machine_id, 0))) STORED
    COMMENT '매장-품목-머신 범위 중복 방지키' AFTER machine_id,
  ADD UNIQUE KEY uq_store_items_scope_key (item_scope_key);

ALTER TABLE order_items
  ADD COLUMN store_item_id BIGINT UNSIGNED NULL COMMENT '주문 당시 매장별 품목 ID' AFTER order_id,
  ADD KEY idx_order_items_store_item_id (store_item_id),
  ADD CONSTRAINT fk_order_items_store_item FOREIGN KEY (store_item_id) REFERENCES store_items(id);

UPDATE order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN store_items si
  ON si.store_id = o.store_id
 AND si.item_id = oi.item_id
 AND si.is_active = 1
SET oi.store_item_id = si.id
WHERE oi.store_item_id IS NULL
  AND oi.item_id IS NOT NULL;

ALTER TABLE stores
  ADD COLUMN store_uid VARCHAR(50) NULL COMMENT '시스템 내부 거래처 고유키' AFTER id;

UPDATE stores
   SET store_uid = CONCAT('S', LPAD(id, 8, '0'))
 WHERE store_uid IS NULL OR store_uid = '';

ALTER TABLE stores
  ADD UNIQUE KEY uq_stores_store_uid (store_uid),
  MODIFY store_uid VARCHAR(50) NOT NULL COMMENT '시스템 내부 거래처 고유키',
  MODIFY store_code VARCHAR(50) NULL COMMENT '세금계산서 발행/업무용 거래처 코드';

ALTER TABLE items
  MODIFY item_code VARCHAR(50) NOT NULL COMMENT '품목 코드';
