import { Service } from "diod";

import { PostgresConnection } from "../../../shared/infrastructure/postgres/PostgresConnection";
import { GooglePlaySubscription } from "../domain/GooglePlaySubscription";
import { GooglePlaySubscriptionRepository } from "../domain/GooglePlaySubscriptionRepository";

type SubscriptionRow = {
	purchase_token: string;
	user_id: string;
	product_id: string;
	expiry_time_ms: string | null;
	auto_renewing: boolean;
};

@Service()
export class PostgresGooglePlaySubscriptionRepository implements GooglePlaySubscriptionRepository {
	constructor(private readonly connection: PostgresConnection) {}

	async searchByPurchaseToken(purchaseToken: string): Promise<GooglePlaySubscription | null> {
		const result = await this.connection.sql`
			SELECT purchase_token, user_id, product_id, expiry_time_ms, auto_renewing
			FROM starter.google_play_subscriptions
			WHERE purchase_token = ${purchaseToken};
		`;

		return result.length ? this.toAggregate(result[0] as SubscriptionRow) : null;
	}

	async upsert(subscription: GooglePlaySubscription): Promise<void> {
		const p = subscription.toPrimitives();
		await this.connection.sql`
			INSERT INTO starter.google_play_subscriptions (
				purchase_token, user_id, product_id, expiry_time_ms, auto_renewing, updated_at
			)
			VALUES (
				${p.purchaseToken},
				${p.userId},
				${p.productId},
				${p.expiryTimeMs},
				${p.autoRenewing},
				NOW()
			)
			ON CONFLICT (purchase_token) DO UPDATE SET
				user_id = EXCLUDED.user_id,
				product_id = EXCLUDED.product_id,
				expiry_time_ms = EXCLUDED.expiry_time_ms,
				auto_renewing = EXCLUDED.auto_renewing,
				updated_at = NOW();
		`;
	}

	async searchLatestByUserId(userId: string): Promise<GooglePlaySubscription | null> {
		const result = await this.connection.sql`
			SELECT purchase_token, user_id, product_id, expiry_time_ms, auto_renewing
			FROM starter.google_play_subscriptions
			WHERE user_id = ${userId}::uuid
			ORDER BY expiry_time_ms DESC NULLS LAST
			LIMIT 1;
		`;

		return result.length ? this.toAggregate(result[0] as SubscriptionRow) : null;
	}

	private toAggregate(row: SubscriptionRow): GooglePlaySubscription {
		return GooglePlaySubscription.create({
			purchaseToken: row.purchase_token,
			userId: row.user_id,
			productId: row.product_id,
			expiryTimeMs: row.expiry_time_ms !== null ? Number(row.expiry_time_ms) : null,
			autoRenewing: row.auto_renewing,
		});
	}
}
