/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { randomUUID } from "crypto";

import { EnsureUserQrValue } from "../src/contexts/identity/users/application/profile/EnsureUserQrValue";
import { User } from "../src/contexts/identity/users/domain/User";
import { UserId } from "../src/contexts/identity/users/domain/UserId";
import { UserRepository, UserWithPasswordHash } from "../src/contexts/identity/users/domain/UserRepository";
import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";

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

	async searchByOAuthSubject(): Promise<User | null> {
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

	async assignQrValueIfAbsent(userId: UserId, qrValue: string): Promise<void> {
		for (const [email, row] of this.users.entries()) {
			if (row.user.id.value !== userId.value || row.user.qrValue) {
				continue;
			}

			const updated = User.fromPrimitives({
				...row.user.toPrimitives(),
				qrValue,
			});
			this.users.set(email, { user: updated, passwordHash: row.passwordHash });

			return;
		}
	}

	async isPlatformSuperadmin(): Promise<boolean> {
		return false;
	}
}

function parseSetCookieSession(setCookie: string | null): string | null {
	if (!setCookie) {
		return null;
	}

	const match = /session=([^;]+)/.exec(setCookie);

	return match?.[1] ?? null;
}

function sessionHeader(cookie: string): { cookie: string } {
	return { cookie: `session=${cookie}` };
}

async function verifyUseCase(): Promise<void> {
	const repository = new InMemoryUserRepository();
	const ensure = new EnsureUserQrValue(repository);
	const userId = randomUUID();
	const existingQr = randomUUID();

	const withQr = User.create(userId, "Has QR", "has-qr@example.local", "", existingQr);
	await repository.save(withQr, "hash");

	const kept = await ensure.ensure(userId);
	if (kept.qrValue !== existingQr) {
		console.error("❌ EnsureUserQrValue must not overwrite existing qrValue");
		process.exit(1);
	}

	console.log("✅ EnsureUserQrValue keeps existing qrValue");

	const missingId = randomUUID();
	const withoutQr = User.create(missingId, "Missing QR", "missing-qr@example.local");
	await repository.save(withoutQr, "hash");

	const assigned = await ensure.ensure(missingId);
	if (!assigned.qrValue) {
		console.error("❌ EnsureUserQrValue must assign qrValue when missing");
		process.exit(1);
	}

	const secondPass = await ensure.ensure(missingId);
	if (secondPass.qrValue !== assigned.qrValue) {
		console.error("❌ EnsureUserQrValue must be idempotent");
		process.exit(1);
	}

	console.log("✅ EnsureUserQrValue assigns qrValue lazily");
}

async function verifyApiLazyAssign(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		console.log("⏭️  skip API lazy assign (no DATABASE_URL)");
		return;
	}

	const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
	const email = `verify-ensure-qr-${randomUUID()}@example.local`;
	const password = "password123";
	const userId = randomUUID();
	const passwordHash = await hashPassword(password);

	await prisma.user.create({
		data: {
			id: userId,
			name: "Legacy Without QR",
			email,
			profilePicture: "",
			passwordHash,
			subscriptionPlan: "FREE",
			qrValue: null,
		},
	});

	const login = await fetch(`${baseUrl}/api/auth/login/user`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	const loginCookie = parseSetCookieSession(login.headers.get("set-cookie"));

	if (login.status !== 200 || !loginCookie) {
		console.error("❌ login for legacy user without qr_value:", login.status);
		process.exit(1);
	}

	const me = await fetch(`${baseUrl}/api/user/me`, { headers: sessionHeader(loginCookie) });
	const meBody = (await me.json()) as { user?: { id: string; qrValue: string | null } };

	if (!me.ok || !meBody.user?.qrValue) {
		console.error("❌ GET /api/user/me must lazy-assign qrValue:", me.status, meBody);
		process.exit(1);
	}

	const row = await prisma.user.findUnique({ where: { id: userId }, select: { qrValue: true } });
	if (row?.qrValue !== meBody.user.qrValue) {
		console.error("❌ persisted qr_value mismatch after lazy assign");
		process.exit(1);
	}

	await prisma.user.delete({ where: { id: userId } });

	console.log("✅ GET /api/user/me lazy-assigns qr_value for legacy users");
}

async function main(): Promise<void> {
	await verifyUseCase();
	await verifyApiLazyAssign();
	console.log("✅ verify:platform-app-ensure-user-qr-use-case passed");
}

void main();
