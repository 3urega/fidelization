import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Tenant } from "../../tenants/domain/Tenant";
import { StaffMembership, TenantMembershipRepository } from "../domain/TenantMembershipRepository";
import { isStaffRole, TenantRole } from "../domain/TenantRole";

const STAFF_ROLES = ["owner", "employee", "admin"] as const;

@Service()
export class PrismaTenantMembershipRepository extends TenantMembershipRepository {
	async findStaffMembership(userId: string, tenantId: string): Promise<StaffMembership | null> {
		const membership = await prisma.tenantMembership.findFirst({
			where: {
				userId,
				tenantId,
				role: { in: [...STAFF_ROLES] },
			},
			include: { tenant: true },
		});

		return membership ? this.toStaffMembership(membership) : null;
	}

	async findFirstStaffMembershipByUserId(userId: string): Promise<StaffMembership | null> {
		const owner = await prisma.tenantMembership.findFirst({
			where: { userId, role: "owner" },
			include: { tenant: true },
		});

		if (owner) {
			return this.toStaffMembership(owner);
		}

		const membership = await prisma.tenantMembership.findFirst({
			where: {
				userId,
				role: { in: ["employee", "admin"] },
			},
			include: { tenant: true },
		});

		return membership ? this.toStaffMembership(membership) : null;
	}

	async findOwnerMembershipByUserId(userId: string): Promise<StaffMembership | null> {
		const membership = await prisma.tenantMembership.findFirst({
			where: { userId, role: "owner" },
			include: { tenant: true },
		});

		return membership ? this.toStaffMembership(membership) : null;
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

	private toStaffMembership(membership: {
		tenant: {
			id: string;
			name: string;
			slug: string;
			logoUrl: string;
			primaryColor: string;
			secondaryColor: string;
			subscriptionPlan: string;
		};
		role: string;
	}): StaffMembership {
		const role = membership.role as TenantRole;
		if (!isStaffRole(role)) {
			throw new Error(`Unexpected non-staff role: ${membership.role}`);
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
			role,
		};
	}
}
