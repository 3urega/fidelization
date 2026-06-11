import { randomUUID } from "crypto";
import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { User } from "../../../identity/users/domain/User";
import { UserPlan } from "../../../identity/users/domain/UserPlan";
import { TenantRole } from "../../memberships/domain/TenantRole";
import { tenantFromPrismaRow } from "../../tenants/infrastructure/tenantFromPrismaRow";
import {
	CreateOwnerBusinessParams,
	CreateOwnerBusinessResult,
	OwnerBusinessRepository,
} from "../domain/OwnerBusinessRepository";
import { resolveUniqueTenantSlug, slugFromBusinessName } from "./resolveUniqueTenantSlug";

@Service()
export class PrismaOwnerBusinessRepository extends OwnerBusinessRepository {
	async createForUser(params: CreateOwnerBusinessParams): Promise<CreateOwnerBusinessResult> {
		const tenantId = randomUUID();
		const membershipId = randomUUID();
		const baseSlug = slugFromBusinessName(params.businessName);
		const slug = await resolveUniqueTenantSlug(baseSlug);

		const result = await prisma.$transaction(async (tx) => {
			const userRow = await tx.user.findUniqueOrThrow({ where: { id: params.userId } });

			const tenantRow = await tx.tenant.create({
				data: {
					id: tenantId,
					name: params.businessName.trim(),
					slug,
					businessType: params.businessType,
				},
			});

			await tx.tenantMembership.create({
				data: {
					id: membershipId,
					tenantId,
					userId: params.userId,
					role: "owner",
				},
			});

			return { userRow, tenantRow };
		});

		return {
			user: User.fromPrimitives({
				id: result.userRow.id,
				name: result.userRow.name,
				email: result.userRow.email,
				profilePicture: result.userRow.profilePicture,
				plan: result.userRow.subscriptionPlan as UserPlan,
				qrValue: result.userRow.qrValue,
				oauthProvider: result.userRow.oauthProvider,
				oauthSubject: result.userRow.oauthSubject,
			}),
			tenant: tenantFromPrismaRow(result.tenantRow),
			role: TenantRole.Owner,
		};
	}
}
