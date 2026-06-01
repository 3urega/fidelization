import { StructuredOutputParser } from "@langchain/core/output_parsers";
import {
	ChatPromptTemplate,
	HumanMessagePromptTemplate,
	SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOllama } from "@langchain/ollama";
import { Service } from "diod";
import { z } from "zod";

import { Plan } from "../../plans/domain/Plan";
import { PlanSearchResult } from "../../plans/domain/PlanSearchResult";
import { PlanSuggestion } from "../domain/PlanSuggestion";
import { PlanSuggestionsGenerator } from "../domain/PlanSuggestionsGenerator";

@Service()
export class OllamaPlanSuggestionsGenerator implements PlanSuggestionsGenerator {
	async generate(query: string, context: PlanSearchResult[]): Promise<PlanSuggestion[]> {
		const outputParser = StructuredOutputParser.fromZodSchema(
			z.array(
				z.object({
					planId: z.string().describe("UUID del plan sugerido."),
					planTitle: z.string().describe("Título del plan sugerido."),
					reason: z.string().describe("Motivo por el que se sugiere este plan."),
				}),
			),
		);

		const chatPrompt = ChatPromptTemplate.fromMessages([
			SystemMessagePromptTemplate.fromTemplate(
				`
Eres un asistente de recomendación de planes de ocio. Tu tarea es sugerir los mejores planes de una lista proporcionada según la consulta del usuario. Ten en cuenta lo siguiente:
- Solo puedes elegir planes de la lista disponible.
- Usa únicamente la información proporcionada; no inventes planes ni datos que no estén en la lista.
- Tus sugerencias son en castellano neutro e inclusivo.
- Proporciona una razón clara y concisa en castellano para cada plan sugerido, relacionándola con la consulta del usuario.
- Responde únicamente con el siguiente formato JSON (no añadas \`\`\`json ni nada similar):

{format_instructions}
        `.trim(),
			),
			HumanMessagePromptTemplate.fromTemplate(
				`
Consulta del usuario: {query}

Planes disponibles (recuperados por similitud semántica):

{available_plans}
        `.trim(),
			),
		]);

		const chain = RunnableSequence.from([
			chatPrompt,
			new ChatOllama({
				model: "llama3.1:8b",
				temperature: 0,
			}),
			outputParser,
		]);

		const suggestions = await chain.invoke({
			query,
			available_plans: context.map((r) => this.formatResult(r)).join("\n\n"),
			format_instructions: outputParser.getFormatInstructions(),
		});

		return suggestions.map((s) => new PlanSuggestion(s.planId, s.planTitle, s.reason));
	}

	private formatResult(result: PlanSearchResult): string {
		const { plan, matchedChunkContent } = result;

		return this.formatPlan(plan, matchedChunkContent);
	}

	private formatPlan(plan: Plan, matchedChunk?: string): string {
		const p = plan.toPrimitives();
		const flags = [
			p.childrenFriendly !== null ? `apto para niños: ${p.childrenFriendly ? "sí" : "no"}` : null,
			p.vehicleRequired !== null ? `requiere vehículo: ${p.vehicleRequired ? "sí" : "no"}` : null,
			p.overnightPossible !== null
				? `posibilidad de pernocta: ${p.overnightPossible ? "sí" : "no"}`
				: null,
		]
			.filter(Boolean)
			.join(", ");

		return [
			`- Id: ${p.id}`,
			`  Título: ${p.title}`,
			p.location ? `  Ubicación: ${p.location}` : null,
			p.tags.length ? `  Tags: ${p.tags.join(", ")}` : null,
			flags ? `  Características: ${flags}` : null,
			`  Descripción: ${p.description}`,
			matchedChunk ? `  Fragmento relevante: ${matchedChunk}` : null,
		]
			.filter(Boolean)
			.join("\n");
	}
}
