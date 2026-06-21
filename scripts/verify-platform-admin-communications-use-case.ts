/* eslint-disable no-console -- CLI verify script */
import "dotenv/config";

import { ListPlatformBroadcasts } from "../src/contexts/platform/application/communications/ListPlatformBroadcasts";
import { PreviewPlatformBroadcast } from "../src/contexts/platform/application/communications/PreviewPlatformBroadcast";
import {
	PLATFORM_BROADCAST_RATE_LIMIT_PER_HOUR,
	SendPlatformBroadcast,
} from "../src/contexts/platform/application/communications/SendPlatformBroadcast";
import { InvalidPlatformBroadcast } from "../src/contexts/platform/domain/InvalidPlatformBroadcast";
import { PlatformBroadcast } from "../src/contexts/platform/domain/PlatformBroadcast";
import {
	PlatformBroadcastAudienceRepository,
	type PlatformBroadcastAudienceParams,
} from "../src/contexts/platform/domain/PlatformBroadcastAudienceRepository";
import {
	PlatformBroadcastRepository,
	type PlatformBroadcastListPage,
	type PlatformBroadcastListParams,
} from "../src/contexts/platform/domain/PlatformBroadcastRepository";
import { PlatformBroadcastRateLimitExceeded } from "../src/contexts/platform/domain/PlatformBroadcastRateLimitExceeded";
import {
	type PlatformBroadcastRecipient,
} from "../src/contexts/platform/domain/PlatformBroadcastTypes";
import {
	PlatformEmailSender,
	type PlatformEmailSendParams,
} from "../src/contexts/shared/notifications/domain/PlatformEmailSender";
import {
	PlatformPushSender,
	type PlatformPushSendParams,
} from "../src/contexts/shared/notifications/domain/PlatformPushSender";

const ownerOne: PlatformBroadcastRecipient = {
	userId: "owner-1",
	name: "Owner One",
	email: "owner1@example.com",
};

const ownerTwo: PlatformBroadcastRecipient = {
	userId: "owner-2",
	name: "Owner Two",
	email: "owner2@example.com",
};

class InMemoryPlatformBroadcastAudienceRepository extends PlatformBroadcastAudienceRepository {
	constructor(
		private readonly recipientsByAudience: Record<string, PlatformBroadcastRecipient[]>,
		private readonly tenants: Set<string>,
	) {
		super();
	}

	async listRecipients(params: PlatformBroadcastAudienceParams): Promise<PlatformBroadcastRecipient[]> {
		if (params.audienceType === "tenant") {
			const tenantId = params.tenantId ?? "";

			if (!this.tenants.has(tenantId)) {
				throw new InvalidPlatformBroadcast("tenant not found");
			}

			return this.recipientsByAudience[`tenant:${tenantId}`] ?? [];
		}

		return this.recipientsByAudience[params.audienceType] ?? [];
	}

	async tenantExists(tenantId: string): Promise<boolean> {
		return this.tenants.has(tenantId);
	}
}

class InMemoryPlatformBroadcastRepository extends PlatformBroadcastRepository {
	constructor(private broadcasts: PlatformBroadcast[] = []) {
		super();
	}

	async save(broadcast: PlatformBroadcast): Promise<void> {
		this.broadcasts.push(broadcast);
	}

	async updateStatus(broadcast: PlatformBroadcast): Promise<void> {
		const index = this.broadcasts.findIndex((row) => row.id === broadcast.id);

		if (index >= 0) {
			this.broadcasts[index] = broadcast;
		}
	}

	async countRecentSentByCreator(params: {
		createdByUserId: string;
		since: Date;
	}): Promise<number> {
		return this.broadcasts.filter(
			(row) =>
				row.createdByUserId === params.createdByUserId &&
				row.createdAt >= params.since &&
				(row.status === "queued" || row.status === "sent"),
		).length;
	}

	async list(params: PlatformBroadcastListParams): Promise<PlatformBroadcastListPage> {
		const page = this.broadcasts.slice(params.offset, params.offset + params.limit);

		return {
			broadcasts: page,
			total: this.broadcasts.length,
			hasMore: params.offset + params.limit < this.broadcasts.length,
			offset: params.offset,
			limit: params.limit,
		};
	}

	getAll(): PlatformBroadcast[] {
		return this.broadcasts;
	}
}

class RecordingPlatformEmailSender extends PlatformEmailSender {
	readonly sent: PlatformEmailSendParams[] = [];

	async send(params: PlatformEmailSendParams): Promise<void> {
		this.sent.push(params);
	}
}

class RecordingPlatformPushSender extends PlatformPushSender {
	readonly sent: PlatformPushSendParams[] = [];

	async send(params: PlatformPushSendParams): Promise<void> {
		this.sent.push(params);
	}
}

async function main(): Promise<void> {
	const audienceRepository = new InMemoryPlatformBroadcastAudienceRepository(
		{
			all_owners: [ownerOne, ownerTwo],
			all_app_users: [ownerOne],
			"tenant:tenant-1": [ownerOne],
		},
		new Set(["tenant-1"]),
	);
	const broadcastRepository = new InMemoryPlatformBroadcastRepository();
	const emailSender = new RecordingPlatformEmailSender();
	const pushSender = new RecordingPlatformPushSender();

	const previewUseCase = new PreviewPlatformBroadcast(audienceRepository);
	const sendUseCase = new SendPlatformBroadcast(
		broadcastRepository,
		audienceRepository,
		emailSender,
		pushSender,
	);
	const listUseCase = new ListPlatformBroadcasts(broadcastRepository);

	const preview = await previewUseCase.execute({
		input: {
			channel: "email",
			audienceType: "all_owners",
			subject: "Aviso plataforma",
			body: "Mensaje de prueba",
		},
	});

	if (preview.recipientCount !== 2 || preview.sampleRecipients.length !== 2) {
		console.error("❌ preview recipient count/sample", preview);
		process.exit(1);
	}

	if (broadcastRepository.getAll().length !== 0) {
		console.error("❌ preview should not persist broadcasts");
		process.exit(1);
	}

	console.log("✅ PreviewPlatformBroadcast returns count without persistence");

	const sent = await sendUseCase.execute({
		createdByUserId: "platform-admin-1",
		input: {
			channel: "email",
			audienceType: "all_owners",
			subject: "Aviso plataforma",
			body: "Mensaje de prueba",
		},
	});

	if (sent.status !== "sent" || sent.recipientCount !== 2 || emailSender.sent.length !== 2) {
		console.error("❌ send email broadcast", sent.toPrimitives(), emailSender.sent.length);
		process.exit(1);
	}

	if (broadcastRepository.getAll().length !== 1) {
		console.error("❌ send should persist one broadcast");
		process.exit(1);
	}

	console.log("✅ SendPlatformBroadcast persists and sends via email adapter");

	const pushSent = await sendUseCase.execute({
		createdByUserId: "platform-admin-1",
		input: {
			channel: "push",
			audienceType: "tenant",
			tenantId: "tenant-1",
			subject: "Push stub",
			body: "Notificación de prueba",
		},
	});

	if (pushSent.status !== "sent" || pushSender.sent.length !== 1) {
		console.error("❌ send push broadcast", pushSent.toPrimitives(), pushSender.sent.length);
		process.exit(1);
	}

	console.log("✅ SendPlatformBroadcast uses push stub adapter");

	const list = await listUseCase.execute({ limit: 10, offset: 0 });

	if (list.total !== 2 || list.broadcasts.length !== 2) {
		console.error("❌ list broadcasts", list);
		process.exit(1);
	}

	console.log("✅ ListPlatformBroadcasts returns recent broadcasts");

	for (let index = 0; index < PLATFORM_BROADCAST_RATE_LIMIT_PER_HOUR; index += 1) {
		await sendUseCase.execute({
			createdByUserId: "platform-admin-2",
			input: {
				channel: "email",
				audienceType: "all_app_users",
				subject: `Rate ${index}`,
				body: "Body",
			},
		});
	}

	try {
		await sendUseCase.execute({
			createdByUserId: "platform-admin-2",
			input: {
				channel: "email",
				audienceType: "all_app_users",
				subject: "Rate limit exceeded",
				body: "Body",
			},
		});
		console.error("❌ expected rate limit error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof PlatformBroadcastRateLimitExceeded)) {
			console.error("❌ wrong rate limit error", error);
			process.exit(1);
		}
	}

	console.log("✅ rate limit enforced");

	try {
		await previewUseCase.execute({
			input: {
				channel: "email",
				audienceType: "tenant",
				subject: "Missing tenant",
				body: "Body",
			},
		});
		console.error("❌ expected tenantId validation error");
		process.exit(1);
	} catch (error) {
		if (!(error instanceof InvalidPlatformBroadcast)) {
			console.error("❌ wrong tenant validation error", error);
			process.exit(1);
		}
	}

	console.log("✅ tenant audience requires tenantId");

	console.log("✅ platform admin communications use cases verified");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
