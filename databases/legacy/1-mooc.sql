/*
Recomendación de bases de datos (según el contexto de RAG local + este esquema):

- PostgreSQL + pgvector (principal): datos relacionales + búsqueda vectorial en el mismo sitio.
  - Este esquema ya lo asume (ver mooc.courses.embedding vector(768)).
- Redis (opcional): sesiones de chat, caché de retrieval/respuestas, rate limiting.
- OpenSearch/Elasticsearch (opcional): si necesitas ranking híbrido serio (keyword/BM25 + vector).
- ClickHouse (opcional): analítica/eventos a gran escala; si no, Postgres vale para logs.
- Object Storage (S3/MinIO) (opcional): binarios (imágenes/PDFs) y fuentes originales; en Postgres solo referencias/metadata.
*/

CREATE SCHEMA mooc;

CREATE TABLE mooc.users (
	id uuid PRIMARY KEY NOT NULL,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	profile_picture VARCHAR(255) NOT NULL,
	status VARCHAR(255) NOT NULL,
	suggested_courses jsonb,
	subscription_plan VARCHAR(32) NOT NULL DEFAULT 'FREE'
);

CREATE TABLE mooc.user_course_suggestions (
	user_id uuid PRIMARY KEY NOT NULL,
	completed_course_ids jsonb,
	suggested_courses jsonb
);

CREATE TABLE mooc.courses (
	id CHAR(4) PRIMARY KEY NOT NULL,
	name VARCHAR(255) NOT NULL,
	summary TEXT,
	categories jsonb NOT NULL,
	published_at DATE NOT NULL,
	embedding vector(768)
);
