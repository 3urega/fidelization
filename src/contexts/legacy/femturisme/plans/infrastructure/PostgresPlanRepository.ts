import { OllamaEmbeddings } from "@langchain/ollama";
import { randomUUID } from "crypto";
import { Service } from "diod";

import { PostgresConnection } from "../../../shared/infrastructure/postgres/PostgresConnection";
import { Plan } from "../domain/Plan";
import { PlanId } from "../domain/PlanId";
import { PlanRepository } from "../domain/PlanRepository";
import { PlanSearchResult } from "../domain/PlanSearchResult";

type PlanRow = {
	id: string;
	title: string;
	description: string;
	location: string | null;
	url: string | null;
	tags: string[];
	children_friendly: boolean | null;
	vehicle_required: boolean | null;
	overnight_possible: boolean | null;
};

type SearchSimilarRow = PlanRow & { matched_chunk_content: string };

@Service()
export class PostgresPlanRepository implements PlanRepository {
	private readonly embeddings: OllamaEmbeddings;

	constructor(private readonly connection: PostgresConnection) {
		this.embeddings = new OllamaEmbeddings({
			model: "nomic-embed-text",
			baseUrl: "http://localhost:11434",
		});
	}

	async save(plan: Plan): Promise<void> {
		const p = plan.toPrimitives();

		await this.connection.sql`
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
				${JSON.stringify(p.tags)}::jsonb,
				${p.childrenFriendly},
				${p.vehicleRequired},
				${p.overnightPossible}
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

		const chunks = this.buildStructuralChunks(p);

		await this.connection.sql`
			DELETE FROM femturisme.plan_chunks WHERE plan_id = ${p.id};
		`;

		await Promise.all(
			chunks.map(async (chunk, idx) => {
				const [vector] = await this.embeddings.embedDocuments([chunk]);
				const chunkId = randomUUID();

				await this.connection.sql`
					INSERT INTO femturisme.plan_chunks (id, plan_id, chunk_index, content, embedding)
					VALUES (${chunkId}, ${p.id}, ${idx}, ${chunk}, ${JSON.stringify(vector)});
				`;
			}),
		);
	}

	async search(id: PlanId): Promise<Plan | null> {
		const rows = await this.connection.sql`
			SELECT id, title, description, location, url, tags,
				children_friendly, vehicle_required, overnight_possible
			FROM femturisme.plans
			WHERE id = ${id.value};
		`;

		return rows.length ? this.toPlan(rows[0] as PlanRow) : null;
	}

	async searchSimilar(query: string, limit = 5): Promise<PlanSearchResult[]> {
		const [vector] = await this.embeddings.embedDocuments([query]);

		const rows = await this.connection.sql<SearchSimilarRow[]>`
			SELECT
				p.id, p.title, p.description, p.location, p.url, p.tags,
				p.children_friendly, p.vehicle_required, p.overnight_possible,
				pc.content AS matched_chunk_content
			FROM femturisme.plan_chunks pc
			JOIN femturisme.plans p ON p.id = pc.plan_id
			WHERE pc.embedding IS NOT NULL
			ORDER BY pc.embedding <-> ${JSON.stringify(vector)}
			LIMIT ${limit};
		`;

		return rows.map((row) => ({
			plan: this.toPlan(row),
			matchedChunkContent: row.matched_chunk_content,
		}));
	}

	private toPlan(row: PlanRow): Plan {
		const rawTags = row.tags;
		const tags: string[] = Array.isArray(rawTags)
			? rawTags
			: typeof rawTags === "string"
				? (JSON.parse(rawTags) as string[])
				: [];

		return Plan.fromPrimitives({
			id: row.id,
			title: row.title,
			description: row.description,
			location: row.location,
			url: row.url,
			tags,
			childrenFriendly: row.children_friendly,
			vehicleRequired: row.vehicle_required,
			overnightPossible: row.overnight_possible,
		});
	}

	private buildStructuralChunks(p: {
		title: string;
		description: string;
		location: string | null;
		tags: string[];
		childrenFriendly: boolean | null;
		vehicleRequired: boolean | null;
		overnightPossible: boolean | null;
	}): string[] {
		const header = `Plan: ${p.title}\n`;
		const chunks: string[] = [];

		chunks.push(
			[header, `Ubicación: ${p.location ?? "No especificada"}`, `Tags: ${p.tags.join(", ")}`].join(
				"\n",
			),
		);

		chunks.push(
			[
				header,
				`Apto para familias con niños: ${this.formatBool(p.childrenFriendly)}`,
				`Requiere coche: ${this.formatBool(p.vehicleRequired)}`,
				`Posible pernoctar: ${this.formatBool(p.overnightPossible)}`,
			].join("\n"),
		);

		chunks.push([header, `Descripción: ${p.description}`].join("\n"));

		return chunks;
	}

	private formatBool(v: boolean | null): string {
		if (v === true) {
			return "sí";
		}
		if (v === false) {
			return "no";
		}

		return "no especificado";
	}
}
