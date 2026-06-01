import { GooglePlaySubscription } from "./GooglePlaySubscription";

export abstract class GooglePlaySubscriptionRepository {
	abstract searchByPurchaseToken(purchaseToken: string): Promise<GooglePlaySubscription | null>;

	abstract upsert(subscription: GooglePlaySubscription): Promise<void>;

	abstract searchLatestByUserId(userId: string): Promise<GooglePlaySubscription | null>;
}
