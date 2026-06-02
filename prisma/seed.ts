import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL must be set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_PLAN_BASIC_ID = "00000000-0000-4000-8000-000000000004";
const DEMO_CUSTOMER_ID = "00000000-0000-4000-8000-000000000005";
const SUPERADMIN_USER_ID = "00000000-0000-4000-8000-000000000010";

async function main(): Promise<void> {
	const superadminEmail = (process.env.SUPERADMIN_EMAIL ?? "superadmin@platform.local").toLowerCase().trim();
	const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "change-me-superadmin";
	const superadminPasswordHash = await hashPassword(superadminPassword);

	await prisma.user.upsert({
		where: { id: SUPERADMIN_USER_ID },
		update: {
			email: superadminEmail,
			platformRole: "superadmin",
			passwordHash: superadminPasswordHash,
		},
		create: {
			id: SUPERADMIN_USER_ID,
			name: "Platform Superadmin",
			email: superadminEmail,
			profilePicture: "",
			passwordHash: superadminPasswordHash,
			subscriptionPlan: "FREE",
			platformRole: "superadmin",
		},
	});
	await prisma.user.upsert({
		where: { id: DEMO_USER_ID },
		update: {},
		create: {
			id: DEMO_USER_ID,
			name: "Usuario demo",
			email: "demo@starter.local",
			profilePicture: "",
			passwordHash: "$2a$10$unusedForDemoLoginOnlyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			subscriptionPlan: "FREE",
		},
	});

	await prisma.tenant.upsert({
		where: { id: DEMO_TENANT_ID },
		update: {},
		create: {
			id: DEMO_TENANT_ID,
			name: "Café Demo",
			slug: "cafe-demo",
			logoUrl: "",
			primaryColor: "#7C3AED",
			secondaryColor: "#4F46E5",
			subscriptionPlan: "basic",
		},
	});

	await prisma.tenantMembership.upsert({
		where: { id: DEMO_MEMBERSHIP_ID },
		update: {},
		create: {
			id: DEMO_MEMBERSHIP_ID,
			tenantId: DEMO_TENANT_ID,
			userId: DEMO_USER_ID,
			role: "owner",
		},
	});

	await prisma.subscriptionPlan.upsert({
		where: { id: DEMO_PLAN_BASIC_ID },
		update: {},
		create: {
			id: DEMO_PLAN_BASIC_ID,
			name: "basic",
			priceMonthly: 0,
			priceYearly: 0,
			features: { loyalty: true, stamps: true },
		},
	});

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: { subscriptionPlanId: DEMO_PLAN_BASIC_ID },
	});

	await prisma.customer.upsert({
		where: { id: DEMO_CUSTOMER_ID },
		update: {},
		create: {
			id: DEMO_CUSTOMER_ID,
			tenantId: DEMO_TENANT_ID,
			name: "Cliente demo",
			email: "cliente@demo.local",
			qrValue: "demo-qr-cafe-demo",
		},
	});

	console.log("Seed: demo owner + plan basic + customer QR (demo-qr-cafe-demo)");
	console.log(`Seed: superadmin ${superadminEmail} (no tenant membership)`);
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
