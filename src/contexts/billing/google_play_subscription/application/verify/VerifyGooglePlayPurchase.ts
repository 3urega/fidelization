import { Service } from "diod";

import { getSubscriptionPurchaseFromGooglePlay } from "../../../../../lib/billing/googlePlayAndroidPublisher";
import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import { UserPlan } from "../../../../identity/users/domain/UserPlan";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { GooglePlaySubscription } from "../../domain/GooglePlaySubscription";
import { GooglePlaySubscriptionRepository } from "../../domain/GooglePlaySubscriptionRepository";
import { PurchaseTokenAlreadyLinked } from "../../domain/PurchaseTokenAlreadyLinked";

export type VerifyGooglePlayPurchaseParams = {
	userId: string;
	purchaseToken: string;
	productId: string;
};

@Service()
export class VerifyGooglePlayPurchase {
	constructor(
		private readonly userFinder: UserFinder,
		private readonly userRepository: UserRepository,
		private readonly subscriptionRepository: GooglePlaySubscriptionRepository,
	) {}

	async run(params: VerifyGooglePlayPurchaseParams): Promise<{ plan: UserPlan }> {
		const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
		if (!packageName) {
			throw new Error("GOOGLE_PLAY_PACKAGE_NAME is not set");
		}

		const user = await this.userFinder.find(params.userId);

		const existing = await this.subscriptionRepository.searchByPurchaseToken(params.purchaseToken);
		if (existing && existing.toPrimitives().userId !== params.userId) {
			throw new PurchaseTokenAlreadyLinked();
		}

		const remote = await getSubscriptionPurchaseFromGooglePlay(
			packageName,
			params.productId,
			params.purchaseToken,
		);

		const expiryMs =
			remote.expiryTimeMillis !== undefined && remote.expiryTimeMillis !== null
				? Number(remote.expiryTimeMillis)
				: null;
		const isActive = expiryMs !== null && expiryMs > Date.now();

		await this.subscriptionRepository.upsert(
			GooglePlaySubscription.create({
				purchaseToken: params.purchaseToken,
				userId: params.userId,
				productId: params.productId,
				expiryTimeMs: expiryMs,
				autoRenewing: Boolean(remote.autoRenewing),
			}),
		);

		const plan = isActive ? UserPlan.Premium : UserPlan.Free;
		user.setPlan(plan);
		const credentials = await this.userRepository.searchByEmail(user.email.value);
		await this.userRepository.save(user, credentials?.passwordHash ?? "");

		return { plan };
	}
}
