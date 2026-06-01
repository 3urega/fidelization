export type GooglePlaySubscriptionPrimitives = {
	purchaseToken: string;
	userId: string;
	productId: string;
	expiryTimeMs: number | null;
	autoRenewing: boolean;
};

export class GooglePlaySubscription {
	private constructor(
		public readonly purchaseToken: string,
		public readonly userId: string,
		public readonly productId: string,
		public expiryTimeMs: number | null,
		public autoRenewing: boolean,
	) {}

	static create(primitives: GooglePlaySubscriptionPrimitives): GooglePlaySubscription {
		return new GooglePlaySubscription(
			primitives.purchaseToken,
			primitives.userId,
			primitives.productId,
			primitives.expiryTimeMs,
			primitives.autoRenewing,
		);
	}

	toPrimitives(): GooglePlaySubscriptionPrimitives {
		return {
			purchaseToken: this.purchaseToken,
			userId: this.userId,
			productId: this.productId,
			expiryTimeMs: this.expiryTimeMs,
			autoRenewing: this.autoRenewing,
		};
	}
}
