import { randomUUID } from "crypto";
import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Tenant } from "../../tenants/domain/Tenant";
import { tenantFromPrismaRow } from "../../tenants/infrastructure/tenantFromPrismaRow";
import {
	CreateStaffMembershipParams,
	TenantEmployee,
} from "../domain/TenantEmployee";
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

		return tenantFromPrismaRow(tenant);
	}

	async createStaffMembership(
		params: CreateStaffMembershipParams,
	): Promise<{ membershipId: string }> {
		const membershipId = randomUUID();

		await prisma.tenantMembership.create({
			data: {
				id: membershipId,
				tenantId: params.tenantId,
				userId: params.userId,
				role: params.role,
			},
		});

		return { membershipId };
	}

	async listEmployeesByTenant(tenantId: string): Promise<TenantEmployee[]> {
		const memberships = await prisma.tenantMembership.findMany({
			where: { tenantId, role: TenantRole.Employee },
			include: { user: true },
			orderBy: { user: { name: "asc" } },
		});

		return memberships.map((membership) => ({
			membershipId: membership.id,
			userId: membership.userId,
			name: membership.user.name,
			email: membership.user.email,
			role: TenantRole.Employee,
		}));
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
			subscriptionPlanId: string | null;
			status: string;
			createdAt: Date;
		};
		role: string;
	}): StaffMembership {
		const role = membership.role as TenantRole;
		if (!isStaffRole(role)) {
			throw new Error(`Unexpected non-staff role: ${membership.role}`);
		}

		return {
			tenant: tenantFromPrismaRow(membership.tenant),
			role,
		};
	}
}
