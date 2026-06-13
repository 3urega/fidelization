/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: owner stamp types POST → GET → PATCH deactivate + Prisma assertion.
 */
async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.error("❌ DATABASE_URL required");
		process.exit(1);
	}

	if (!process.env.OWNER_VERIFY_EMAIL?.trim()) {
		await ensureDemoTenantActive();
	}

	const cookie = await loginOwnerForBrandingVerify();
	const headers = {
		cookie: `session=${cookie}`,
		"Content-Type": "application/json",
	};

	const me = await fetch(`${brandingVerifyBaseUrl}/api/me`, {
		headers: { cookie: headers.cookie },
	});
	const meBody = (await me.json()) as {
		tenant?: { id: string };
		role?: string;
	};

	if (!me.ok || meBody.role !== "owner" || !meBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", me.status, meBody);
		process.exit(1);
	}

	const tenantId = meBody.tenant.id;
	console.log("✅ GET /api/me (owner)");

	const invalidPost = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers,
		body: JSON.stringify({ label: "" }),
	});
	const invalidBody = (await invalidPost.json()) as { error?: { type?: string } };

	if (invalidPost.status !== 400 || invalidBody.error?.type !== "InvalidStampType") {
		console.error("❌ POST invalid type:", invalidPost.status, invalidBody);
		process.exit(1);
	}

	console.log("✅ POST invalid type → 400 InvalidStampType");

	const label = `Verify Café ${Date.now()}`;
	const create = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers,
		body: JSON.stringify({ label }),
	});
	const createBody = (await create.json()) as {
		stampType?: { id: string; label: string; slug: string; isActive: boolean };
	};

	if (
		!create.ok ||
		!createBody.stampType?.id ||
		createBody.stampType.label !== label ||
		!createBody.stampType.isActive
	) {
		console.error("❌ POST /api/loyalty/stamp-types:", create.status, createBody);
		process.exit(1);
	}

	const stampTypeId = createBody.stampType.id;
	console.log("✅ POST /api/loyalty/stamp-types");

	const list = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		headers: { cookie: headers.cookie },
	});
	const listBody = (await list.json()) as {
		types?: { id: string }[];
	};

	if (!list.ok || !listBody.types?.some((type) => type.id === stampTypeId)) {
		console.error("❌ GET /api/loyalty/stamp-types:", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/stamp-types lists created type");

	const row = await prisma.stampType.findFirst({
		where: { id: stampTypeId, tenantId },
	});

	if (!row || row.label !== label || !row.isActive) {
		console.error("❌ Prisma stamp_types row:", row);
		process.exit(1);
	}

	console.log("✅ Prisma stamp_types matches POST");

	const deactivate = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types/${stampTypeId}`, {
		method: "PATCH",
		headers,
		body: JSON.stringify({ isActive: false }),
	});
	const deactivateBody = (await deactivate.json()) as {
		stampType?: { isActive: boolean };
	};

	if (!deactivate.ok || deactivateBody.stampType?.isActive !== false) {
		console.error("❌ PATCH deactivate:", deactivate.status, deactivateBody);
		process.exit(1);
	}

	const prismaAfter = await prisma.stampType.findFirst({ where: { id: stampTypeId } });

	if (!prismaAfter || prismaAfter.isActive) {
		console.error("❌ Prisma after deactivate:", prismaAfter);
		process.exit(1);
	}

	console.log("✅ PATCH deactivate + Prisma");
	console.log("✅ verify:stamp-types passed");
}

void main();
