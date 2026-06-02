import "dotenv/config";

import { verifyPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";

const email = process.argv[2] ?? "marcfarresp@gmail.com";
const password = process.argv[3] ?? "andromed4";

async function main(): Promise<void> {
	const row = await prisma.user.findUnique({
		where: { email: email.toLowerCase().trim() },
		include: { memberships: { include: { tenant: true } } },
	});

	if (!row) {
		console.log("USER: not found");
		process.exit(1);
	}

	const valid = await verifyPassword(password, row.passwordHash);
	console.log("USER:", row.email, row.name);
	console.log("PASSWORD_OK:", valid);
	console.log("PLATFORM_ROLE:", row.platformRole ?? "(none)");
	for (const m of row.memberships) {
		console.log(`  membership: ${m.role} @ ${m.tenant.slug} (${m.tenant.name})`);
	}
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
