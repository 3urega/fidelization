import { StripeCheckoutNotConfigured } from "../../contexts/billing/subscriptions/domain/StripeCheckoutNotConfigured";

const PAID_PLAN_NAMES = new Set(["pro", "premium"]);

export function isPaidSubscriptionPlanName(planName: string): boolean {
	return PAID_PLAN_NAMES.has(planName.toLowerCase());
}

export function resolveStripePriceId(planName: string): string {
	const normalized = planName.toLowerCase();

	if (normalized === "pro") {
		const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim();
		if (!priceId) {
			throw new StripeCheckoutNotConfigured(planName);
		}

		return priceId;
	}

	if (normalized === "premium") {
		const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY?.trim();
		if (!priceId) {
			throw new StripeCheckoutNotConfigured(planName);
		}

		return priceId;
	}

	throw new StripeCheckoutNotConfigured(planName);
}
