import { Service } from "diod";

import { EmailAlreadyRegistered } from "../../../../identity/users/domain/EmailAlreadyRegistered";
import { UserRepository } from "../../../../identity/users/domain/UserRepository";
import {
	OwnerOnboardingRepository,
	RegisterOwnerParams,
	RegisterOwnerResult,
} from "../../domain/OwnerOnboardingRepository";

@Service()
export class OwnerRegistrar {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly onboardingRepository: OwnerOnboardingRepository,
	) {}

	async register(params: RegisterOwnerParams): Promise<RegisterOwnerResult> {
		const existing = await this.userRepository.searchByEmail(params.email.toLowerCase().trim());
		if (existing) {
			throw new EmailAlreadyRegistered(params.email);
		}

		return await this.onboardingRepository.register(params);
	}
}
