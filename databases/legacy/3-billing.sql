-- Billing / Google Play: column on users + subscription ledger (Postgres).
-- Ejecuta después de 1-mooc.sql en initdb o aplica manualmente en BD existente.

ALTER TABLE mooc.users
	ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(32) NOT NULL DEFAULT 'FREE';

CREATE TABLE IF NOT EXISTS mooc.google_play_subscriptions (
	purchase_token TEXT PRIMARY KEY NOT NULL,
	user_id UUID NOT NULL REFERENCES mooc.users (id) ON DELETE CASCADE,
	product_id TEXT NOT NULL,
	expiry_time_ms BIGINT,
	auto_renewing BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_play_subscriptions_user_id
	ON mooc.google_play_subscriptions (user_id);
