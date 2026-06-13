import "reflect-metadata";

import { NextResponse } from "next/server";

import { UpdatePlatformGame } from "../../../../../contexts/platform/application/games/UpdatePlatformGame";
import { InvalidPlatformGame } from "../../../../../contexts/platform/domain/InvalidPlatformGame";
import { PlatformGameNotFound } from "../../../../../contexts/platform/domain/PlatformGameNotFound";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import { platformGameToJson } from "../../../../../lib/platform/games";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	label?: string;
	description?: string;
	status?: string;
	requiredFeature?: string;
	sortOrder?: number;
};

export async function PATCH(
	request: Request,
	context: { params: { gameId: string } },
): Promise<Response> {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	const auth = await requirePlatformSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	try {
		const game = await container.get(UpdatePlatformGame).execute({
			gameId: context.params.gameId,
			input: body,
		});

		return NextResponse.json({ game: platformGameToJson(game) });
	} catch (error) {
		if (error instanceof InvalidPlatformGame) {
			return HttpNextResponse.domainError(error, 400);
		}

		if (error instanceof PlatformGameNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
