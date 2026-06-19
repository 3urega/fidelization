import "reflect-metadata";

import { NextResponse } from "next/server";

import { requireUserSession } from "../../../../../lib/auth/requireUserSession";
import {
	buildTenantGeocodingStaticMapUrl,
	InvalidStaticMapCoordinates,
	resolveStaticMapCredentials,
} from "../../../../../lib/tenant/buildTenantGeocodingStaticMapUrl";
import { getResolvedTenantFromRequest } from "../../../../../lib/tenant/getResolvedTenant";

export const dynamic = "force-dynamic";

function rejectIfTenantHost(request: Request): NextResponse | null {
	if (getResolvedTenantFromRequest(request)) {
		return NextResponse.json(
			{
				error: {
					description:
						"User search zone is only available on the apex host (no business subdomain).",
				},
			},
			{ status: 403 },
		);
	}

	return null;
}

function parseCoordinate(value: string | null): number | null {
	if (value === null || value.trim() === "") {
		return null;
	}

	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request): Promise<Response> {
	const tenantHostError = rejectIfTenantHost(request);
	if (tenantHostError) {
		return tenantHostError;
	}

	const auth = await requireUserSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const url = new URL(request.url);
	const latitude = parseCoordinate(url.searchParams.get("latitude"));
	const longitude = parseCoordinate(url.searchParams.get("longitude"));

	if (latitude === null || longitude === null) {
		return NextResponse.json(
			{ error: { description: "latitude and longitude query parameters are required" } },
			{ status: 400 },
		);
	}

	try {
		const credentials = resolveStaticMapCredentials();
		if (!credentials) {
			return NextResponse.json(
				{ error: { description: "Static map service is not configured." } },
				{ status: 503 },
			);
		}

		const mapUrl = buildTenantGeocodingStaticMapUrl({
			latitude,
			longitude,
			provider: credentials.provider,
			accessToken: credentials.token,
		});

		const upstream = await fetch(mapUrl);
		if (!upstream.ok) {
			return NextResponse.json(
				{ error: { description: "Failed to fetch static map image." } },
				{ status: 502 },
			);
		}

		const contentType = upstream.headers.get("content-type") ?? "image/png";
		const body = await upstream.arrayBuffer();

		return new Response(body, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "private, max-age=3600",
			},
		});
	} catch (error) {
		if (error instanceof InvalidStaticMapCoordinates) {
			return NextResponse.json({ error: { description: error.message } }, { status: 400 });
		}

		throw error;
	}
}
