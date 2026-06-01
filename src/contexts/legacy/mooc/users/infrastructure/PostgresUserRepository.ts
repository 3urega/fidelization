import { Service } from "diod";

import { PostgresRepository } from "../../../shared/infrastructure/postgres/PostgresRepository";
import { User } from "../domain/User";
import { UserId } from "../domain/UserId";
import { UserPlan } from "../domain/UserPlan";
import { UserRepository } from "../domain/UserRepository";
import { UserStatus } from "../domain/UserStatus";

type DatabaseUserRow = {
	id: string;
	name: string;
	email: string;
	profile_picture: string;
	status: string;
	suggested_courses: string;
	subscription_plan: string;
};

@Service()
export class PostgresUserRepository extends PostgresRepository<User> implements UserRepository {
	async save(user: User): Promise<void> {
		const userPrimitives = user.toPrimitives();

		await this.execute`
			INSERT INTO mooc.users (id, name, email, profile_picture, status, suggested_courses, subscription_plan)
			VALUES (
				${userPrimitives.id},
				${userPrimitives.name},
				${userPrimitives.email},
				${userPrimitives.profilePicture},
				${userPrimitives.status.valueOf()},
				${userPrimitives.suggestedCourses},
				${userPrimitives.plan.valueOf()}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				email = EXCLUDED.email,
				profile_picture = EXCLUDED.profile_picture,
				status = EXCLUDED.status,
				suggested_courses = EXCLUDED.suggested_courses,
				subscription_plan = EXCLUDED.subscription_plan;
		`;
	}

	async search(id: UserId): Promise<User | null> {
		return await this.searchOne`
			SELECT id, name, email, profile_picture, status, suggested_courses, subscription_plan
			FROM mooc.users
			WHERE id = ${id.value};
		`;
	}

	protected toAggregate(row: DatabaseUserRow): User {
		return User.fromPrimitives({
			id: row.id,
			name: row.name,
			email: row.email,
			profilePicture: row.profile_picture,
			status: row.status as UserStatus,
			suggestedCourses: row.suggested_courses,
			plan: row.subscription_plan as UserPlan,
		});
	}
}
