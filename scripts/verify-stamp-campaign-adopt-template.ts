/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

const DEMO_TEMPLATE_COFFEE_ID = "00000000-0000-4000-8000-000000000020";

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

	const templates = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/campaign-templates`, {
		headers: { cookie: headers.cookie },
	});
	const templatesBody = (await templates.json()) as {
		templates?: { id?: string; name?: string; isActive?: boolean }[];
	};

	if (templates.status !== 200 || !Array.isArray(templatesBody.templates)) {
		console.error("❌ GET /api/loyalty/campaign-templates", templates.status, templatesBody);
		process.exit(1);
	}

	if (templatesBody.templates.length < 3) {
		console.error("❌ expected at least 3 active templates for owner", templatesBody.templates.length);
		process.exit(1);
	}

	if (templatesBody.templates.some((row) => row.isActive === false)) {
		console.error("❌ owner list must not include inactive templates", templatesBody.templates);
		process.exit(1);
	}

	const coffeeTemplate = templatesBody.templates.find((row) => row.id === DEMO_TEMPLATE_COFFEE_ID);
	if (!coffeeTemplate?.name?.includes("cafés")) {
		console.error("❌ coffee template missing from owner list", coffeeTemplate);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/campaign-templates → active templates only");

	const cafeLabel = `Café adopt ${Date.now()}`;
	const createType = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-types`, {
		method: "POST",
		headers,
		body: JSON.stringify({ label: cafeLabel }),
	});
	const createTypeBody = (await createType.json()) as {
		stampType?: { id: string };
	};

	if (!createType.ok || !createTypeBody.stampType?.id) {
		console.error("❌ POST stamp type for adopt", createType.status, createTypeBody);
		process.exit(1);
	}

	const stampTypeId = createTypeBody.stampType.id;
	console.log("✅ stamp type ready for adopt");

	const adopt = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns/adopt-template`, {
		method: "POST",
		headers,
		body: JSON.stringify({
			templateId: DEMO_TEMPLATE_COFFEE_ID,
			stampTypeId,
		}),
	});
	const adoptBody = (await adopt.json()) as {
		campaign?: {
			id?: string;
			name?: string;
			requiredStamps?: number;
			stampTypeId?: string;
			visualTemplate?: string;
		};
	};

	if (
		adopt.status !== 201 ||
		!adoptBody.campaign?.id ||
		adoptBody.campaign.name !== coffeeTemplate.name ||
		adoptBody.campaign.requiredStamps !== 10 ||
		adoptBody.campaign.stampTypeId !== stampTypeId ||
		adoptBody.campaign.visualTemplate !== "coffee"
	) {
		console.error("❌ POST adopt-template", adopt.status, adoptBody);
		process.exit(1);
	}

	console.log("✅ POST adopt-template creates tenant campaign");

	const list = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/stamp-campaigns`, {
		headers: { cookie: headers.cookie },
	});
	const listBody = (await list.json()) as {
		campaigns?: { id?: string; name?: string }[];
	};

	if (
		list.status !== 200 ||
		!listBody.campaigns?.some((row) => row.id === adoptBody.campaign?.id)
	) {
		console.error("❌ adopted campaign missing from GET list", list.status, listBody);
		process.exit(1);
	}

	console.log("✅ adopted campaign visible in GET /api/loyalty/stamp-campaigns");

	const row = await prisma.stampCampaign.findFirst({
		where: { id: adoptBody.campaign.id, tenantId },
		select: {
			id: true,
			name: true,
			requiredStamps: true,
			stampTypeId: true,
			visualTemplate: true,
			isActive: true,
		},
	});

	if (
		!row ||
		row.name !== coffeeTemplate.name ||
		row.requiredStamps !== 10 ||
		row.stampTypeId !== stampTypeId ||
		row.visualTemplate !== "coffee" ||
		!row.isActive
	) {
		console.error("❌ prisma stamp_campaigns row", row);
		process.exit(1);
	}

	console.log("✅ Prisma stamp_campaigns row persisted");
	console.log("✅ verify:stamp-campaign-adopt-template passed");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error: unknown) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
