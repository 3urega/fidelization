import { Service } from "diod";

import { PostgresRepository } from "../../../shared/infrastructure/postgres/PostgresRepository";
import { User } from "../domain/User";
import { UserId } from "../domain/UserId";
import { UserPlan } from "../domain/UserPlan";
import { UserRepository, UserWithPasswordHash } from "../domain/UserRepository";

type DatabaseUserRow = {
	id: string;
	name: string;
	email: string;
	profile_picture: string;
	password_hash: string;
	subscription_plan: string;
};

@Service()
export class PostgresUserRepository extends PostgresRepository<User> implements UserRepository {
	async save(user: User, passwordHash: string): Promise<void> {
		const p = user.toPrimitives();

		await this.execute`
			INSERT INTO starter.users (id, name, email, profile_picture, password_hash, subscription_plan)
			VALUES (
				${p.id},
				${p.name},
				${p.email},
				${p.profilePicture},
				${passwordHash},
				${p.plan}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				email = EXCLUDED.email,
				profile_picture = EXCLUDED.profile_picture,
				password_hash = EXCLUDED.password_hash,
				subscription_plan = EXCLUDED.subscription_plan;
		`;
	}

	async search(id: UserId): Promise<User | null> {
		return await this.searchOne`
			SELECT id, name, email, profile_picture, password_hash, subscription_plan
			FROM starter.users
			WHERE id = ${id.value};
		`;
	}

	async searchByEmail(email: string): Promise<UserWithPasswordHash | null> {
		const result = await this.sql`
			SELECT id, name, email, profile_picture, password_hash, subscription_plan
			FROM starter.users
			WHERE email = ${email};
		`;

		if (!result.length) {
			return null;
		}

		const row = result[0] as DatabaseUserRow;

		return {
			user: this.toAggregate(row),
			passwordHash: row.password_hash,
		};
	}

	async updatePasswordHash(userId: UserId, passwordHash: string): Promise<void> {
		await this.execute`
			UPDATE starter.users SET password_hash = ${passwordHash} WHERE id = ${userId.value};
		`;
	}

	protected toAggregate(row: DatabaseUserRow): User {
		return User.fromPrimitives({
			id: row.id,
			name: row.name,
			email: row.email,
			profilePicture: row.profile_picture,
			plan: row.subscription_plan as UserPlan,
		});
	}
}
