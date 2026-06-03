import { randomUUID } from "crypto";

import { prisma } from "../../../../lib/prisma";
import { slugifyBusinessName } from "../../../../lib/tenant/slugifyBusinessName";

export async function resolveUniqueTenantSlug(baseSlug: string): Promise<string> {
	const existing = await prisma.tenant.findUnique({ where: { slug: baseSlug } });

	if (!existing) {
		return baseSlug;
	}

	return `${baseSlug}-${randomUUID().slice(0, 8)}`;
}

export function slugFromBusinessName(businessName: string): string {
	return slugifyBusinessName(businessName);
}
