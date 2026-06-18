import { Service } from "diod";

import { User } from "../../domain/User";
import { UserId } from "../../domain/UserId";
import { UserRepository } from "../../domain/UserRepository";
import { UserSearchZone } from "../../domain/UserSearchZone";

export type UpdateUserSearchZoneParams = {
	userId: string;
	label: string;
	latitude: number;
	longitude: number;
};

@Service()
export class UpdateUserSearchZone {
	constructor(private readonly repository: UserRepository) {}

	async execute(params: UpdateUserSearchZoneParams): Promise<User> {
		const zone = UserSearchZone.create(params.label, params.latitude, params.longitude);

		return this.repository.updateSearchZone(new UserId(params.userId), zone);
	}
}
