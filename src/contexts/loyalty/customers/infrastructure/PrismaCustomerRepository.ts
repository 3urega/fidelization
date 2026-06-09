import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Customer } from "../domain/Customer";
import { CustomerEstablishmentSummary } from "../domain/CustomerEstablishmentSummary";
import { CustomerRepository } from "../domain/CustomerRepository";

@Service()
export class PrismaCustomerRepository extends CustomerRepository {
	async save(customer: Customer): Promise<void> {
		const p = customer.toPrimitives();

		await prisma.customer.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				userId: p.userId,
				name: p.name,
				email: p.email,
				phone: p.phone,
				qrValue: p.qrValue,
				pointsBalance: p.pointsBalance,
				visitsCount: p.visitsCount,
			},
			update: {
				userId: p.userId,
				name: p.name,
				email: p.email,
				phone: p.phone,
				pointsBalance: p.pointsBalance,
				visitsCount: p.visitsCount,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Customer | null> {
		const row = await prisma.customer.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toAggregate(row) : null;
	}

	async searchByQrValue(tenantId: string, qrValue: string): Promise<Customer | null> {
		const row = await prisma.customer.findFirst({
			where: { qrValue, tenantId },
		});

		return row ? this.toAggregate(row) : null;
	}

	async listWithInteractionByUserId(userId: string): Promise<CustomerEstablishmentSummary[]> {
		const rows = await prisma.customer.findMany({
			where: {
				userId,
				OR: [{ visitsCount: { gt: 0 } }, { pointsBalance: { gt: 0 } }],
			},
			include: { tenant: true },
			orderBy: { tenant: { name: "asc" } },
		});

		return rows.map((row) => ({
			customerId: row.id,
			tenantId: row.tenantId,
			name: row.tenant.name,
			slug: row.tenant.slug,
			logoUrl: row.tenant.logoUrl || null,
			pointsBalance: row.pointsBalance,
			visitsCount: row.visitsCount,
		}));
	}

	private toAggregate(row: {
		id: string;
		tenantId: string;
		userId: string | null;
		name: string;
		email: string | null;
		phone: string | null;
		qrValue: string;
		pointsBalance: number;
		visitsCount: number;
	}): Customer {
		return Customer.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			userId: row.userId,
			name: row.name,
			email: row.email,
			phone: row.phone,
			qrValue: row.qrValue,
			pointsBalance: row.pointsBalance,
			visitsCount: row.visitsCount,
		});
	}
}
