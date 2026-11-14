-- Inquiry management extensions for Mission 02A.3.

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS submission_id TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS inquiries_submission_id_unique
  ON inquiries (submission_id)
  WHERE submission_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS inquiry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS inquiry_events_inquiry_created_at_idx
  ON inquiry_events (inquiry_id, created_at ASC);