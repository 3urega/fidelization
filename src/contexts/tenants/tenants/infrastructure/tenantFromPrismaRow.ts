import { Tenant } from "../domain/Tenant";
import { parseTenantStatus } from "../domain/TenantStatus";

export type PrismaTenantRow = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	subscriptionPlan: string;
	status: string;
	createdAt: Date;
};

export function tenantFromPrismaRow(row: PrismaTenantRow): Tenant {
	return Tenant.fromPrimitives({
		id: row.id,
		name: row.name,
		slug: row.slug,
		logoUrl: row.logoUrl,
		primaryColor: row.primaryColor,
		secondaryColor: row.secondaryColor,
		subscriptionPlan: row.subscriptionPlan,
		status: parseTenantStatus(row.status),
		createdAt: row.createdAt.toISOString(),
	});
}
