-- Initial operational schema for PantaneHub central admin dashboard.
-- This migration is intentionally additive and idempotent.

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  requirements TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_error TEXT,
  last_notified_at TIMESTAMPTZ,
  CONSTRAINT inquiries_status_check CHECK (
    status IN ('new', 'contacted', 'in_progress', 'completed', 'archived')
  ),
  CONSTRAINT inquiries_notification_status_check CHECK (
    notification_status IN ('pending', 'sent', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS inquiries_status_created_at_idx
  ON inquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS inquiries_email_idx
  ON inquiries (email);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending',
  notification_error TEXT,
  last_notified_at TIMESTAMPTZ,
  CONSTRAINT contact_messages_notification_status_check CHECK (
    notification_status IN ('pending', 'sent', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  amount NUMERIC(12, 2),
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL DEFAULT 'pending',
  payer_phone TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT payment_transactions_status_check CHECK (
    status IN ('pending', 'successful', 'failed', 'cancelled')
  ),
  CONSTRAINT payment_transactions_provider_reference_unique UNIQUE (provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS payment_transactions_created_at_idx
  ON payment_transactions (created_at DESC);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider_reference TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processing_status TEXT NOT NULL DEFAULT 'received',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  CONSTRAINT payment_webhook_events_status_check CHECK (
    processing_status IN ('received', 'processed', 'failed', 'duplicate')
  )
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_received_at_idx
  ON payment_webhook_events (received_at DESC);

CREATE TABLE IF NOT EXISTS notification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_type TEXT NOT NULL,
  target_id UUID,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_attempts_status_check CHECK (
    status IN ('pending', 'sent', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS notification_attempts_target_idx
  ON notification_attempts (target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor TEXT NOT NULL DEFAULT 'shared-admin',
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx
  ON admin_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx
  ON admin_audit_log (action, created_at DESC);

-- Retention policy: audit records are retained for 24 months unless legal or
-- business requirements require a different period. Automated purge is not
-- enabled in this migration.