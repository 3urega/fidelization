import { google } from "googleapis";

export type GoogleSubscriptionPurchaseData = {
	expiryTimeMillis?: string | null;
	autoRenewing?: boolean | null;
};

export function getAndroidPublisherV3(): ReturnType<typeof google.androidpublisher> {
	const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
	if (!raw) {
		throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set");
	}

	const credentials = JSON.parse(raw) as Record<string, unknown>;
	const auth = new google.auth.GoogleAuth({
		credentials,
		scopes: ["https://www.googleapis.com/auth/androidpublisher"],
	});

	return google.androidpublisher({ version: "v3", auth });
}

export async function getSubscriptionPurchaseFromGooglePlay(
	packageName: string,
	subscriptionId: string,
	purchaseToken: string,
): Promise<GoogleSubscriptionPurchaseData> {
	const androidpublisher = getAndroidPublisherV3();
	const { data } = await androidpublisher.purchases.subscriptions.get({
		packageName,
		subscriptionId,
		token: purchaseToken,
	});

	return {
		expiryTimeMillis: data.expiryTimeMillis ?? null,
		autoRenewing: data.autoRenewing ?? null,
	};
}
