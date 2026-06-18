import { Service } from "diod";

import { User } from "../../domain/User";
import { UserRepository } from "../../domain/UserRepository";
import { UserSearchZone } from "../../domain/UserSearchZone";
import { UserId } from "../../domain/UserId";

export type ClearUserSearchZoneParams = {
	userId: string;
};

@Service()
export class ClearUserSearchZone {
	constructor(private readonly repository: UserRepository) {}

	async execute(params: ClearUserSearchZoneParams): Promise<User> {
		return this.repository.updateSearchZone(new UserId(params.userId), null);
	}
}
