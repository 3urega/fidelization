import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Tenant } from "../domain/Tenant";
import { TenantBrandingUpdate } from "../domain/TenantBrandingUpdate";
import { TenantRepository } from "../domain/TenantRepository";
import { TenantStatus } from "../domain/TenantStatus";
import { tenantFromPrismaRow } from "./tenantFromPrismaRow";

@Service()
export class PrismaTenantRepository extends TenantRepository {
	async findAll(): Promise<Tenant[]> {
		const rows = await prisma.tenant.findMany({
			orderBy: { createdAt: "desc" },
		});

		return rows.map((row) => tenantFromPrismaRow(row));
	}

	async findById(tenantId: string): Promise<Tenant | null> {
		const row = await prisma.tenant.findUnique({ where: { id: tenantId } });

		if (!row) {
			return null;
		}

		return tenantFromPrismaRow(row);
	}

	async findBySlug(slug: string): Promise<Tenant | null> {
		const row = await prisma.tenant.findUnique({
			where: { slug: slug.trim().toLowerCase() },
		});

		if (!row) {
			return null;
		}

		return tenantFromPrismaRow(row);
	}

	async updateStatus(tenantId: string, status: TenantStatus): Promise<Tenant | null> {
		try {
			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: { status },
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}

	async updateBranding(tenantId: string, branding: TenantBrandingUpdate): Promise<Tenant | null> {
		try {
			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: {
					...(branding.logoUrl !== undefined ? { logoUrl: branding.logoUrl } : {}),
					...(branding.primaryColor !== undefined ? { primaryColor: branding.primaryColor } : {}),
					...(branding.secondaryColor !== undefined
						? { secondaryColor: branding.secondaryColor }
						: {}),
				},
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}
}
