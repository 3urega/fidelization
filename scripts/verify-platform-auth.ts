import "dotenv/config";

import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import {
	isPlatformSession,
	isTenantSession,
	parseSessionPayload,
} from "../src/lib/auth/sessionClaims";
import { PlatformAuthenticator } from "../src/contexts/platform/application/authenticate/PlatformAuthenticator";
import { PlatformAccessDenied } from "../src/contexts/platform/domain/PlatformAccessDenied";
import { InvalidCredentials } from "../src/contexts/identity/users/domain/InvalidCredentials";
import { User } from "../src/contexts/identity/users/domain/User";

const superadminId = "superadmin-verify";
const regularId = "regular-verify";

class StubUserRepo {
	constructor(
		private readonly superadmins: Set<string>,
	) {}

	async isPlatformSuperadmin(userId: string): Promise<boolean> {
		return this.superadmins.has(userId);
	}
}

async function run(): Promise<void> {
	const platformToken = await createSessionToken({
		kind: "platform",
		userId: superadminId,
		role: "superadmin",
	});
	const platformSession = await verifySessionToken(platformToken);
	if (!platformSession || !isPlatformSession(platformSession)) {
		console.error("❌ platform session round-trip failed");
		process.exit(1);
	}

	const tenantToken = await createSessionToken({
		kind: "tenant",
		userId: regularId,
		tenantId: "tenant-1",
		role: "owner",
	});
	const tenantSession = await verifySessionToken(tenantToken);
	if (!tenantSession || !isTenantSession(tenantSession)) {
		console.error("❌ tenant session round-trip failed");
		process.exit(1);
	}

	const legacyParsed = parseSessionPayload({
		sub: regularId,
		tenantId: "tenant-legacy",
		role: "owner",
	});
	if (!legacyParsed || legacyParsed.kind !== "tenant" || legacyParsed.tenantId !== "tenant-legacy") {
		console.error("❌ legacy JWT without kind should parse as tenant");
		process.exit(1);
	}

	const repo = new StubUserRepo(new Set([superadminId]));
	const auth = new PlatformAuthenticator(
		{
			login: async (email: string) => {
				if (email === "super@platform.local") {
					return User.fromPrimitives({
						id: superadminId,
						name: "SA",
						email,
						profilePicture: "",
						plan: "FREE",
						qrValue: null,
						oauthProvider: null,
						oauthSubject: null,
						searchZone: null,
					});
				}

				if (email === "other@x.com") {
					return User.fromPrimitives({
						id: regularId,
						name: "Regular",
						email,
						profilePicture: "",
						plan: "FREE",
						qrValue: null,
						oauthProvider: null,
						oauthSubject: null,
						searchZone: null,
					});
				}

				throw new InvalidCredentials();
			},
		} as never,
		repo as never,
	);

	const user = await auth.login("super@platform.local", "x");
	if (user.id.value !== superadminId) {
		console.error("❌ PlatformAuthenticator superadmin login failed");
		process.exit(1);
	}

	try {
		await auth.login("other@x.com", "x");
		console.error("❌ expected PlatformAccessDenied for non-superadmin");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformAccessDenied)) {
			console.error("❌ wrong error for non-superadmin platform login", error);
			process.exit(1);
		}
	}

	console.log("✅ platform / tenant session kinds");
	console.log("✅ legacy JWT maps to tenant kind");
	console.log("✅ PlatformAuthenticator superadmin gate");
}

void run();
