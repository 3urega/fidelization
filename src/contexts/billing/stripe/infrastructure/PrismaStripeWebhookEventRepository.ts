import { Service } from "diod";

import { Prisma } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { StripeWebhookEventRepository } from "../domain/StripeWebhookEventRepository";

@Service()
export class PrismaStripeWebhookEventRepository extends StripeWebhookEventRepository {
	async tryRecord(eventId: string, eventType: string): Promise<boolean> {
		try {
			await prisma.stripeWebhookEvent.create({
				data: {
					id: eventId,
					type: eventType,
				},
			});

			return true;
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				return false;
			}

			throw error;
		}
	}
}
