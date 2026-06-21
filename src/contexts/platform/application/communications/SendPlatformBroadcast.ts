import { Service } from "diod";

import { PlatformEmailSender } from "../../../shared/notifications/domain/PlatformEmailSender";
import { PlatformPushSender } from "../../../shared/notifications/domain/PlatformPushSender";
import { InvalidPlatformBroadcast } from "../../domain/InvalidPlatformBroadcast";
import { PlatformBroadcast } from "../../domain/PlatformBroadcast";
import { PlatformBroadcastAudienceRepository } from "../../domain/PlatformBroadcastAudienceRepository";
import { parsePlatformBroadcastInput } from "../../domain/PlatformBroadcastInput";
import { PlatformBroadcastRateLimitExceeded } from "../../domain/PlatformBroadcastRateLimitExceeded";
import { PlatformBroadcastRepository } from "../../domain/PlatformBroadcastRepository";

export const PLATFORM_BROADCAST_RATE_LIMIT_PER_HOUR = 10;

export type SendPlatformBroadcastParams = {
	createdByUserId: string;
	input: {
		channel?: unknown;
		audienceType?: unknown;
		tenantId?: unknown;
		subject?: unknown;
		body?: unknown;
	};
};

@Service()
export class SendPlatformBroadcast {
	constructor(
		private readonly broadcastRepository: PlatformBroadcastRepository,
		private readonly audienceRepository: PlatformBroadcastAudienceRepository,
		private readonly emailSender: PlatformEmailSender,
		private readonly pushSender: PlatformPushSender,
	) {}

	async execute(params: SendPlatformBroadcastParams): Promise<PlatformBroadcast> {
		const parsed = parsePlatformBroadcastInput(params.input);
		await this.assertRateLimit(params.createdByUserId);

		const recipients = await this.audienceRepository.listRecipients({
			audienceType: parsed.audienceType,
			tenantId: parsed.tenantId,
		});

		if (recipients.length === 0) {
			throw new InvalidPlatformBroadcast("No recipients found for the selected audience");
		}

		let broadcast = PlatformBroadcast.createQueued({
			channel: parsed.channel,
			audienceType: parsed.audienceType,
			tenantId: parsed.tenantId ?? null,
			subject: parsed.subject,
			body: parsed.body,
			createdByUserId: params.createdByUserId,
			recipients,
		});

		await this.broadcastRepository.save(broadcast);

		try {
			for (const recipient of recipients) {
				const sendParams = {
					broadcastId: broadcast.id,
					userId: recipient.userId,
					to: recipient.email,
					subject: parsed.subject,
					body: parsed.body,
				};

				if (parsed.channel === "email") {
					await this.emailSender.send(sendParams);
				} else {
					await this.pushSender.send(sendParams);
				}
			}

			broadcast = broadcast.markSent(new Date());
			await this.broadcastRepository.updateStatus(broadcast);
		} catch {
			broadcast = broadcast.markFailed();
			await this.broadcastRepository.updateStatus(broadcast);
			throw new InvalidPlatformBroadcast("Broadcast delivery failed");
		}

		return broadcast;
	}

	private async assertRateLimit(createdByUserId: string): Promise<void> {
		const since = new Date(Date.now() - 60 * 60 * 1000);
		const recentCount = await this.broadcastRepository.countRecentSentByCreator({
			createdByUserId,
			since,
		});

		if (recentCount >= PLATFORM_BROADCAST_RATE_LIMIT_PER_HOUR) {
			throw new PlatformBroadcastRateLimitExceeded(PLATFORM_BROADCAST_RATE_LIMIT_PER_HOUR);
		}
	}
}
