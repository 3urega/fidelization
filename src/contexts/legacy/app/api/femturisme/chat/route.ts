import "reflect-metadata";

import { NextResponse } from "next/server";

import { PlanSuggester } from "../../../../contexts/femturisme/plan_suggestions/application/suggest/PlanSuggester";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";

const suggester = container.get(PlanSuggester);

export async function POST(request: Request): Promise<NextResponse> {
	const { query } = (await request.json()) as { query: string };

	if (!query || !query.trim()) {
		return NextResponse.json({ error: "El campo 'query' es obligatorio." }, { status: 400 });
	}

	const suggestions = await suggester.suggest(query.trim());

	return NextResponse.json({
		suggestions: suggestions.map((s) => s.toPrimitives()),
	});
}
