import { UserPrimitives } from "../../../../../src/contexts/mooc/users/domain/User";
import { UserPlan } from "../../../../../src/contexts/mooc/users/domain/UserPlan";
import { UserRegisteredDomainEvent } from "../../../../../src/contexts/mooc/users/domain/UserRegisteredDomainEvent";
import { UserStatus } from "../../../../../src/contexts/mooc/users/domain/UserStatus";
import { UserEmailMother } from "./UserEmailMother";
import { UserIdMother } from "./UserIdMother";
import { UserNameMother } from "./UserNameMother";
import { UserProfilePictureMother } from "./UserProfilePictureMother";

export class UserRegisteredDomainEventMother {
	static create(params?: Partial<UserPrimitives>): UserRegisteredDomainEvent {
		const primitives: UserPrimitives = {
			id: UserIdMother.create().value,
			name: UserNameMother.create().value,
			email: UserEmailMother.create().value,
			profilePicture: UserProfilePictureMother.create().value,
			status: UserStatus.Active,
			suggestedCourses: "",
			plan: UserPlan.Free,
			...params,
		};

		return new UserRegisteredDomainEvent(
			primitives.id,
			primitives.name,
			primitives.email,
			primitives.profilePicture,
			primitives.status,
		);
	}
}
