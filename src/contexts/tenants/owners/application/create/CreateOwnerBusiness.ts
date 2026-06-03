import { Service } from "diod";

import { UserFinder } from "../../../../identity/users/application/find/UserFinder";
import { UserDoesNotExist } from "../../../../identity/users/domain/UserDoesNotExist";
import { TenantMembershipRepository } from "../../../memberships/domain/TenantMembershipRepository";
import { isBusinessType } from "../../domain/BusinessType";
import { OwnerBusinessAlreadyExists } from "../../domain/OwnerBusinessAlreadyExists";
import {
	CreateOwnerBusinessParams,
	CreateOwnerBusinessResult,
	OwnerBusinessRepository,
} from "../../domain/OwnerBusinessRepository";

@Service()
export class CreateOwnerBusiness {
	constructor(
		private readonly userFinder: UserFinder,
		private readonly membershipRepository: TenantMembershipRepository,
		private readonly ownerBusinessRepository: OwnerBusinessRepository,
	) {}

	async create(params: CreateOwnerBusinessParams): Promise<CreateOwnerBusinessResult> {
		if (!isBusinessType(params.businessType)) {
			throw new Error(`Invalid business type: ${params.businessType}`);
		}

		try {
			await this.userFinder.find(params.userId);
		} catch (error) {
			if (error instanceof UserDoesNotExist) {
				throw error;
			}

			throw error;
		}

		const existingMembership = await this.membershipRepository.findFirstStaffMembershipByUserId(
			params.userId,
		);
		if (existingMembership) {
			throw new OwnerBusinessAlreadyExists(params.userId);
		}

		return await this.ownerBusinessRepository.createForUser(params);
	}
}
