import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Tenant } from "../../tenants/domain/Tenant";
import { OwnerMembership, TenantMembershipRepository } from "../domain/TenantMembershipRepository";
import { TenantRole } from "../domain/TenantRole";

@Service()
export class PrismaTenantMembershipRepository extends TenantMembershipRepository {
	async findOwnerMembershipByUserId(userId: string): Promise<OwnerMembership | null> {
		const membership = await prisma.tenantMembership.findFirst({
			where: { userId, role: "owner" },
			include: { tenant: true },
		});

		if (!membership) {
			return null;
		}

		return {
			tenant: Tenant.fromPrimitives({
				id: membership.tenant.id,
				name: membership.tenant.name,
				slug: membership.tenant.slug,
				logoUrl: membership.tenant.logoUrl,
				primaryColor: membership.tenant.primaryColor,
				secondaryColor: membership.tenant.secondaryColor,
				subscriptionPlan: membership.tenant.subscriptionPlan,
			}),
			role: membership.role as TenantRole,
		};
	}

	async findById(tenantId: string): Promise<Tenant | null> {
		const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

		if (!tenant) {
			return null;
		}

		return Tenant.fromPrimitives({
			id: tenant.id,
			name: tenant.name,
			slug: tenant.slug,
			logoUrl: tenant.logoUrl,
			primaryColor: tenant.primaryColor,
			secondaryColor: tenant.secondaryColor,
			subscriptionPlan: tenant.subscriptionPlan,
		});
	}
}
