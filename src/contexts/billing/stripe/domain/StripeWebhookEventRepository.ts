export abstract class StripeWebhookEventRepository {
	abstract tryRecord(eventId: string, eventType: string): Promise<boolean>;
}
