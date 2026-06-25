-- ============================================================
-- Hospital Blog / Case Library — DB Migration
-- 작성: 2026-06-24
-- Supabase SQL Editor에서 실행
--
-- 테이블 구성:
--   1. blog_posts       — 케이스 포스트 메타 + 섹션 콘텐츠(JSONB)
--   2. blog_post_images — 케이스 이미지 + 태그
-- ============================================================


-- ============================================================
-- 1. blog_posts
-- ============================================================
CREATE TABLE blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  hos_id           uuid        NOT NULL REFERENCES hospitals(hos_id) ON DELETE CASCADE,
  created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  title            text        NOT NULL,
  status           text        NOT NULL DEFAULT 'draft'
                                 CHECK (status IN ('draft', 'published', 'archived')),

  case_category    text        NOT NULL DEFAULT '',   -- 외과 | 안과 | 치과 | 소화기내과 | ...
  diagnosis        text,
  species          text        CHECK (species IN ('canine', 'feline', 'exotic', 'etc')),
  summary          text,                              -- 한줄 요약 (목록 카드 표시)

  -- 섹션 기반 콘텐츠 배열
  -- [{ type:'section', title:'...', body:'...' } | { type:'image_row', image_ids:['uuid'] } | { type:'disease_info', body:'...' }]
  content          jsonb       NOT NULL DEFAULT '[]'::jsonb,

  cover_image_url  text,
  pdf_url          text,                              -- 원본 EMR PDF 경로 (blog-posts 버킷)
  blood_test_data  jsonb,                             -- 혈액검사 표 { headers:[], rows:[][] }

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();

-- 인덱스
CREATE INDEX idx_blog_posts_hos_id        ON blog_posts(hos_id);
CREATE INDEX idx_blog_posts_status        ON blog_posts(hos_id, status);
CREATE INDEX idx_blog_posts_case_category ON blog_posts(hos_id, case_category);
CREATE INDEX idx_blog_posts_created_at    ON blog_posts(hos_id, created_at DESC);


-- ============================================================
-- 2. blog_post_images
-- ============================================================
CREATE TABLE blog_post_images (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id   uuid        NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  hos_id         uuid        NOT NULL,

  image_url      text        NOT NULL,
  tags           text[]      NOT NULL DEFAULT '{}',  -- 진단 | 치료 | 병변 | 수술 | 초음파 | 방사선 | 장기 | 경과
  caption        text,
  order_index    integer     NOT NULL DEFAULT 0,

  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_post_images_blog_post_id ON blog_post_images(blog_post_id);
CREATE INDEX idx_blog_post_images_order        ON blog_post_images(blog_post_id, order_index);


-- ============================================================
-- 3. RLS (Row Level Security)
-- ============================================================
ALTER TABLE blog_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_images ENABLE ROW LEVEL SECURITY;

-- blog_posts
CREATE POLICY "blog_posts_select" ON blog_posts
  FOR SELECT TO authenticated USING (hos_id = get_my_hos_id());

CREATE POLICY "blog_posts_insert" ON blog_posts
  FOR INSERT TO authenticated WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "blog_posts_update" ON blog_posts
  FOR UPDATE TO authenticated
  USING (hos_id = get_my_hos_id())
  WITH CHECK (hos_id = get_my_hos_id());

CREATE POLICY "blog_posts_delete" ON blog_posts
  FOR DELETE TO authenticated USING (hos_id = get_my_hos_id());

-- blog_post_images (blog_posts를 통해 병원 검증)
CREATE POLICY "blog_post_images_select" ON blog_post_images
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blog_posts p WHERE p.id = blog_post_id AND p.hos_id = get_my_hos_id()
  ));

CREATE POLICY "blog_post_images_insert" ON blog_post_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM blog_posts p WHERE p.id = blog_post_id AND p.hos_id = get_my_hos_id()
  ));

CREATE POLICY "blog_post_images_update" ON blog_post_images
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blog_posts p WHERE p.id = blog_post_id AND p.hos_id = get_my_hos_id()
  ));

CREATE POLICY "blog_post_images_delete" ON blog_post_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM blog_posts p WHERE p.id = blog_post_id AND p.hos_id = get_my_hos_id()
  ));
