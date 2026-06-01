CREATE SCHEMA IF NOT EXISTS starter;

CREATE TABLE starter.users (
	id UUID PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	profile_picture TEXT NOT NULL DEFAULT '',
	password_hash TEXT NOT NULL,
	subscription_plan VARCHAR(32) NOT NULL DEFAULT 'FREE'
);

CREATE TABLE starter.google_play_subscriptions (
	purchase_token TEXT PRIMARY KEY NOT NULL,
	user_id UUID NOT NULL REFERENCES starter.users (id) ON DELETE CASCADE,
	product_id TEXT NOT NULL,
	expiry_time_ms BIGINT,
	auto_renewing BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_play_subscriptions_user_id
	ON starter.google_play_subscriptions (user_id);

-- Demo user (login via POST /api/auth/demo; password not used)
INSERT INTO starter.users (id, name, email, profile_picture, password_hash, subscription_plan)
VALUES (
	'00000000-0000-4000-8000-000000000001',
	'Usuario demo',
	'demo@starter.local',
	'',
	'$2a$10$unusedForDemoLoginOnlyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
	'FREE'
)
ON CONFLICT (id) DO NOTHING;
