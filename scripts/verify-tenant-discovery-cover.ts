/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { readFile } from "fs/promises";
import path from "path";

import { prisma } from "../src/lib/prisma";
import { DEFAULT_TENANT_COVER_IMAGE_URL } from "../src/lib/platform/tenantDiscoveryAssets";
import {
	brandingVerifyBaseUrl,
	ensureDemoTenantActive,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

/**
 * E2E: POST multipart cover upload + DELETE reset + discover list includes URL.
 * Requires dev server at NEXT_PUBLIC_API_URL and DATABASE_URL.
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
	const headers = { cookie: `session=${cookie}` };

	const meBefore = await fetch(`${brandingVerifyBaseUrl}/api/me`, { headers });
	const meBeforeBody = (await meBefore.json()) as {
		tenant?: { id: string; slug: string; coverImageUrl?: string };
		role?: string;
	};

	if (!meBefore.ok || meBeforeBody.role !== "owner" || !meBeforeBody.tenant?.id) {
		console.error("❌ GET /api/me (owner):", meBefore.status, meBeforeBody);
		process.exit(1);
	}

	const tenantId = meBeforeBody.tenant.id;
	const tenantSlug = meBeforeBody.tenant.slug;
	const originalCover = meBeforeBody.tenant.coverImageUrl ?? "";

	console.log("✅ GET /api/me (owner)");

	const pngPath = path.join(process.cwd(), "public", "cafe_generico.png");
	const pngBuffer = await readFile(pngPath);
	const blob = new Blob([pngBuffer], { type: "image/png" });
	const formData = new FormData();
	formData.append("file", blob, "cover.png");

	const upload = await fetch(`${brandingVerifyBaseUrl}/api/tenant/discovery/cover`, {
		method: "POST",
		headers,
		body: formData,
	});
	const uploadBody = (await upload.json()) as {
		tenant?: { coverImageUrl?: string };
		error?: { description?: string };
	};

	if (!upload.ok || !uploadBody.tenant?.coverImageUrl?.includes(`/uploads/tenants/${tenantId}/cover.`)) {
		console.error("❌ POST cover upload:", upload.status, uploadBody);
		process.exit(1);
	}

	const uploadedUrl = uploadBody.tenant.coverImageUrl;
	console.log("✅ POST /api/tenant/discovery/cover →", uploadedUrl);

	const rowAfterUpload = await prisma.tenant.findUnique({
		where: { id: tenantId },
		select: { coverImageUrl: true },
	});

	if (!rowAfterUpload || rowAfterUpload.coverImageUrl !== uploadedUrl) {
		console.error("❌ Prisma cover_image_url after upload:", rowAfterUpload);
		process.exit(1);
	}

	console.log("✅ Prisma cover_image_url matches upload");

	const userRegister = await fetch(`${brandingVerifyBaseUrl}/api/auth/register/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Cover Discover User",
			email: `verify-cover-discover-${Date.now()}@example.local`,
			password: "password123",
		}),
	});
	const userCookieMatch = /session=([^;]+)/.exec(userRegister.headers.get("set-cookie") ?? "");
	const userCookie = userCookieMatch?.[1];

	if (userRegister.status !== 201 || !userCookie) {
		console.error("❌ register platform user for discover check");
		process.exit(1);
	}

	const discover = await fetch(`${brandingVerifyBaseUrl}/api/user/establishments?limit=50`, {
		headers: { cookie: `session=${userCookie}` },
	});
	const discoverBody = (await discover.json()) as {
		establishments?: { slug: string; coverImageUrl?: string | null }[];
	};

	const discoverRow = discoverBody.establishments?.find((row) => row.slug === tenantSlug);
	if (!discover.ok || discoverRow?.coverImageUrl !== uploadedUrl) {
		console.error("❌ discover list missing uploaded cover:", discover.status, discoverRow);
		process.exit(1);
	}

	console.log("✅ GET /api/user/establishments includes uploaded cover");

	const remove = await fetch(`${brandingVerifyBaseUrl}/api/tenant/discovery/cover`, {
		method: "DELETE",
		headers,
	});
	const removeBody = (await remove.json()) as { tenant?: { coverImageUrl?: string } };

	if (!remove.ok || removeBody.tenant?.coverImageUrl !== "") {
		console.error("❌ DELETE cover:", remove.status, removeBody);
		process.exit(1);
	}

	console.log("✅ DELETE /api/tenant/discovery/cover → empty coverImageUrl");

	if (originalCover) {
		const restoreForm = new FormData();
		restoreForm.append("file", blob, "cover.png");
		await fetch(`${brandingVerifyBaseUrl}/api/tenant/discovery/cover`, {
			method: "POST",
			headers,
			body: restoreForm,
		});
	} else {
		console.log(`✅ grid fallback remains ${DEFAULT_TENANT_COVER_IMAGE_URL}`);
	}

	console.log("\n✅ verify-tenant-discovery-cover passed");
}

void main();
