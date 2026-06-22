/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import {
	brandingVerifyBaseUrl,
	loginOwnerForBrandingVerify,
} from "./lib/tenant-branding-verify-helpers";

async function main(): Promise<void> {
	const ownerCookie = await loginOwnerForBrandingVerify();
	const ownerHeaders = { cookie: `session=${ownerCookie}` };

	const scanContext = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/scan-context`, {
		headers: ownerHeaders,
	});
	const scanContextBody = (await scanContext.json()) as { unlockEnabled?: boolean };

	if (scanContext.status !== 200 || typeof scanContextBody.unlockEnabled !== "boolean") {
		console.error("❌ GET scan-context", scanContext.status, scanContextBody);
		process.exit(1);
	}

	console.log("✅ GET /api/loyalty/games/ruleta/scan-context");

	const scanPage = await fetch(`${brandingVerifyBaseUrl}/scan`, {
		headers: ownerHeaders,
	});

	if (scanPage.status !== 200) {
		console.error("❌ GET /scan page", scanPage.status);
		process.exit(1);
	}

	const html = await scanPage.text();

	if (!html.includes("Canjear premio físico (ruleta)")) {
		console.error("❌ /scan missing physical redeem section title");
		process.exit(1);
	}

	if (!html.includes("Registrar visita")) {
		console.error("❌ /scan missing primary scan action");
		process.exit(1);
	}

	console.log("✅ GET /scan page roulette UX copy");

	const noSession = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/scan-context`);

	if (noSession.status !== 401) {
		console.error("❌ scan-context without session should be 401", noSession.status);
		process.exit(1);
	}

	console.log("✅ scan-context without session → 401");

	console.log("\n✅ verify:staff-scan-roulette-ux passed");
}

void main();
