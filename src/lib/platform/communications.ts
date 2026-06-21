import type { PlatformBroadcast } from "../../contexts/platform/domain/PlatformBroadcast";
import type { PlatformBroadcastListPage } from "../../contexts/platform/domain/PlatformBroadcastRepository";
import type { PlatformBroadcastRecipient } from "../../contexts/platform/domain/PlatformBroadcastTypes";
import type { PreviewPlatformBroadcastResult } from "../../contexts/platform/application/communications/PreviewPlatformBroadcast";

export type PlatformBroadcastRecipientResponse = {
	userId: string;
	name: string;
	email: string;
};

export type PlatformBroadcastResponse = {
	id: string;
	channel: string;
	audienceType: string;
	tenantId: string | null;
	subject: string;
	body: string;
	status: string;
	recipientCount: number;
	createdByUserId: string;
	createdAt: string;
	sentAt: string | null;
};

export type PlatformBroadcastPreviewResponse = {
	preview: true;
	recipientCount: number;
	sampleRecipients: PlatformBroadcastRecipientResponse[];
};

export function platformBroadcastRecipientToJson(
	recipient: PlatformBroadcastRecipient,
): PlatformBroadcastRecipientResponse {
	return {
		userId: recipient.userId,
		name: recipient.name,
		email: recipient.email,
	};
}

export function platformBroadcastToJson(broadcast: PlatformBroadcast): PlatformBroadcastResponse {
	const primitives = broadcast.toPrimitives();

	return {
		id: primitives.id,
		channel: primitives.channel,
		audienceType: primitives.audienceType,
		tenantId: primitives.tenantId,
		subject: primitives.subject,
		body: primitives.body,
		status: primitives.status,
		recipientCount: primitives.recipientCount,
		createdByUserId: primitives.createdByUserId,
		createdAt: primitives.createdAt.toISOString(),
		sentAt: primitives.sentAt?.toISOString() ?? null,
	};
}

export function platformBroadcastPreviewToJson(
	preview: PreviewPlatformBroadcastResult,
): PlatformBroadcastPreviewResponse {
	return {
		preview: true,
		recipientCount: preview.recipientCount,
		sampleRecipients: preview.sampleRecipients.map(platformBroadcastRecipientToJson),
	};
}

export function platformBroadcastsPageToJson(page: PlatformBroadcastListPage): {
	broadcasts: PlatformBroadcastResponse[];
	total: number;
	hasMore: boolean;
	offset: number;
	limit: number;
} {
	return {
		broadcasts: page.broadcasts.map(platformBroadcastToJson),
		total: page.total,
		hasMore: page.hasMore,
		offset: page.offset,
		limit: page.limit,
	};
}
