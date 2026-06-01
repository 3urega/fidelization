import { OllamaEmbeddings } from "@langchain/ollama";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import postgres from "postgres";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const courses = JSON.parse(readFileSync(join(__dirname, "courses.json"), "utf-8"));

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

function serialize(c) {
	return [
		`Name: ${c.name}`,
		`Summary: ${c.summary}`,
		`Categories: ${(c.categories || []).join(", ")}`,
	].join("|");
}

async function main() {
	console.log("Creating courses...");
	for (const c of courses) {
		const doc = serialize(c);
		const [vector] = await embeddings.embedDocuments([doc]);
		await sql`
			INSERT INTO mooc.courses (id, name, summary, categories, published_at, embedding)
			VALUES (
				${c.id},
				${c.name},
				${c.summary || ""},
				${c.categories || []},
				${new Date(c.published_at)},
				${JSON.stringify(vector)}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				summary = EXCLUDED.summary,
				categories = EXCLUDED.categories,
				published_at = EXCLUDED.published_at,
				embedding = EXCLUDED.embedding;
		`;
		console.log("  +", c.id, c.name);
	}
	await sql.end();
	console.log("Done!");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
