import "dotenv/config";

import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
	const users = await prisma.user.findMany({ take: 1 });
	console.log(`✅ Connected (${users.length} user(s) found)`);
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
