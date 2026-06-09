import { Service } from "diod";

import { CompleteStripeCheckoutSession } from "../checkout/CompleteStripeCheckoutSession";
import { StripeWebhookEventRepository } from "../../../stripe/domain/StripeWebhookEventRepository";
import { StripeWebhookGateway } from "../../../stripe/domain/StripeWebhookGateway";
import { SyncTenantSubscriptionFromStripe } from "./SyncTenantSubscriptionFromStripe";

@Service()
export class ProcessStripeWebhook {
	constructor(
		private readonly webhookGateway: StripeWebhookGateway,
		private readonly webhookEventRepository: StripeWebhookEventRepository,
		private readonly completeStripeCheckoutSession: CompleteStripeCheckoutSession,
		private readonly syncTenantSubscriptionFromStripe: SyncTenantSubscriptionFromStripe,
	) {}

	async execute(rawBody: string, signature: string | null): Promise<void> {
		const payload = this.webhookGateway.parseWebhookPayload(rawBody, signature);

		if (payload.kind === "ignored") {
			return;
		}

		const recorded = await this.webhookEventRepository.tryRecord(
			payload.eventId,
			payload.eventType,
		);
		if (!recorded) {
			return;
		}

		if (payload.kind === "checkout.session.completed") {
			await this.completeStripeCheckoutSession.execute({
				tenantId: payload.tenantId,
				planId: payload.planId,
				stripeSubscriptionId: payload.stripeSubscriptionId,
				stripeSessionId: payload.stripeSessionId,
			});

			return;
		}

		await this.syncTenantSubscriptionFromStripe.execute({
			stripeSubscriptionId: payload.stripeSubscriptionId,
			stripeStatus: payload.stripeStatus,
		});
	}
}
