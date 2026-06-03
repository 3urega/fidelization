import { Service } from "diod";

import { UserRegistrar } from "../../../../identity/users/application/register/UserRegistrar";
import { User } from "../../../../identity/users/domain/User";
import { TenantRole } from "../../../memberships/domain/TenantRole";

export type RegisterBusinessOwnerUserParams = {
	name: string;
	email: string;
	password: string;
	profilePicture?: string;
};

export type RegisterBusinessOwnerUserResult = {
	user: User;
	intendedRole: TenantRole.Owner;
};

@Service()
export class RegisterBusinessOwnerUser {
	constructor(private readonly userRegistrar: UserRegistrar) {}

	async register(
		params: RegisterBusinessOwnerUserParams,
	): Promise<RegisterBusinessOwnerUserResult> {
		const user = await this.userRegistrar.register(params);

		return {
			user,
			intendedRole: TenantRole.Owner,
		};
	}
}
