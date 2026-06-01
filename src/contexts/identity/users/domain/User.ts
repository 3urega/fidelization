import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UserEmail } from "./UserEmail";
import { UserId } from "./UserId";
import { UserName } from "./UserName";
import { UserPlan } from "./UserPlan";
import { UserProfilePicture } from "./UserProfilePicture";

export type UserPrimitives = {
	id: string;
	name: string;
	email: string;
	profilePicture: string;
	plan: string;
};

export class User extends AggregateRoot {
	private constructor(
		public readonly id: UserId,
		public name: UserName,
		public readonly email: UserEmail,
		public profilePicture: UserProfilePicture,
		public plan: UserPlan,
	) {
		super();
	}

	static create(id: string, name: string, email: string, profilePicture = ""): User {
		return new User(
			new UserId(id),
			new UserName(name),
			new UserEmail(email),
			new UserProfilePicture(profilePicture),
			UserPlan.Free,
		);
	}

	static fromPrimitives(primitives: UserPrimitives): User {
		return new User(
			new UserId(primitives.id),
			new UserName(primitives.name),
			new UserEmail(primitives.email),
			new UserProfilePicture(primitives.profilePicture),
			primitives.plan as UserPlan,
		);
	}

	toPrimitives(): UserPrimitives {
		return {
			id: this.id.value,
			name: this.name.value,
			email: this.email.value,
			profilePicture: this.profilePicture.value,
			plan: this.plan,
		};
	}

	updateProfile(name: string, profilePicture: string): void {
		this.name = new UserName(name);
		this.profilePicture = new UserProfilePicture(profilePicture);
	}

	setPlan(plan: UserPlan): void {
		this.plan = plan;
	}
}
