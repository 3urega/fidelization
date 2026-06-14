import "reflect-metadata";

import { NextResponse } from "next/server";

import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantRole } from "../../../../contexts/tenants/memberships/domain/TenantRole";
import { TenantRepository } from "../../../../contexts/tenants/tenants/domain/TenantRepository";
import { requireTenantSession } from "../../../../lib/auth/requireTenantSession";
import {
	buildTenantGeocodingStaticMapUrl,
	resolveStaticMapCredentials,
} from "../../../../lib/tenant/buildTenantGeocodingStaticMapUrl";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	if (auth.session.role !== TenantRole.Owner) {
		return NextResponse.json(
			{ error: { description: "Only the business owner can view the map preview." } },
			{ status: 403 },
		);
	}

	const tenant = await container.get(TenantRepository).findById(auth.session.tenantId);
	if (!tenant) {
		return NextResponse.json({ error: { description: "Tenant not found." } }, { status: 404 });
	}

	const latitude = tenant.latitude;
	const longitude = tenant.longitude;

	if (latitude === null || longitude === null) {
		return NextResponse.json(
			{ error: { description: "No geocoded coordinates available for this tenant." } },
			{ status: 404 },
		);
	}

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
}
