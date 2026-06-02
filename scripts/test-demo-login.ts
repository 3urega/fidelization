import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@starter.local";

async function main(): Promise<void> {
	const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
	const membership = user
		? await prisma.tenantMembership.findFirst({
				where: { userId: user.id, role: "owner" },
				include: { tenant: true },
			})
		: null;

	console.log("user:", user ? `${user.email} (${user.id})` : "NOT FOUND");
	console.log("membership:", membership ? `${membership.role} @ ${membership.tenant.name}` : "NOT FOUND");

	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
	const response = await fetch(`${baseUrl}/api/auth/demo`, { method: "POST" });
	const body = (await response.json()) as { error?: { description?: string }; tenant?: { name: string } };

	console.log("POST /api/auth/demo:", response.status);
	if (response.ok && body.tenant) {
		console.log("tenant:", body.tenant.name);
		console.log("✅ Demo login OK");
	} else {
		console.log("error:", body.error?.description ?? JSON.stringify(body));
		console.log("❌ Demo login FAILED");
		process.exit(1);
	}
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
