import { randomUUID } from "crypto";
import { Service } from "diod";

import { hashPassword } from "../../../../lib/auth/password";
import { prisma } from "../../../../lib/prisma";
import { User } from "../../../identity/users/domain/User";
import { UserPlan } from "../../../identity/users/domain/UserPlan";
import { TenantRole } from "../../memberships/domain/TenantRole";
import { tenantFromPrismaRow } from "../../tenants/infrastructure/tenantFromPrismaRow";
import {
	OwnerOnboardingRepository,
	RegisterOwnerParams,
	RegisterOwnerResult,
} from "../domain/OwnerOnboardingRepository";
import { slugFromBusinessName, resolveUniqueTenantSlug } from "./resolveUniqueTenantSlug";

@Service()
export class PrismaOwnerOnboardingRepository extends OwnerOnboardingRepository {
	async register(params: RegisterOwnerParams): Promise<RegisterOwnerResult> {
		const userId = randomUUID();
		const tenantId = randomUUID();
		const membershipId = randomUUID();
		const email = params.email.toLowerCase().trim();
		const passwordHash = await hashPassword(params.password);
		const baseSlug = slugFromBusinessName(params.businessName);
		const slug = await resolveUniqueTenantSlug(baseSlug);

		const result = await prisma.$transaction(async (tx) => {
			const userRow = await tx.user.create({
				data: {
					id: userId,
					name: params.name.trim(),
					email,
					profilePicture: params.profilePicture?.trim() ?? "",
					passwordHash,
					subscriptionPlan: UserPlan.Free,
				},
			});

			const tenantRow = await tx.tenant.create({
				data: {
					id: tenantId,
					name: params.businessName.trim(),
					slug,
				},
			});

			await tx.tenantMembership.create({
				data: {
					id: membershipId,
					tenantId,
					userId,
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
