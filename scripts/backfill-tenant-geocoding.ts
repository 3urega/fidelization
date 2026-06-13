/* eslint-disable no-console -- CLI backfill script */
import "reflect-metadata";
import "dotenv/config";

import { GeocodeAddressString } from "../src/contexts/shared/geocoding/application/geocode/GeocodeAddressString";
import { GeocodingFailed } from "../src/contexts/shared/geocoding/domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../src/contexts/shared/geocoding/domain/GeocodingNotConfigured";
import { container } from "../src/contexts/shared/infrastructure/dependency-injection/diod.config";
import { TenantGeolocation } from "../src/contexts/tenants/tenants/domain/TenantGeolocation";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	const geocodeAddressString = container.get(GeocodeAddressString);
	const tenants = await prisma.tenant.findMany({
		where: {
			address: { not: "" },
			latitude: null,
		},
		select: { id: true, slug: true, address: true },
	});

	if (tenants.length === 0) {
		console.log("✅ no tenants need geocoding backfill");
		await prisma.$disconnect();

		return;
	}

	let updated = 0;
	let skipped = 0;

	for (const tenant of tenants) {
		try {
			const result = await geocodeAddressString.execute({ address: tenant.address });
			const geolocation = TenantGeolocation.fromGeocodingResult(result);

			await prisma.tenant.update({
				where: { id: tenant.id },
				data: {
					latitude: geolocation.latitude,
					longitude: geolocation.longitude,
					geocodingProvider: geolocation.geocodingProvider,
					geocodedAt: geolocation.geocodedAt,
				},
			});

			updated += 1;
			console.log(`✅ geocoded ${tenant.slug}`);
		} catch (error) {
			skipped += 1;

			if (error instanceof GeocodingFailed || error instanceof GeocodingNotConfigured) {
				console.warn(`⚠ skipped ${tenant.slug}: ${error.message}`);
				continue;
			}

			throw error;
		}
	}

	console.log(`✅ backfill complete: ${updated} updated, ${skipped} skipped`);
	await prisma.$disconnect();
}

void main();
