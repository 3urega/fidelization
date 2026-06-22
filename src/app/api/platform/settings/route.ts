import "reflect-metadata";

import { NextResponse } from "next/server";

import { GetPlatformSettings } from "../../../../contexts/platform/application/settings/GetPlatformSettings";
import { UpdatePlatformSettings } from "../../../../contexts/platform/application/settings/UpdatePlatformSettings";
import { InvalidPlatformBranding } from "../../../../contexts/platform/domain/InvalidPlatformBranding";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { requirePlatformSession } from "../../../../lib/auth/requirePlatformSession";
import { platformBrandingToJson, platformSettingsToJson } from "../../../../lib/platform/settings";
import { getResolvedTenantFromRequest } from "../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

type PatchBody = {
	displayName?: unknown;
	logoUrl?: unknown;
};

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

	const settings = await container.get(GetPlatformSettings).execute();

	return NextResponse.json(platformSettingsToJson(settings));
}

export async function PATCH(request: Request): Promise<Response> {
	const forbidden = forbiddenOnTenantSubdomain(request);

	if (forbidden) {
		return forbidden;
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
		const branding = await container.get(UpdatePlatformSettings).execute({
			branding: {
				displayName: body.displayName === undefined ? undefined : String(body.displayName),
				logoUrl: body.logoUrl === undefined ? undefined : String(body.logoUrl),
			},
		});

		return NextResponse.json({ branding: platformBrandingToJson(branding) });
	} catch (error) {
		if (error instanceof InvalidPlatformBranding) {
			return HttpNextResponse.domainError(error, 400);
		}

		throw error;
	}
}
