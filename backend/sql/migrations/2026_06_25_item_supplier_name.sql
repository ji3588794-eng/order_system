ALTER TABLE items
  ADD COLUMN supplier_name VARCHAR(120) NULL COMMENT '제품 업체명' AFTER category_name,
  ADD KEY idx_items_supplier_name (supplier_name);
