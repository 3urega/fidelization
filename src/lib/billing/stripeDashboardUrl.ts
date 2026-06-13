/**
 * Builds a Stripe Dashboard URL for a subscription id.
 * Uses STRIPE_DASHBOARD_BASE_URL when set; otherwise test mode if secret key is sk_test_*.
 */
export function buildStripeSubscriptionDashboardUrl(
	stripeSubscriptionId: string | null | undefined,
): string | null {
	if (!stripeSubscriptionId?.trim()) {
		return null;
	}

	const explicitBase = process.env.STRIPE_DASHBOARD_BASE_URL?.trim().replace(/\/$/, "");
	if (explicitBase) {
		return `${explicitBase}/subscriptions/${stripeSubscriptionId}`;
	}

	const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
	const isTest = secretKey.startsWith("sk_test_");

	return isTest
		? `https://dashboard.stripe.com/test/subscriptions/${stripeSubscriptionId}`
		: `https://dashboard.stripe.com/subscriptions/${stripeSubscriptionId}`;
}
