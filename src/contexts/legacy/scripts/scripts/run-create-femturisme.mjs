import { OllamaEmbeddings } from "@langchain/ollama";
import crypto from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import postgres from "postgres";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const plans = JSON.parse(readFileSync(join(__dirname, "femturisme-plans.json"), "utf-8"));

const sql = postgres({
	host: "localhost",
	port: 5432,
	user: "codely",
	password: "c0d3ly7v",
	database: "postgres",
	onnotice: () => {},
});

const embeddings = new OllamaEmbeddings({
	model: "nomic-embed-text",
	baseUrl: "http://localhost:11434",
});

/**
 * Chunking estructural/semántico:
 * - Cada chunk es una sección lógica → búsquedas más precisas
 * - Metadata rica por separado → facilita filtrar "sin coche", "con niños"
 * - El header (plan + título) se repite para acotar contexto y desambiguar
 */
function buildStructuralChunks(p) {
	const header = `Plan: ${p.title}\n`;
	const chunks = [];

	// Chunk 1: identidad (ubicación, tags) → "cerca de Barcelona", "naturaleza", "playa"
	const identity = [
		header,
		`Ubicación: ${p.location || "No especificada"}`,
		`Tags: ${(p.tags || []).join(", ")}`,
	].join("\n");
	chunks.push(identity);

	// Chunk 2: requisitos/acceso → "sin coche", "con niños", "escapada con noche"
	const requisitos = [
		header,
		`Apto para familias con niños: ${formatBool(p.children_friendly)}`,
		`Requiere coche: ${formatBool(p.vehicle_required)}`,
		`Posible pernoctar: ${formatBool(p.overnight_possible)}`,
	].join("\n");
	chunks.push(requisitos);

	// Chunk 3: descripción → queries semánticas sobre contenido
	const descripcion = [header, `Descripción: ${p.description}`].join("\n");
	chunks.push(descripcion);

	return chunks;
}

function formatBool(v) {
	if (v === true) {
		return "sí";
	}
	if (v === false) {
		return "no";
	}

	return "no especificado";
}

async function upsertPlan(p) {
	await sql`
		INSERT INTO femturisme.plans (
			id, title, description, location, url, tags,
			children_friendly, vehicle_required, overnight_possible
		)
		VALUES (
			${p.id},
			${p.title},
			${p.description},
			${p.location},
			${p.url},
			${JSON.stringify(p.tags || [])}::jsonb,
			${p.children_friendly},
			${p.vehicle_required},
			${p.overnight_possible}
		)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			location = EXCLUDED.location,
			url = EXCLUDED.url,
			tags = EXCLUDED.tags,
			children_friendly = EXCLUDED.children_friendly,
			vehicle_required = EXCLUDED.vehicle_required,
			overnight_possible = EXCLUDED.overnight_possible,
			updated_at = NOW();
	`;
}

async function replaceChunks(planId, chunks) {
	await sql`DELETE FROM femturisme.plan_chunks WHERE plan_id = ${planId};`;

	for (let idx = 0; idx < chunks.length; idx++) {
		const id = crypto.randomUUID();
		const content = chunks[idx];
		const [vector] = await embeddings.embedDocuments([content]);
		await sql`
			INSERT INTO femturisme.plan_chunks (id, plan_id, chunk_index, content, embedding)
			VALUES (
				${id},
				${planId},
				${idx},
				${content},
				${JSON.stringify(vector)}
			);
		`;
	}
}

async function main() {
	console.log("Seeding femturisme...");

	for (const p of plans) {
		await upsertPlan(p);

		const chunks = buildStructuralChunks(p);
		await replaceChunks(p.id, chunks);

		console.log(`  + ${p.id} (${chunks.length} chunks) ${p.title}`);
	}

	await sql.end();
	console.log("Done!");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
