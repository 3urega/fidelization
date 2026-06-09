import { randomUUID } from "crypto";
import { Service } from "diod";

import { hashPassword } from "../../../../../lib/auth/password";
import { GoogleIdTokenVerifier } from "../../domain/GoogleIdTokenVerifier";
import { InvalidGoogleToken } from "../../domain/InvalidGoogleToken";
import { OAuthAccountAlreadyLinked } from "../../domain/OAuthAccountAlreadyLinked";
import { PlatformUserCannotUseUserLogin } from "../../domain/PlatformUserCannotUseUserLogin";
import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";

export const GOOGLE_OAUTH_PROVIDER = "google";

@Service()
export class AuthenticateGoogleUser {
	constructor(
		private readonly googleIdTokenVerifier: GoogleIdTokenVerifier,
		private readonly userRepository: UserRepository,
	) {}

	async authenticate(idToken: string): Promise<User> {
		const trimmed = idToken.trim();
		if (!trimmed) {
			throw new InvalidGoogleToken();
		}

		let claims;
		try {
			claims = await this.googleIdTokenVerifier.verify(trimmed);
		} catch (error) {
			if (error instanceof InvalidGoogleToken) {
				throw error;
			}

			throw new InvalidGoogleToken();
		}

		const byOAuth = await this.userRepository.searchByOAuthSubject(
			GOOGLE_OAUTH_PROVIDER,
			claims.subject,
		);
		if (byOAuth) {
			await this.assertPlatformAppAllowed(byOAuth);

			return byOAuth;
		}

		const email = claims.email.toLowerCase().trim();
		const byEmail = await this.userRepository.searchByEmail(email);

		if (byEmail) {
			const existing = byEmail.user;
			if (existing.oauthSubject === claims.subject) {
				await this.assertPlatformAppAllowed(existing);

				if (existing.oauthProvider !== GOOGLE_OAUTH_PROVIDER) {
					const fixed = existing.linkGoogleOAuth(claims.subject, existing.qrValue);
					await this.userRepository.save(fixed, byEmail.passwordHash);

					return fixed;
				}

				return existing;
			}

			if (existing.oauthSubject !== null) {
				throw new OAuthAccountAlreadyLinked(email);
			}

			await this.assertPlatformAppAllowed(existing);

			const qrValue = existing.qrValue ?? (await this.generateUniqueQrValue());
			const linked = existing.linkGoogleOAuth(claims.subject, qrValue);
			await this.userRepository.save(linked, byEmail.passwordHash);

			return linked;
		}

		const qrValue = await this.generateUniqueQrValue();
		const user = User.createFromGoogleOAuth({
			id: randomUUID(),
			name: claims.name,
			email,
			profilePicture: claims.picture,
			oauthSubject: claims.subject,
			qrValue,
		});
		const passwordHash = await hashPassword(randomUUID());
		await this.userRepository.save(user, passwordHash);

		return user;
	}

	private async assertPlatformAppAllowed(user: User): Promise<void> {
		if (await this.userRepository.isPlatformSuperadmin(user.id.value)) {
			throw new PlatformUserCannotUseUserLogin();
		}
	}

	private async generateUniqueQrValue(): Promise<string> {
		for (let attempt = 0; attempt < 5; attempt += 1) {
			const candidate = randomUUID();
			const existing = await this.userRepository.searchByQrValue(candidate);
			if (!existing) {
				return candidate;
			}
		}

		throw new Error("Could not generate a unique qr_value for platform user");
	}
}
