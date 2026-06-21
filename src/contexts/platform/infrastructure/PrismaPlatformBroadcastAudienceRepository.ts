import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import { InvalidPlatformBroadcast } from "../domain/InvalidPlatformBroadcast";
import {
	PlatformBroadcastAudienceRepository,
	type PlatformBroadcastAudienceParams,
} from "../domain/PlatformBroadcastAudienceRepository";
import {
	type PlatformBroadcastRecipient,
} from "../domain/PlatformBroadcastTypes";

function dedupeRecipients(recipients: PlatformBroadcastRecipient[]): PlatformBroadcastRecipient[] {
	const seen = new Set<string>();
	const result: PlatformBroadcastRecipient[] = [];

	for (const recipient of recipients) {
		const email = recipient.email.trim();

		if (!email || seen.has(recipient.userId)) {
			continue;
		}

		seen.add(recipient.userId);
		result.push({
			userId: recipient.userId,
			name: recipient.name,
			email,
		});
	}

	return result;
}

@Service()
export class PrismaPlatformBroadcastAudienceRepository extends PlatformBroadcastAudienceRepository {
	async listRecipients(params: PlatformBroadcastAudienceParams): Promise<PlatformBroadcastRecipient[]> {
		if (params.audienceType === "tenant") {
			const tenantId = params.tenantId?.trim();

			if (!tenantId) {
				throw new InvalidPlatformBroadcast("tenantId is required for tenant audience");
			}

			const exists = await this.tenantExists(tenantId);

			if (!exists) {
				throw new InvalidPlatformBroadcast("tenant not found");
			}

			const rows = await prisma.user.findMany({
				where: {
					memberships: {
						some: {
							tenantId,
							role: { in: ["owner", "employee"] },
						},
					},
				},
				select: {
					id: true,
					name: true,
					email: true,
				},
				orderBy: { name: "asc" },
			});

			return dedupeRecipients(
				rows.map((row) => ({
					userId: row.id,
					name: row.name,
					email: row.email,
				})),
			);
		}

		if (params.audienceType === "all_owners") {
			const rows = await prisma.user.findMany({
				where: {
					memberships: {
						some: {
							role: "owner",
						},
					},
				},
				select: {
					id: true,
					name: true,
					email: true,
				},
				orderBy: { name: "asc" },
			});

			return dedupeRecipients(
				rows.map((row) => ({
					userId: row.id,
					name: row.name,
					email: row.email,
				})),
			);
		}

		const rows = await prisma.user.findMany({
			where: {
				platformRole: null,
			},
			select: {
				id: true,
				name: true,
				email: true,
			},
			orderBy: { name: "asc" },
		});

		return dedupeRecipients(
			rows.map((row) => ({
				userId: row.id,
				name: row.name,
				email: row.email,
			})),
		);
	}

	async tenantExists(tenantId: string): Promise<boolean> {
		const row = await prisma.tenant.findUnique({
			where: { id: tenantId },
			select: { id: true },
		});

		return row !== null;
	}
}
