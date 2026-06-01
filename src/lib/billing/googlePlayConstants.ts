export function getGooglePlayPremiumSubscriptionIds(): string[] {
	const raw = process.env.GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_IDS ?? "";

	return raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}
