import { Service } from "diod";

import { Prisma } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import {
	type DiscoverableEstablishment,
	type DiscoverableEstablishmentsPage,
} from "../domain/DiscoverableEstablishment";
import type { DiscoverNearFilter } from "../domain/DiscoverNearFilter";
import type { EstablishmentMapMarker } from "../domain/EstablishmentMapMarker";
import { roundDistanceKm } from "../domain/haversineDistanceKm";
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
import type { TenantDiscoveryTagId } from "../domain/TenantDiscoveryTag";
import { discoveryTagsFromPrisma, tenantFromPrismaRow } from "./tenantFromPrismaRow";

type DiscoverableNearRow = {
	id: string;
	name: string;
	slug: string;
	logo_url: string | null;
	cover_image_url: string | null;
	discovery_tags: unknown;
	distance_km: number | string | null;
};

type EstablishmentMapMarkerRow = {
	id: string;
	name: string;
	slug: string;
	logo_url: string | null;
	latitude: number;
	longitude: number;
	distance_km: number | string;
};

const DEFAULT_MAP_MARKERS_LIMIT = 50;
const MAX_MAP_MARKERS_LIMIT = 50;

function buildDiscoverTagFilterSql(filterTags: TenantDiscoveryTagId[]): Prisma.Sql {
	if (filterTags.length === 0) {
		return Prisma.empty;
	}

	const conditions = filterTags.map(
		(tag) => Prisma.sql`discovery_tags @> ${JSON.stringify([tag])}::jsonb`,
	);

	return Prisma.sql`AND (${Prisma.join(conditions, " OR ")})`;
}

function mapEstablishmentMapMarkerRow(row: EstablishmentMapMarkerRow): EstablishmentMapMarker {
	const logoUrl = row.logo_url?.trim();

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		latitude: row.latitude,
		longitude: row.longitude,
		...(logoUrl ? { logoUrl } : {}),
	};
}

function mapDiscoverableNearRow(row: DiscoverableNearRow): DiscoverableEstablishment {
	const distanceKm =
		row.distance_km === null || row.distance_km === undefined
			? undefined
			: roundDistanceKm(Number(row.distance_km));

	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		logoUrl: row.logo_url?.trim() ? row.logo_url.trim() : null,
		coverImageUrl: row.cover_image_url?.trim() ? row.cover_image_url.trim() : null,
		tags: discoveryTagsFromPrisma(row.discovery_tags),
		...(distanceKm !== undefined ? { distanceKm } : {}),
	};
}

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
		if (params.near) {
			return this.listDiscoverableActiveNear(params, params.near);
		}

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

	/** Sort-only by proximity; `near.radiusKm` is ignored (Phase U1 #103). */
	private async listDiscoverableActiveNear(
		params: ListDiscoverableEstablishmentsParams,
		near: DiscoverNearFilter,
	): Promise<DiscoverableEstablishmentsPage> {
		const limit = Math.min(Math.max(params.limit, 1), 50);
		const offset = Math.max(params.offset, 0);
		const filterTags = params.tags ?? [];
		const tagFilter = buildDiscoverTagFilterSql(filterTags);

		const rows = await prisma.$queryRaw<DiscoverableNearRow[]>`
			SELECT id, name, slug, logo_url, cover_image_url, discovery_tags, distance_km
			FROM (
				SELECT
					id,
					name,
					slug,
					logo_url,
					cover_image_url,
					discovery_tags,
					CASE
						WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN (
							6371 * acos(
								LEAST(1.0, GREATEST(-1.0,
									cos(radians(${near.latitude})) * cos(radians(latitude))
										* cos(radians(longitude) - radians(${near.longitude}))
									+ sin(radians(${near.latitude})) * sin(radians(latitude))
								))
							)
						)
						ELSE NULL
					END AS distance_km
				FROM tenants
				WHERE status = ${TenantStatus.Active}
					${tagFilter}
			) AS discover_sorted
			ORDER BY distance_km ASC NULLS LAST, name ASC, id ASC
			OFFSET ${offset}
			LIMIT ${limit + 1}
		`;

		const hasMore = rows.length > limit;
		const pageRows = hasMore ? rows.slice(0, limit) : rows;

		return {
			establishments: pageRows.map(mapDiscoverableNearRow),
			hasMore,
		};
	}

	async listEstablishmentMapMarkersNear(
		near: DiscoverNearFilter,
		limit = DEFAULT_MAP_MARKERS_LIMIT,
	): Promise<EstablishmentMapMarker[]> {
		const cappedLimit = Math.min(Math.max(limit, 1), MAX_MAP_MARKERS_LIMIT);

		const rows = await prisma.$queryRaw<EstablishmentMapMarkerRow[]>`
			SELECT id, name, slug, logo_url, latitude, longitude, distance_km
			FROM (
				SELECT
					id,
					name,
					slug,
					logo_url,
					latitude,
					longitude,
					(
						6371 * acos(
							LEAST(1.0, GREATEST(-1.0,
								cos(radians(${near.latitude})) * cos(radians(latitude))
									* cos(radians(longitude) - radians(${near.longitude}))
								+ sin(radians(${near.latitude})) * sin(radians(latitude))
							))
						)
					) AS distance_km
				FROM tenants
				WHERE status = ${TenantStatus.Active}
					AND latitude IS NOT NULL
					AND longitude IS NOT NULL
			) AS near_tenants
			WHERE distance_km <= ${near.radiusKm}
			ORDER BY distance_km ASC, name ASC, id ASC
			LIMIT ${cappedLimit}
		`;

		return rows.map(mapEstablishmentMapMarkerRow);
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
