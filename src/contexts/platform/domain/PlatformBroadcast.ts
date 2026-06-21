import { randomUUID } from "crypto";

import {
	type PlatformBroadcastChannel,
	type PlatformBroadcastCreateParams,
	type PlatformBroadcastDeliveryPrimitives,
	type PlatformBroadcastDeliveryStatus,
	type PlatformBroadcastPrimitives,
	type PlatformBroadcastRecipient,
	type PlatformBroadcastStatus,
} from "./PlatformBroadcastTypes";

export class PlatformBroadcast {
	private constructor(
		public readonly id: string,
		public readonly channel: PlatformBroadcastChannel,
		public readonly audienceType: PlatformBroadcastCreateParams["audienceType"],
		public readonly tenantId: string | null,
		public readonly subject: string,
		public readonly body: string,
		public readonly status: PlatformBroadcastStatus,
		public readonly recipientCount: number,
		public readonly createdByUserId: string,
		public readonly createdAt: Date,
		public readonly sentAt: Date | null,
		public readonly deliveries: PlatformBroadcastDeliveryPrimitives[],
	) {}

	static createQueued(params: PlatformBroadcastCreateParams): PlatformBroadcast {
		const deliveries = params.recipients.map(
			(recipient): PlatformBroadcastDeliveryPrimitives => ({
				id: randomUUID(),
				recipientUserId: recipient.userId,
				recipientEmail: recipient.email,
				deliveryStatus: "logged",
			}),
		);

		return new PlatformBroadcast(
			randomUUID(),
			params.channel,
			params.audienceType,
			params.tenantId,
			params.subject,
			params.body,
			"queued",
			params.recipients.length,
			params.createdByUserId,
			new Date(),
			null,
			deliveries,
		);
	}

	static fromPrimitives(
		primitives: PlatformBroadcastPrimitives,
		deliveries: PlatformBroadcastDeliveryPrimitives[] = [],
	): PlatformBroadcast {
		return new PlatformBroadcast(
			primitives.id,
			primitives.channel,
			primitives.audienceType,
			primitives.tenantId,
			primitives.subject,
			primitives.body,
			primitives.status,
			primitives.recipientCount,
			primitives.createdByUserId,
			primitives.createdAt,
			primitives.sentAt,
			deliveries,
		);
	}

	toPrimitives(): PlatformBroadcastPrimitives {
		return {
			id: this.id,
			channel: this.channel,
			audienceType: this.audienceType,
			tenantId: this.tenantId,
			subject: this.subject,
			body: this.body,
			status: this.status,
			recipientCount: this.recipientCount,
			createdByUserId: this.createdByUserId,
			createdAt: this.createdAt,
			sentAt: this.sentAt,
		};
	}

	markSent(sentAt: Date): PlatformBroadcast {
		return new PlatformBroadcast(
			this.id,
			this.channel,
			this.audienceType,
			this.tenantId,
			this.subject,
			this.body,
			"sent",
			this.recipientCount,
			this.createdByUserId,
			this.createdAt,
			sentAt,
			this.deliveries,
		);
	}

	markFailed(): PlatformBroadcast {
		return new PlatformBroadcast(
			this.id,
			this.channel,
			this.audienceType,
			this.tenantId,
			this.subject,
			this.body,
			"failed",
			this.recipientCount,
			this.createdByUserId,
			this.createdAt,
			this.sentAt,
			this.deliveries,
		);
	}

	withDeliveryStatus(
		recipientUserId: string,
		deliveryStatus: PlatformBroadcastDeliveryStatus,
	): PlatformBroadcast {
		const deliveries = this.deliveries.map((delivery) =>
			delivery.recipientUserId === recipientUserId
				? { ...delivery, deliveryStatus }
				: delivery,
		);

		return new PlatformBroadcast(
			this.id,
			this.channel,
			this.audienceType,
			this.tenantId,
			this.subject,
			this.body,
			this.status,
			this.recipientCount,
			this.createdByUserId,
			this.createdAt,
			this.sentAt,
			deliveries,
		);
	}

	getRecipients(): PlatformBroadcastRecipient[] {
		return this.deliveries.map((delivery) => ({
			userId: delivery.recipientUserId,
			name: "",
			email: delivery.recipientEmail,
		}));
	}
}
