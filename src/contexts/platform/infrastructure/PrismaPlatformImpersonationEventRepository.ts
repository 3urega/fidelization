import { randomUUID } from "crypto";
import { Service } from "diod";

import { prisma } from "../../../lib/prisma";
import {
	type PlatformImpersonationEventRecord,
	PlatformImpersonationEventRepository,
} from "../domain/PlatformImpersonationEventRepository";

@Service()
export class PrismaPlatformImpersonationEventRepository extends PlatformImpersonationEventRepository {
	async record(event: PlatformImpersonationEventRecord): Promise<void> {
		await prisma.platformImpersonationEvent.create({
			data: {
				id: randomUUID(),
				platformUserId: event.platformUserId,
				tenantId: event.tenantId,
				impersonatedUserId: event.impersonatedUserId,
			},
		});
	}
}
