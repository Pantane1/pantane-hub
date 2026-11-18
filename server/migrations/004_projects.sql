CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  problem_solved TEXT,
  solution_summary TEXT,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT,
  cover_image TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  live_url TEXT,
  repo_url TEXT,
  github_repo_id BIGINT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS projects_github_repo_id_unique
  ON projects (github_repo_id)
  WHERE github_repo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS projects_published_order_idx
  ON projects (is_published, display_order, created_at DESC);

CREATE INDEX IF NOT EXISTS projects_featured_idx
  ON projects (is_featured, display_order);

CREATE INDEX IF NOT EXISTS projects_category_idx
  ON projects (category);