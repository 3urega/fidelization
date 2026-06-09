import { OAuth2Client } from "google-auth-library";

import { GoogleIdTokenClaims } from "../domain/GoogleIdTokenClaims";
import { GoogleIdTokenVerifier } from "../domain/GoogleIdTokenVerifier";
import { InvalidGoogleToken } from "../domain/InvalidGoogleToken";

export class GoogleIdTokenVerifierGoogle extends GoogleIdTokenVerifier {
	constructor(private readonly clientId: string) {
		super();
	}

	async verify(idToken: string): Promise<GoogleIdTokenClaims> {
		const client = new OAuth2Client(this.clientId);

		try {
			const ticket = await client.verifyIdToken({
				idToken,
				audience: this.clientId,
			});
			const payload = ticket.getPayload();

			if (!payload?.sub || !payload.email) {
				throw new InvalidGoogleToken();
			}

			return {
				subject: payload.sub,
				email: payload.email.toLowerCase().trim(),
				name: payload.name?.trim() || payload.email.split("@")[0] || "Usuario",
				picture: payload.picture,
			};
		} catch (error) {
			if (error instanceof InvalidGoogleToken) {
				throw error;
			}

			throw new InvalidGoogleToken();
		}
	}
}
