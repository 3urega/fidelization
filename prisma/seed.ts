import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import { hashPassword } from "../src/lib/auth/password";
import { RULETA_GAME_SLUG } from "../src/contexts/loyalty/games/domain/TenantGameActivation";
import { DEMO_ROULETTE_CONFIG } from "../src/lib/roulette/demoRouletteConfig";

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
const DEMO_PLAN_PRO_ID = "00000000-0000-4000-8000-000000000006";
const DEMO_PLAN_PREMIUM_ID = "00000000-0000-4000-8000-000000000007";
const DEMO_CUSTOMER_ID = "00000000-0000-4000-8000-000000000005";
const SUPERADMIN_USER_ID = "00000000-0000-4000-8000-000000000010";
const DEMO_TEMPLATE_COFFEE_ID = "00000000-0000-4000-8000-000000000020";
const DEMO_TEMPLATE_CROISSANT_ID = "00000000-0000-4000-8000-000000000021";
const DEMO_TEMPLATE_MATCHA_ID = "00000000-0000-4000-8000-000000000022";
const DEMO_GAME_RULETA_ID = "00000000-0000-4000-8000-000000000030";
const DEMO_GAME_RASCA_ID = "00000000-0000-4000-8000-000000000031";
const DEMO_GAME_CAJA_ID = "00000000-0000-4000-8000-000000000032";
const DEMO_TENANT_RULETA_ACTIVATION_ID = "00000000-0000-4000-8000-000000000033";

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
		update: {
			name: "basic",
			priceMonthly: 0,
			priceYearly: 0,
			isActive: true,
			features: {
				stamps: true,
				points: true,
				promotions: false,
				coupons: false,
				push: false,
				gamification: false,
				referrals: false,
				analytics: false,
			},
			limits: { employees: 3 },
		},
		create: {
			id: DEMO_PLAN_BASIC_ID,
			name: "basic",
			priceMonthly: 0,
			priceYearly: 0,
			features: {
				stamps: true,
				points: true,
				promotions: false,
				coupons: false,
				push: false,
				gamification: false,
				referrals: false,
				analytics: false,
			},
			limits: { employees: 3 },
		},
	});

	await prisma.subscriptionPlan.upsert({
		where: { id: DEMO_PLAN_PRO_ID },
		update: {
			name: "pro",
			priceMonthly: 2900,
			priceYearly: 29000,
			isActive: true,
			features: {
				stamps: true,
				points: true,
				promotions: true,
				coupons: true,
				push: true,
				gamification: false,
				referrals: false,
				analytics: true,
			},
			limits: { employees: 10 },
		},
		create: {
			id: DEMO_PLAN_PRO_ID,
			name: "pro",
			priceMonthly: 2900,
			priceYearly: 29000,
			features: {
				stamps: true,
				points: true,
				promotions: true,
				coupons: true,
				push: true,
				gamification: false,
				referrals: false,
				analytics: true,
			},
			limits: { employees: 10 },
		},
	});

	await prisma.subscriptionPlan.upsert({
		where: { id: DEMO_PLAN_PREMIUM_ID },
		update: {
			name: "premium",
			priceMonthly: 5900,
			priceYearly: 59000,
			isActive: true,
			features: {
				stamps: true,
				points: true,
				promotions: true,
				coupons: true,
				push: true,
				gamification: true,
				referrals: true,
				analytics: true,
			},
			limits: { employees: 50 },
		},
		create: {
			id: DEMO_PLAN_PREMIUM_ID,
			name: "premium",
			priceMonthly: 5900,
			priceYearly: 59000,
			features: {
				stamps: true,
				points: true,
				promotions: true,
				coupons: true,
				push: true,
				gamification: true,
				referrals: true,
				analytics: true,
			},
			limits: { employees: 50 },
		},
	});

	await prisma.tenant.update({
		where: { id: DEMO_TENANT_ID },
		data: {
			subscriptionPlanId: DEMO_PLAN_BASIC_ID,
			subscriptionPlan: "basic",
		},
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

	await prisma.platformCampaignTemplate.upsert({
		where: { id: DEMO_TEMPLATE_COFFEE_ID },
		update: {
			name: "10 cafés = 1 gratis",
			description: "Tarjeta clásica de fidelización para bebidas de café.",
			requiredStamps: 10,
			suggestedStampTypeLabel: "Café",
			visualTemplate: "coffee",
			cardBackgroundVariant: "coffee-photo",
			conditions: "Válido en bebidas de café estándar.",
			isActive: true,
			sortOrder: 1,
		},
		create: {
			id: DEMO_TEMPLATE_COFFEE_ID,
			name: "10 cafés = 1 gratis",
			description: "Tarjeta clásica de fidelización para bebidas de café.",
			requiredStamps: 10,
			suggestedStampTypeLabel: "Café",
			visualTemplate: "coffee",
			cardBackgroundVariant: "coffee-photo",
			conditions: "Válido en bebidas de café estándar.",
			isActive: true,
			sortOrder: 1,
		},
	});

	await prisma.platformCampaignTemplate.upsert({
		where: { id: DEMO_TEMPLATE_CROISSANT_ID },
		update: {
			name: "8 croissants = 1 gratis",
			description: "Ideal para panaderías y desayunos.",
			requiredStamps: 8,
			suggestedStampTypeLabel: "Croissant",
			visualTemplate: "croissant",
			cardBackgroundVariant: "coffee-sketch",
			conditions: "",
			isActive: true,
			sortOrder: 2,
		},
		create: {
			id: DEMO_TEMPLATE_CROISSANT_ID,
			name: "8 croissants = 1 gratis",
			description: "Ideal para panaderías y desayunos.",
			requiredStamps: 8,
			suggestedStampTypeLabel: "Croissant",
			visualTemplate: "croissant",
			cardBackgroundVariant: "coffee-sketch",
			conditions: "",
			isActive: true,
			sortOrder: 2,
		},
	});

	await prisma.platformCampaignTemplate.upsert({
		where: { id: DEMO_TEMPLATE_MATCHA_ID },
		update: {
			name: "5 matchas = 1 gratis",
			description: "Campaña corta para bebidas matcha.",
			requiredStamps: 5,
			suggestedStampTypeLabel: "Matcha",
			visualTemplate: "generic",
			cardBackgroundVariant: "coffee-minimal",
			conditions: "",
			isActive: true,
			sortOrder: 3,
		},
		create: {
			id: DEMO_TEMPLATE_MATCHA_ID,
			name: "5 matchas = 1 gratis",
			description: "Campaña corta para bebidas matcha.",
			requiredStamps: 5,
			suggestedStampTypeLabel: "Matcha",
			visualTemplate: "generic",
			cardBackgroundVariant: "coffee-minimal",
			conditions: "",
			isActive: true,
			sortOrder: 3,
		},
	});

	await prisma.platformGame.upsert({
		where: { id: DEMO_GAME_RULETA_ID },
		update: {
			slug: "ruleta",
			label: "Ruleta",
			description: "Gira la ruleta y gana premios al azar.",
			status: "active",
			requiredFeature: "gamification",
			sortOrder: 1,
		},
		create: {
			id: DEMO_GAME_RULETA_ID,
			slug: "ruleta",
			label: "Ruleta",
			description: "Gira la ruleta y gana premios al azar.",
			status: "active",
			requiredFeature: "gamification",
			sortOrder: 1,
		},
	});

	await prisma.platformGame.upsert({
		where: { id: DEMO_GAME_RASCA_ID },
		update: {
			slug: "rasca",
			label: "Rasca y gana",
			description: "Rasca tarjetas virtuales para descubrir recompensas.",
			status: "beta",
			requiredFeature: "gamification",
			sortOrder: 2,
		},
		create: {
			id: DEMO_GAME_RASCA_ID,
			slug: "rasca",
			label: "Rasca y gana",
			description: "Rasca tarjetas virtuales para descubrir recompensas.",
			status: "beta",
			requiredFeature: "gamification",
			sortOrder: 2,
		},
	});

	await prisma.platformGame.upsert({
		where: { id: DEMO_GAME_CAJA_ID },
		update: {
			slug: "caja-misteriosa",
			label: "Caja misteriosa",
			description: "Abre una caja sorpresa con premios exclusivos.",
			status: "draft",
			requiredFeature: "gamification",
			sortOrder: 3,
		},
		create: {
			id: DEMO_GAME_CAJA_ID,
			slug: "caja-misteriosa",
			label: "Caja misteriosa",
			description: "Abre una caja sorpresa con premios exclusivos.",
			status: "draft",
			requiredFeature: "gamification",
			sortOrder: 3,
		},
	});

	await prisma.tenantGameActivation.upsert({
		where: { id: DEMO_TENANT_RULETA_ACTIVATION_ID },
		update: {
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: DEMO_ROULETTE_CONFIG,
		},
		create: {
			id: DEMO_TENANT_RULETA_ACTIVATION_ID,
			tenantId: DEMO_TENANT_ID,
			gameSlug: RULETA_GAME_SLUG,
			isEnabled: true,
			config: DEMO_ROULETTE_CONFIG,
		},
	});

	console.log("Seed: demo owner + plans basic/pro/premium + customer QR (demo-qr-cafe-demo)");
	console.log("Seed: 3 platform campaign templates (coffee, croissant, matcha)");
	console.log("Seed: 3 platform games (ruleta active, rasca beta, caja-misteriosa draft)");
	console.log("Seed: cafe-demo ruleta activation (requires Premium plan to mutate)");
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
