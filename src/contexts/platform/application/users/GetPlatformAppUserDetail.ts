import { Service } from "diod";

import { EnsureUserQrValue } from "../../../identity/users/application/profile/EnsureUserQrValue";
import { UserDoesNotExist } from "../../../identity/users/domain/UserDoesNotExist";
import type { PlatformAppUserDetail } from "../../domain/PlatformAppUserSummary";
import { PlatformAppUsersReadRepository } from "../../domain/PlatformAppUsersReadRepository";

@Service()
export class GetPlatformAppUserDetail {
	constructor(
		private readonly repository: PlatformAppUsersReadRepository,
		private readonly ensureUserQrValue: EnsureUserQrValue,
	) {}

	async execute(userId: string): Promise<PlatformAppUserDetail> {
		const detail = await this.repository.getDetail(userId);

		if (!detail) {
			throw new UserDoesNotExist(userId);
		}

		const user = await this.ensureUserQrValue.ensure(userId);

		return {
			...detail,
			qrValue: user.qrValue,
		};
	}
}
