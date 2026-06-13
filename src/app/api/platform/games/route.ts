import "reflect-metadata";

import { NextResponse } from "next/server";

import { CreatePlatformGame } from "../../../../contexts/platform/application/games/CreatePlatformGame";
import { ListPlatformGames } from "../../../../contexts/platform/application/games/ListPlatformGames";
import { InvalidPlatformGame } from "../../../../contexts/platform/domain/InvalidPlatformGame";
import { PlatformGameSlugAlreadyExists } from "../../../../contexts/platform/domain/PlatformGameSlugAlreadyExists";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import { platformGameToJson, platformGamesToJson } from "../../../../lib/platform/games";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PostBody = {
	slug?: string;
	label?: string;
	description?: string;
	status?: string;
	requiredFeature?: string;
	sortOrder?: number;
};

export async function GET(request: Request): Promise<Response> {
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

	const games = await container.get(ListPlatformGames).execute();

	return NextResponse.json(platformGamesToJson(games));
}

export async function POST(request: Request): Promise<Response> {
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

	let body: PostBody;
	try {
		body = (await request.json()) as PostBody;
	} catch {
		return NextResponse.json({ error: { description: "Invalid JSON body" } }, { status: 400 });
	}

	try {
		const game = await container.get(CreatePlatformGame).execute({ input: body });

		return NextResponse.json({ game: platformGameToJson(game) }, { status: 201 });
	} catch (error) {
		if (error instanceof InvalidPlatformGame) {
			return HttpNextResponse.domainError(error, 400);
		}

		if (error instanceof PlatformGameSlugAlreadyExists) {
			return HttpNextResponse.domainError(error, 409);
		}

		throw error;
	}
}
