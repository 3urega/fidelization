/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { isBrandingHexColor } from "../src/contexts/tenants/tenants/domain/BrandingColor";
import { InvalidTenantBranding } from "../src/contexts/tenants/tenants/domain/InvalidTenantBranding";
import { parseTenantBrandingUpdate } from "../src/contexts/tenants/tenants/domain/TenantBrandingUpdate";
import { PrismaTenantRepository } from "../src/contexts/tenants/tenants/infrastructure/PrismaTenantRepository";
import { prisma } from "../src/lib/prisma";

if (!isBrandingHexColor("#7C3AED") || isBrandingHexColor("red")) {
	console.error("❌ isBrandingHexColor");
	process.exit(1);
}

const parsed = parseTenantBrandingUpdate({
	logoUrl: " https://example.com/logo.png ",
	primaryColor: "#111111",
});
if (parsed.logoUrl !== "https://example.com/logo.png" || parsed.primaryColor !== "#111111") {
	console.error("❌ parseTenantBrandingUpdate");
	process.exit(1);
}

try {
	parseTenantBrandingUpdate({ primaryColor: "not-a-color" });
	console.error("❌ expected invalid color to throw");
	process.exit(1);
} catch (error) {
	if (!(error instanceof InvalidTenantBranding)) {
		console.error("❌ expected InvalidTenantBranding", error);
		process.exit(1);
	}
}

console.log("✅ branding domain parse");

async function verifyRepository(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("✅ verify:tenant-branding-domain passed (domain only, no DATABASE_URL)");

		return;
	}

	const repo = new PrismaTenantRepository();
	const tenant = await prisma.tenant.findFirst({ select: { id: true, primaryColor: true } });
	if (!tenant) {
		console.log("✅ verify:tenant-branding-domain passed (no tenant row to patch)");

		return;
	}

	const original = tenant.primaryColor;
	const updated = await repo.updateBranding(tenant.id, { primaryColor: "#222222" });
	if (!updated || updated.primaryColor !== "#222222") {
		console.error("❌ updateBranding");
		process.exit(1);
	}

	await repo.updateBranding(tenant.id, { primaryColor: original });
	console.log("✅ PrismaTenantRepository.updateBranding");
	console.log("✅ verify:tenant-branding-domain passed");
}

void verifyRepository();
