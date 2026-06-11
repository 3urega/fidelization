import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import {
	type DiscoverableEstablishment,
	type DiscoverableEstablishmentsPage,
} from "../domain/DiscoverableEstablishment";
import { Tenant } from "../domain/Tenant";
import type { ListDiscoverableEstablishmentsParams } from "../domain/TenantRepository";
import { TenantBrandingUpdate } from "../domain/TenantBrandingUpdate";
import { TenantProfileUpdate } from "../domain/TenantProfileUpdate";
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

	async listDiscoverableActive(
		params: ListDiscoverableEstablishmentsParams,
	): Promise<DiscoverableEstablishmentsPage> {
		const limit = Math.min(Math.max(params.limit, 1), 50);
		const page = Math.max(params.page, 0);
		const skip = page * limit;

		const rows = await prisma.tenant.findMany({
			where: { status: TenantStatus.Active },
			orderBy: [{ name: "asc" }, { id: "asc" }],
			skip,
			take: limit + 1,
			select: { id: true, name: true, slug: true, logoUrl: true },
		});

		const hasMore = rows.length > limit;
		const pageRows = hasMore ? rows.slice(0, limit) : rows;
		const establishments: DiscoverableEstablishment[] = pageRows.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug,
			logoUrl: row.logoUrl?.trim() ? row.logoUrl.trim() : null,
		}));

		return { establishments, hasMore };
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

	async updateProfile(tenantId: string, profile: TenantProfileUpdate): Promise<Tenant | null> {
		try {
			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: {
					...(profile.address !== undefined ? { address: profile.address } : {}),
					...(profile.description !== undefined ? { description: profile.description } : {}),
				},
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}
}
