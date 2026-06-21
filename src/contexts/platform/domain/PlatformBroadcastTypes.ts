export type PlatformBroadcastChannel = "email" | "push";

export type PlatformBroadcastAudience = "all_owners" | "all_app_users" | "tenant";

export type PlatformBroadcastStatus = "queued" | "sent" | "failed";

export type PlatformBroadcastDeliveryStatus = "logged" | "failed";

export type PlatformBroadcastRecipient = {
	userId: string;
	name: string;
	email: string;
};

export type PlatformBroadcastDeliveryPrimitives = {
	id: string;
	recipientUserId: string;
	recipientEmail: string;
	deliveryStatus: PlatformBroadcastDeliveryStatus;
};

export type PlatformBroadcastPrimitives = {
	id: string;
	channel: PlatformBroadcastChannel;
	audienceType: PlatformBroadcastAudience;
	tenantId: string | null;
	subject: string;
	body: string;
	status: PlatformBroadcastStatus;
	recipientCount: number;
	createdByUserId: string;
	createdAt: Date;
	sentAt: Date | null;
};

export type PlatformBroadcastCreateParams = {
	channel: PlatformBroadcastChannel;
	audienceType: PlatformBroadcastAudience;
	tenantId: string | null;
	subject: string;
	body: string;
	createdByUserId: string;
	recipients: PlatformBroadcastRecipient[];
};
