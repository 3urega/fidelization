import { prisma } from "../prisma";
import type { ResolvedTenant } from "./resolveTenant";

/** Node-only: lookup tenant slug in Postgres (API routes / server when middleware headers absent). */
export async function loadTenantBySlugPrisma(slug: string): Promise<ResolvedTenant | null> {
	const tenant = await prisma.tenant.findUnique({
		where: { slug: slug.toLowerCase().trim() },
		select: { id: true, slug: true, status: true },
	});

	if (!tenant || tenant.status !== "active") {
		return null;
	}

	return { slug: tenant.slug, tenantId: tenant.id };
}
