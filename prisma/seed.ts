import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL must be set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_MEMBERSHIP_ID = "00000000-0000-4000-8000-000000000003";

async function main(): Promise<void> {
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

	console.log("Seed: demo owner ready (demo@starter.local / Café Demo)");
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
