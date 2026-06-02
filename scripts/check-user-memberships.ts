import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const STAFF = new Set(["owner", "employee", "admin"]);

async function main(): Promise<void> {
	const users = await prisma.user.findMany({
		orderBy: { email: "asc" },
		select: {
			id: true,
			name: true,
			email: true,
			platformRole: true,
			subscriptionPlan: true,
			memberships: {
				select: { role: true, tenant: { select: { slug: true, name: true } } },
			},
		},
	});

	const withoutMembership = users.filter((u) => u.memberships.length === 0);
	const withoutStaff = users.filter(
		(u) => u.memberships.length > 0 && !u.memberships.some((m) => STAFF.has(m.role)),
	);

	console.log(`Usuarios totales: ${users.length}`);
	console.log(`Sin fila en tenant_memberships: ${withoutMembership.length}`);
	for (const u of withoutMembership) {
		console.log(`  - ${u.email} (${u.id})`);
	}
	console.log(`Con membership pero sin rol staff: ${withoutStaff.length}`);
	for (const u of withoutStaff) {
		console.log(
			`  - ${u.email}: ${u.memberships.map((m) => `${m.role}@${m.tenant.slug}`).join(", ")}`,
		);
	}

	console.log("\nDetalle (roles):");
	for (const u of users) {
		const platform = u.platformRole ? `platform:${u.platformRole}` : null;
		const tenantRoles =
			u.memberships.map((m) => `tenant:${m.role}@${m.tenant.slug}`).join("; ") || null;
		const roles = [platform, tenantRoles].filter(Boolean).join(" | ") || "(sin rol)";
		console.log(`  ${u.email} (${u.name})`);
		console.log(`    id: ${u.id}`);
		console.log(`    roles: ${roles}`);
		if (u.memberships.length > 0) {
			for (const m of u.memberships) {
				console.log(`      → ${m.tenant.name} (${m.tenant.slug}): ${m.role}`);
			}
		}
	}
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
