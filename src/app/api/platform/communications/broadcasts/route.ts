import "reflect-metadata";

import { NextResponse } from "next/server";

import { ListPlatformBroadcasts } from "../../../../../contexts/platform/application/communications/ListPlatformBroadcasts";
import { PreviewPlatformBroadcast } from "../../../../../contexts/platform/application/communications/PreviewPlatformBroadcast";
import { SendPlatformBroadcast } from "../../../../../contexts/platform/application/communications/SendPlatformBroadcast";
import { InvalidPlatformBroadcast } from "../../../../../contexts/platform/domain/InvalidPlatformBroadcast";
import { PlatformBroadcastRateLimitExceeded } from "../../../../../contexts/platform/domain/PlatformBroadcastRateLimitExceeded";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../../lib/auth/requirePlatformSession";
import {
	platformBroadcastPreviewToJson,
	platformBroadcastsPageToJson,
	platformBroadcastToJson,
} from "../../../../../lib/platform/communications";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PostBody = {
	channel?: unknown;
	audienceType?: unknown;
	tenantId?: unknown;
	subject?: unknown;
	body?: unknown;
	confirmed?: boolean;
};

function parseNonNegativeInt(value: string | null, fallback: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
	if (!value) {
		return fallback;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 1) {
		return fallback;
	}

	return Math.min(parsed, max);
}

function forbiddenOnTenantSubdomain(request: Request): Response | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{ error: { description: "Forbidden on business subdomain" } },
			{ status: 403 },
		);
	}

	return null;
}

export async function GET(request: Request): Promise<Response> {
	const forbidden = forbiddenOnTenantSubdomain(request);

	if (forbidden) {
		return forbidden;
	}

	const auth = await requirePlatformSession(request);

	if (auth instanceof NextResponse) {
		return auth;
	}

	const { searchParams } = new URL(request.url);
	const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
	const offset = parseNonNegativeInt(searchParams.get("offset"), 0);

	const page = await container.get(ListPlatformBroadcasts).execute({ limit, offset });

	return NextResponse.json(platformBroadcastsPageToJson(page));
}

export async function POST(request: Request): Promise<Response> {
	const forbidden = forbiddenOnTenantSubdomain(request);

	if (forbidden) {
		return forbidden;
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

	const input = {
		channel: body.channel,
		audienceType: body.audienceType,
		tenantId: body.tenantId,
		subject: body.subject,
		body: body.body,
	};

	try {
		if (body.confirmed === true) {
			const broadcast = await container.get(SendPlatformBroadcast).execute({
				createdByUserId: auth.session.userId,
				input,
			});

			return NextResponse.json(
				{ broadcast: platformBroadcastToJson(broadcast) },
				{ status: 201 },
			);
		}

		const preview = await container.get(PreviewPlatformBroadcast).execute({ input });

		return NextResponse.json(platformBroadcastPreviewToJson(preview));
	} catch (error) {
		if (error instanceof InvalidPlatformBroadcast) {
			return HttpNextResponse.domainError(error, 400);
		}

		if (error instanceof PlatformBroadcastRateLimitExceeded) {
			return HttpNextResponse.domainError(error, 429);
		}

		throw error;
	}
}
