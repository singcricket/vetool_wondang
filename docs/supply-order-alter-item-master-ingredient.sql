-- ============================================================
-- item_master 테이블에 ingredient (성분명) 컬럼 추가
-- Supabase SQL Editor에 붙여넣기 후 실행
-- ============================================================

ALTER TABLE item_master
  ADD COLUMN IF NOT EXISTS ingredient text;

COMMENT ON COLUMN item_master.ingredient IS '성분명 — 약물의 경우 주성분명 입력 (예: Amoxicillin, Metronidazole). AI 매핑·검색에 활용됨';
