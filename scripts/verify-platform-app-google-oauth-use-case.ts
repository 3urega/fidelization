/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import {
	AuthenticateGoogleUser,
	GOOGLE_OAUTH_PROVIDER,
} from "../src/contexts/identity/users/application/authenticate/AuthenticateGoogleUser";
import { RegisterPlatformUser } from "../src/contexts/identity/users/application/register/RegisterPlatformUser";
import { GoogleIdTokenClaims } from "../src/contexts/identity/users/domain/GoogleIdTokenClaims";
import { GoogleIdTokenVerifier } from "../src/contexts/identity/users/domain/GoogleIdTokenVerifier";
import { InvalidGoogleToken } from "../src/contexts/identity/users/domain/InvalidGoogleToken";
import { OAuthAccountAlreadyLinked } from "../src/contexts/identity/users/domain/OAuthAccountAlreadyLinked";
import { PlatformUserCannotUseUserLogin } from "../src/contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";

class StubGoogleIdTokenVerifier extends GoogleIdTokenVerifier {
	constructor(private readonly claimsByToken: Map<string, GoogleIdTokenClaims>) {
		super();
	}

	async verify(idToken: string): Promise<GoogleIdTokenClaims> {
		const claims = this.claimsByToken.get(idToken.trim());

		if (!claims) {
			throw new InvalidGoogleToken();
		}

		return claims;
	}
}

class InMemoryUserRepository extends UserRepository {
	private users = new Map<string, UserWithPasswordHash>();

	async save(user: User, passwordHash: string): Promise<void> {
		this.users.set(user.email.value, { user, passwordHash });
	}

	async search(id: UserId): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.id.value === id.value) {
				return row.user;
			}
		}

		return null;
	}

	async searchByEmail(email: string): Promise<UserWithPasswordHash | null> {
		return this.users.get(email.toLowerCase().trim()) ?? null;
	}

	async searchByQrValue(qrValue: string): Promise<User | null> {
		for (const row of this.users.values()) {
			if (row.user.qrValue === qrValue) {
				return row.user;
			}
		}

		return null;
	}

	async searchByOAuthSubject(oauthProvider: string, oauthSubject: string): Promise<User | null> {
		for (const row of this.users.values()) {
			if (
				row.user.oauthProvider === oauthProvider &&
				row.user.oauthSubject === oauthSubject
			) {
				return row.user;
			}
		}

		return null;
	}

	async updatePasswordHash(userId: UserId, passwordHash: string): Promise<void> {
		for (const [email, row] of this.users.entries()) {
			if (row.user.id.value === userId.value) {
				this.users.set(email, { user: row.user, passwordHash });

				return;
			}
		}
	}

	async isPlatformSuperadmin(userId: string): Promise<boolean> {
		for (const row of this.users.values()) {
			if (row.user.id.value === userId) {
				return row.user.email.value === "superadmin@platform.local";
			}
		}

		return false;
	}
}

async function expectError<T extends Error>(
	label: string,
	action: () => Promise<unknown>,
	Expected: new (...args: never[]) => T,
): Promise<void> {
	try {
		await action();
		console.error(`❌ expected ${Expected.name} for ${label}`);
		process.exit(1);
	} catch (error) {
		if (!(error instanceof Expected)) {
			console.error(`❌ wrong error for ${label}:`, error);
			process.exit(1);
		}
	}

	console.log(`✅ ${label} → ${Expected.name}`);
}

async function main(): Promise<void> {
	const repository = new InMemoryUserRepository();
	const registerPlatformUser = new RegisterPlatformUser(repository);
	const googleSubject = "google-subject-verify-001";
	const googleToken = "valid-google-id-token";
	const verifier = new StubGoogleIdTokenVerifier(
		new Map([
			[
				googleToken,
				{
					subject: googleSubject,
					email: "google-new@example.local",
					name: "Google New User",
					picture: "https://example.com/avatar.png",
				},
			],
			[
				"link-token",
				{
					subject: "google-subject-link-002",
					email: "email-user@example.local",
					name: "Linked User",
				},
			],
			[
				"conflict-token",
				{
					subject: "google-subject-conflict-003",
					email: "linked-other@example.local",
					name: "Conflict User",
				},
			],
			[
				"superadmin-token",
				{
					subject: "google-subject-superadmin",
					email: "superadmin@platform.local",
					name: "Superadmin",
				},
			],
		]),
	);
	const authenticateGoogleUser = new AuthenticateGoogleUser(verifier, repository);

	const created = await authenticateGoogleUser.authenticate(googleToken);

	if (
		created.oauthProvider !== GOOGLE_OAUTH_PROVIDER ||
		created.oauthSubject !== googleSubject ||
		!created.qrValue ||
		created.email.value !== "google-new@example.local"
	) {
		console.error("❌ Google register user", created.toPrimitives());
		process.exit(1);
	}

	console.log("✅ Google OAuth creates user with qrValue and oauth fields");

	const loggedIn = await authenticateGoogleUser.authenticate(googleToken);

	if (loggedIn.id.value !== created.id.value) {
		console.error("❌ Google login should reuse same user");
		process.exit(1);
	}

	console.log("✅ Google OAuth login by oauth_subject");

	await registerPlatformUser.register({
		name: "Email Only",
		email: "email-user@example.local",
		password: "password123",
	});

	const linked = await authenticateGoogleUser.authenticate("link-token");

	if (
		linked.email.value !== "email-user@example.local" ||
		linked.oauthSubject !== "google-subject-link-002" ||
		!linked.qrValue
	) {
		console.error("❌ Google link to email account failed", linked.toPrimitives());
		process.exit(1);
	}

	console.log("✅ Google OAuth links existing email account");

	const otherGoogleUser = User.createFromGoogleOAuth({
		id: randomUUID(),
		name: "Other Google",
		email: "linked-other@example.local",
		oauthSubject: "google-subject-existing-other",
		qrValue: randomUUID(),
	});
	await repository.save(otherGoogleUser, "hash");

	await expectError(
		"oauth conflict on same email",
		() => authenticateGoogleUser.authenticate("conflict-token"),
		OAuthAccountAlreadyLinked,
	);

	await expectError("invalid token", () => authenticateGoogleUser.authenticate("bad-token"), InvalidGoogleToken);

	await repository.save(
		User.create("superadmin-id", "Superadmin", "superadmin@platform.local", "", randomUUID()),
		"hash",
	);

	await expectError(
		"superadmin blocked",
		() => authenticateGoogleUser.authenticate("superadmin-token"),
		PlatformUserCannotUseUserLogin,
	);

	console.log("✅ verify:platform-app-google-oauth-use-case passed");
}

void main();
