-- order_items.item_status CHECK 제약에 '품절(out_of_stock)', '단종(discontinued)' 추가

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_item_status_check;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_item_status_check
  CHECK (item_status IN (
    'pending', 'confirmed', 'cancelled', 'on_hold', 'delayed', 'returned',
    'out_of_stock', 'discontinued'
  ));
