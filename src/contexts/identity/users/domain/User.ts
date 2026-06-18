import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UserEmail } from "./UserEmail";
import { UserId } from "./UserId";
import { UserName } from "./UserName";
import { UserPlan } from "./UserPlan";
import { UserProfilePicture } from "./UserProfilePicture";
import { UserSearchZone } from "./UserSearchZone";

export type UserPrimitives = {
	id: string;
	name: string;
	email: string;
	profilePicture: string;
	plan: string;
	qrValue: string | null;
	oauthProvider: string | null;
	oauthSubject: string | null;
	searchZone: UserSearchZone | null;
};

export class User extends AggregateRoot {
	private constructor(
		public readonly id: UserId,
		public name: UserName,
		public readonly email: UserEmail,
		public profilePicture: UserProfilePicture,
		public plan: UserPlan,
		public readonly qrValue: string | null,
		public readonly oauthProvider: string | null,
		public readonly oauthSubject: string | null,
		public searchZone: UserSearchZone | null,
	) {
		super();
	}

	static create(
		id: string,
		name: string,
		email: string,
		profilePicture = "",
		qrValue: string | null = null,
	): User {
		return new User(
			new UserId(id),
			new UserName(name),
			new UserEmail(email),
			new UserProfilePicture(profilePicture),
			UserPlan.Free,
			qrValue,
			null,
			null,
			null,
		);
	}

	static createFromGoogleOAuth(params: {
		id: string;
		name: string;
		email: string;
		profilePicture?: string;
		oauthSubject: string;
		qrValue: string;
	}): User {
		return new User(
			new UserId(params.id),
			new UserName(params.name.trim()),
			new UserEmail(params.email.toLowerCase().trim()),
			new UserProfilePicture(params.profilePicture?.trim() ?? ""),
			UserPlan.Free,
			params.qrValue,
			"google",
			params.oauthSubject,
			null,
		);
	}

	/** Link Google OAuth to an existing email/password account. */
	linkGoogleOAuth(oauthSubject: string, qrValue: string | null = this.qrValue): User {
		return new User(
			this.id,
			this.name,
			this.email,
			this.profilePicture,
			this.plan,
			qrValue,
			"google",
			oauthSubject,
			this.searchZone,
		);
	}

	static fromPrimitives(primitives: UserPrimitives): User {
		return new User(
			new UserId(primitives.id),
			new UserName(primitives.name),
			new UserEmail(primitives.email),
			new UserProfilePicture(primitives.profilePicture),
			primitives.plan as UserPlan,
			primitives.qrValue,
			primitives.oauthProvider,
			primitives.oauthSubject,
			primitives.searchZone,
		);
	}

	toPrimitives(): UserPrimitives {
		return {
			id: this.id.value,
			name: this.name.value,
			email: this.email.value,
			profilePicture: this.profilePicture.value,
			plan: this.plan,
			qrValue: this.qrValue,
			oauthProvider: this.oauthProvider,
			oauthSubject: this.oauthSubject,
			searchZone: this.searchZone,
		};
	}

	updateProfile(name: string, profilePicture: string): void {
		this.name = new UserName(name);
		this.profilePicture = new UserProfilePicture(profilePicture);
	}

	setPlan(plan: UserPlan): void {
		this.plan = plan;
	}

	setSearchZone(zone: UserSearchZone): void {
		this.searchZone = zone;
	}

	clearSearchZone(): void {
		this.searchZone = null;
	}
}
