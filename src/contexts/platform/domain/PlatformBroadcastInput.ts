import { InvalidPlatformBroadcast } from "./InvalidPlatformBroadcast";
import {
	type PlatformBroadcastAudience,
	type PlatformBroadcastChannel,
} from "./PlatformBroadcastTypes";

export type PlatformBroadcastInput = {
	channel: PlatformBroadcastChannel;
	audienceType: PlatformBroadcastAudience;
	tenantId?: string | null;
	subject: string;
	body: string;
};

const CHANNELS = new Set<PlatformBroadcastChannel>(["email", "push"]);
const AUDIENCES = new Set<PlatformBroadcastAudience>([
	"all_owners",
	"all_app_users",
	"tenant",
]);

export function parsePlatformBroadcastInput(input: {
	channel?: unknown;
	audienceType?: unknown;
	tenantId?: unknown;
	subject?: unknown;
	body?: unknown;
}): PlatformBroadcastInput {
	const channel = typeof input.channel === "string" ? input.channel : "";

	if (!CHANNELS.has(channel as PlatformBroadcastChannel)) {
		throw new InvalidPlatformBroadcast("channel must be email or push");
	}

	const audienceType = typeof input.audienceType === "string" ? input.audienceType : "";

	if (!AUDIENCES.has(audienceType as PlatformBroadcastAudience)) {
		throw new InvalidPlatformBroadcast(
			"audienceType must be all_owners, all_app_users, or tenant",
		);
	}

	const tenantId =
		input.tenantId === undefined || input.tenantId === null
			? null
			: typeof input.tenantId === "string"
				? input.tenantId.trim()
				: "";

	if (audienceType === "tenant" && !tenantId) {
		throw new InvalidPlatformBroadcast("tenantId is required for tenant audience");
	}

	if (audienceType !== "tenant" && tenantId) {
		throw new InvalidPlatformBroadcast("tenantId is only allowed for tenant audience");
	}

	const subject = typeof input.subject === "string" ? input.subject.trim() : "";
	const body = typeof input.body === "string" ? input.body.trim() : "";

	if (!subject) {
		throw new InvalidPlatformBroadcast("subject is required");
	}

	if (!body) {
		throw new InvalidPlatformBroadcast("body is required");
	}

	return {
		channel: channel as PlatformBroadcastChannel,
		audienceType: audienceType as PlatformBroadcastAudience,
		tenantId,
		subject,
		body,
	};
}
