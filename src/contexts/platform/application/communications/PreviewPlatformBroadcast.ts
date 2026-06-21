import { Service } from "diod";

import { InvalidPlatformBroadcast } from "../../domain/InvalidPlatformBroadcast";
import { PlatformBroadcastAudienceRepository } from "../../domain/PlatformBroadcastAudienceRepository";
import { parsePlatformBroadcastInput } from "../../domain/PlatformBroadcastInput";
import { type PlatformBroadcastRecipient } from "../../domain/PlatformBroadcastTypes";

export const PLATFORM_BROADCAST_PREVIEW_SAMPLE_SIZE = 5;

export type PreviewPlatformBroadcastParams = {
	input: {
		channel?: unknown;
		audienceType?: unknown;
		tenantId?: unknown;
		subject?: unknown;
		body?: unknown;
	};
};

export type PreviewPlatformBroadcastResult = {
	recipientCount: number;
	sampleRecipients: PlatformBroadcastRecipient[];
};

@Service()
export class PreviewPlatformBroadcast {
	constructor(private readonly audienceRepository: PlatformBroadcastAudienceRepository) {}

	async execute(params: PreviewPlatformBroadcastParams): Promise<PreviewPlatformBroadcastResult> {
		const parsed = parsePlatformBroadcastInput(params.input);
		const recipients = await this.audienceRepository.listRecipients({
			audienceType: parsed.audienceType,
			tenantId: parsed.tenantId,
		});

		if (recipients.length === 0) {
			throw new InvalidPlatformBroadcast("No recipients found for the selected audience");
		}

		return {
			recipientCount: recipients.length,
			sampleRecipients: recipients.slice(0, PLATFORM_BROADCAST_PREVIEW_SAMPLE_SIZE),
		};
	}
}
