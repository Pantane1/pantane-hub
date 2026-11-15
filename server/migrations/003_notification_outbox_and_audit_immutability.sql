-- Durable notification outbox and append-only audit log protection.

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  CONSTRAINT notification_outbox_status_check CHECK (
    status IN ('pending', 'processing', 'sent', 'failed')
  ),
  CONSTRAINT notification_outbox_target_channel_unique UNIQUE (target_type, target_id, channel)
);

CREATE INDEX IF NOT EXISTS notification_outbox_status_next_attempt_idx
  ON notification_outbox (status, next_attempt_at, created_at);

CREATE OR REPLACE FUNCTION prevent_admin_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_audit_log_no_update_delete ON admin_audit_log;

CREATE TRIGGER admin_audit_log_no_update_delete
BEFORE UPDATE OR DELETE ON admin_audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_audit_log_mutation();