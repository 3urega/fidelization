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
	const scanContextBody = (await scanContext.json()) as {
		unlockEnabled?: boolean;
		authorizeEnabled?: boolean;
	};

	if (
		scanContext.status !== 200 ||
		typeof scanContextBody.unlockEnabled !== "boolean" ||
		typeof scanContextBody.authorizeEnabled !== "boolean"
	) {
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

	if (!html.includes("Identifica al cliente")) {
		console.error("❌ /scan missing QR-first description");
		process.exit(1);
	}

	if (!html.includes("Continuar")) {
		console.error("❌ /scan missing identify continue action");
		process.exit(1);
	}

	if (html.includes("Registrar visita")) {
		console.error("❌ /scan should not show legacy primary scan action");
		process.exit(1);
	}

	if (html.includes("Canjear premio físico (ruleta)")) {
		console.error("❌ /scan should not embed legacy redeem section");
		process.exit(1);
	}

	console.log("✅ GET /scan page QR-first UX copy");

	const sessionHub = await fetch(`${brandingVerifyBaseUrl}/scan/session`, {
		headers: ownerHeaders,
	});

	if (sessionHub.status !== 200) {
		console.error("❌ GET /scan/session page", sessionHub.status);
		process.exit(1);
	}

	const sessionHtml = await sessionHub.text();

	if (!sessionHtml.includes("Elige actividad") && !sessionHtml.includes("Redirigiendo")) {
		console.error("❌ /scan/session missing hub or redirect copy");
		process.exit(1);
	}

	console.log("✅ GET /scan/session route");

	const loyaltyPage = await fetch(`${brandingVerifyBaseUrl}/scan/session/loyalty`, {
		headers: ownerHeaders,
	});

	if (loyaltyPage.status !== 200) {
		console.error("❌ GET /scan/session/loyalty page", loyaltyPage.status);
		process.exit(1);
	}

	const loyaltyHtml = await loyaltyPage.text();

	if (!loyaltyHtml.includes("Tarjetas y promociones")) {
		console.error("❌ /scan/session/loyalty missing loyalty panel title");
		process.exit(1);
	}

	if (loyaltyHtml.includes("siguiente fase de implementación")) {
		console.error("❌ /scan/session/loyalty should not show placeholder copy");
		process.exit(1);
	}

	console.log("✅ GET /scan/session/loyalty route");

	const ruletaPage = await fetch(`${brandingVerifyBaseUrl}/scan/session/ruleta`, {
		headers: ownerHeaders,
	});

	if (ruletaPage.status !== 200) {
		console.error("❌ GET /scan/session/ruleta page", ruletaPage.status);
		process.exit(1);
	}

	const ruletaHtml = await ruletaPage.text();

	if (!ruletaHtml.includes("Autorización y estado de participación")) {
		console.error("❌ /scan/session/ruleta missing panel description");
		process.exit(1);
	}

	if (ruletaHtml.includes("siguiente fase de implementación")) {
		console.error("❌ /scan/session/ruleta should not show placeholder copy");
		process.exit(1);
	}

	console.log("✅ GET /scan/session/ruleta route");

	const redeemPage = await fetch(`${brandingVerifyBaseUrl}/scan/session/redeem`, {
		headers: ownerHeaders,
	});

	if (redeemPage.status !== 200) {
		console.error("❌ GET /scan/session/redeem page", redeemPage.status);
		process.exit(1);
	}

	const redeemHtml = await redeemPage.text();

	if (!redeemHtml.includes("Canjear premio físico")) {
		console.error("❌ /scan/session/redeem missing redeem panel title");
		process.exit(1);
	}

	if (redeemHtml.includes("siguiente fase de implementación")) {
		console.error("❌ /scan/session/redeem should not show placeholder copy");
		process.exit(1);
	}

	console.log("✅ GET /scan/session/redeem route");

	const noSession = await fetch(`${brandingVerifyBaseUrl}/api/loyalty/games/ruleta/scan-context`);

	if (noSession.status !== 401) {
		console.error("❌ scan-context without session should be 401", noSession.status);
		process.exit(1);
	}

	console.log("✅ scan-context without session → 401");

	console.log("\n✅ verify:staff-scan-roulette-ux passed");
}

void main();
