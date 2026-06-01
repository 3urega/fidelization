import { Service } from "diod";

import { getSubscriptionPurchaseFromGooglePlay } from "../../../../../lib/billing/googlePlayAndroidPublisher";
import { UserDoesNotExist } from "../../../../identity/users/domain/UserDoesNotExist";
import { UserId } from "../../../../identity/users/domain/UserId";
import { UserPlan } from "../../../../identity/users/domain/UserPlan";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import { GooglePlaySubscriptionRepository } from "../../domain/GooglePlaySubscriptionRepository";

@Service()
export class SyncUserPlanFromGooglePlay {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly subscriptionRepository: GooglePlaySubscriptionRepository,
	) {}

	async run(userId: string): Promise<{ plan: UserPlan }> {
		const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
		if (!packageName) {
			throw new Error("GOOGLE_PLAY_PACKAGE_NAME is not set");
		}

		const sub = await this.subscriptionRepository.searchLatestByUserId(userId);
		if (!sub) {
			const user = await this.userRepository.search(new UserId(userId));
			if (!user) {
				throw new UserDoesNotExist(userId);
			}

			return { plan: user.plan };
		}

		const p = sub.toPrimitives();
		const remote = await getSubscriptionPurchaseFromGooglePlay(
			packageName,
			p.productId,
			p.purchaseToken,
		);

		const expiryMs =
			remote.expiryTimeMillis !== undefined && remote.expiryTimeMillis !== null
				? Number(remote.expiryTimeMillis)
				: null;
		const isActive = expiryMs !== null && expiryMs > Date.now();

		const user = await this.userRepository.search(new UserId(userId));
		if (!user) {
			throw new UserDoesNotExist(userId);
		}

		const plan = isActive ? UserPlan.Premium : UserPlan.Free;
		user.setPlan(plan);
		const credentials = await this.userRepository.searchByEmail(user.email.value);
		await this.userRepository.save(user, credentials?.passwordHash ?? "");

		return { plan: user.plan };
	}
}
