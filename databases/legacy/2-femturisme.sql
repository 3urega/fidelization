-- femturisme: RAG + chat schema (separado de mooc)
-- Requiere extensión pgvector habilitada (ver databases/0-enable-pgvector.sql)

CREATE SCHEMA IF NOT EXISTS femturisme;

-- Planes (entidad principal)
CREATE TABLE IF NOT EXISTS femturisme.plans (
	id uuid PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	location VARCHAR(255),
	url TEXT,
	tags jsonb NOT NULL DEFAULT '[]'::jsonb,
	children_friendly BOOLEAN,
	vehicle_required BOOLEAN,
	overnight_possible BOOLEAN,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunks para RAG (1..N por plan). Embedding a nivel chunk.
CREATE TABLE IF NOT EXISTS femturisme.plan_chunks (
	id uuid PRIMARY KEY,
	plan_id uuid NOT NULL REFERENCES femturisme.plans(id) ON DELETE CASCADE,
	chunk_index INTEGER NOT NULL,
	content TEXT NOT NULL,
	embedding vector(768),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (plan_id, chunk_index)
);

-- Sesiones de chat
CREATE TABLE IF NOT EXISTS femturisme.chat_sessions (
	id uuid PRIMARY KEY,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mensajes (historial)
CREATE TABLE IF NOT EXISTS femturisme.chat_messages (
	id uuid PRIMARY KEY,
	session_id uuid NOT NULL REFERENCES femturisme.chat_sessions(id) ON DELETE CASCADE,
	role VARCHAR(20) NOT NULL CHECK (role IN ('system','user','assistant')),
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estado “persistente” de clarificación (para no repetir preguntas)
CREATE TABLE IF NOT EXISTS femturisme.chat_state (
	session_id uuid PRIMARY KEY REFERENCES femturisme.chat_sessions(id) ON DELETE CASCADE,
	has_children BOOLEAN,
	has_vehicle BOOLEAN,
	wants_overnight BOOLEAN,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_femturisme_plan_chunks_plan_id
	ON femturisme.plan_chunks(plan_id);

CREATE INDEX IF NOT EXISTS idx_femturisme_chat_messages_session_id_created_at
	ON femturisme.chat_messages(session_id, created_at);

-- Vector index (opcional; se activa cuando el volumen crezca lo suficiente)
-- CREATE INDEX IF NOT EXISTS idx_femturisme_plan_chunks_embedding_hnsw
--   ON femturisme.plan_chunks USING hnsw (embedding vector_l2_ops);

