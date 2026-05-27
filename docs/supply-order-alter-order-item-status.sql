-- order_items 에 품목별 상태 컬럼 추가
-- 도매상 확인 단계에서 품목마다 개별 처리 상태를 설정하기 위함

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_status text NOT NULL DEFAULT 'pending'
    CHECK (item_status IN ('pending', 'confirmed', 'cancelled', 'on_hold', 'delayed', 'returned'));

COMMENT ON COLUMN order_items.item_status IS
  'pending(미확인) | confirmed(확인) | cancelled(취소) | on_hold(보류) | delayed(지연) | returned(반품)';
