import { NextResponse } from "next/server";

import { loadTenantBySlugPrisma } from "../../../../lib/tenant/loadTenantBySlugPrisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase();
	if (!slug) {
		return NextResponse.json({ error: { description: "slug query required" } }, { status: 400 });
	}

	const tenant = await loadTenantBySlugPrisma(slug);

	if (!tenant) {
		return NextResponse.json({ error: { description: "tenant not found" } }, { status: 404 });
	}

	return NextResponse.json(tenant);
}
