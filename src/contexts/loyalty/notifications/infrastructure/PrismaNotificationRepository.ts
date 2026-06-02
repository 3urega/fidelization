import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Notification } from "../domain/Notification";
import { NotificationRepository } from "../domain/NotificationRepository";

@Service()
export class PrismaNotificationRepository extends NotificationRepository {
	async save(notification: Notification): Promise<void> {
		const p = notification.toPrimitives();

		await prisma.notification.create({
			data: {
				id: p.id,
				tenantId: p.tenantId,
				title: p.title,
				message: p.message,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Notification | null> {
		const row = await prisma.notification.findFirst({
			where: { id, tenantId },
		});

		return row
			? Notification.fromPrimitives({
					id: row.id,
					tenantId: row.tenantId,
					title: row.title,
					message: row.message,
				})
			: null;
	}
}
