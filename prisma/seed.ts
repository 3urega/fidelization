import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL must be set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
	const alice = await prisma.user.upsert({
		where: { email: "alice@prisma.io" },
		update: {},
		create: {
			name: "Alice",
			email: "alice@prisma.io",
			posts: {
				create: { title: "Hello World" },
			},
		},
	});

	const bob = await prisma.user.upsert({
		where: { email: "bob@prisma.io" },
		update: {},
		create: {
			name: "Bob",
			email: "bob@prisma.io",
			posts: {
				create: { title: "First post" },
			},
		},
	});

	console.log({ alice: alice.email, bob: bob.email });
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
