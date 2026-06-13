import { Service } from "diod";

import { Prisma } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import {
	type DiscoverableEstablishment,
	type DiscoverableEstablishmentsPage,
} from "../domain/DiscoverableEstablishment";
import { Tenant } from "../domain/Tenant";
import type { ListDiscoverableEstablishmentsParams } from "../domain/TenantRepository";
import { TenantBrandingUpdate } from "../domain/TenantBrandingUpdate";
import { TenantProfileUpdate } from "../domain/TenantProfileUpdate";
import type { TenantPlatformProfileUpdate } from "../domain/TenantPlatformProfileUpdate";
import {
	parseTenantFeatureOverrides,
	type TenantFeatureOverrides,
} from "../../../billing/subscriptions/domain/TenantFeatureOverrides";
import { TenantRepository } from "../domain/TenantRepository";
import { TenantStatus } from "../domain/TenantStatus";
import { discoveryTagsFromPrisma, tenantFromPrismaRow } from "./tenantFromPrismaRow";

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
		const offset = Math.max(params.offset, 0);
		const skip = offset;
		const filterTags = params.tags ?? [];

		const where = {
			status: TenantStatus.Active,
			...(filterTags.length > 0
				? {
						OR: filterTags.map((tag) => ({
							discoveryTags: {
								array_contains: tag,
							},
						})),
					}
				: {}),
		} satisfies Prisma.TenantWhereInput;

		const rows = await prisma.tenant.findMany({
			where,
			orderBy: [{ name: "asc" }, { id: "asc" }],
			skip,
			take: limit + 1,
			select: {
				id: true,
				name: true,
				slug: true,
				logoUrl: true,
				coverImageUrl: true,
				discoveryTags: true,
			},
		});

		const hasMore = rows.length > limit;
		const pageRows = hasMore ? rows.slice(0, limit) : rows;
		const establishments: DiscoverableEstablishment[] = pageRows.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug,
			logoUrl: row.logoUrl?.trim() ? row.logoUrl.trim() : null,
			coverImageUrl: row.coverImageUrl?.trim() ? row.coverImageUrl.trim() : null,
			tags: discoveryTagsFromPrisma(row.discoveryTags),
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

	async updatePlatformProfile(
		tenantId: string,
		profile: TenantPlatformProfileUpdate,
	): Promise<Tenant | null> {
		try {
			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: {
					...(profile.name !== undefined ? { name: profile.name } : {}),
					...(profile.slug !== undefined ? { slug: profile.slug } : {}),
				},
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}

	async updateProfile(tenantId: string, profile: TenantProfileUpdate): Promise<Tenant | null> {
		try {
			const geolocationData =
				profile.geolocation === undefined
					? {}
					: profile.geolocation === null
						? {
								latitude: null,
								longitude: null,
								geocodingProvider: null,
								geocodedAt: null,
							}
						: {
								latitude: profile.geolocation.latitude,
								longitude: profile.geolocation.longitude,
								geocodingProvider: profile.geolocation.geocodingProvider,
								geocodedAt: profile.geolocation.geocodedAt,
							};

			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: {
					...(profile.address !== undefined ? { address: profile.address } : {}),
					...(profile.description !== undefined ? { description: profile.description } : {}),
					...(profile.discoveryTags !== undefined
						? { discoveryTags: profile.discoveryTags }
						: {}),
					...geolocationData,
				},
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}

	async updateCoverImageUrl(tenantId: string, coverImageUrl: string): Promise<Tenant | null> {
		try {
			const row = await prisma.tenant.update({
				where: { id: tenantId },
				data: { coverImageUrl },
			});

			return tenantFromPrismaRow(row);
		} catch {
			return null;
		}
	}

	async findFeatureOverrides(tenantId: string): Promise<TenantFeatureOverrides | null> {
		const row = await prisma.tenant.findUnique({
			where: { id: tenantId },
			select: { features: true },
		});

		if (!row) {
			return null;
		}

		return parseTenantFeatureOverrides(row.features);
	}

	async updateFeatureOverrides(
		tenantId: string,
		overrides: TenantFeatureOverrides | null,
	): Promise<void> {
		await prisma.tenant.update({
			where: { id: tenantId },
			data: { features: overrides ?? Prisma.JsonNull },
		});
	}
}
