import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { User } from "../domain/User";
import { UserId } from "../domain/UserId";
import { UserPlan } from "../domain/UserPlan";
import { UserRepository, UserWithPasswordHash } from "../domain/UserRepository";

@Service()
export class PrismaUserRepository extends UserRepository {
	async save(user: User, passwordHash: string): Promise<void> {
		const primitives = user.toPrimitives();

		await prisma.user.upsert({
			where: { id: primitives.id },
			create: {
				id: primitives.id,
				name: primitives.name,
				email: primitives.email,
				profilePicture: primitives.profilePicture,
				passwordHash,
				subscriptionPlan: primitives.plan,
				qrValue: primitives.qrValue,
				oauthProvider: primitives.oauthProvider,
				oauthSubject: primitives.oauthSubject,
			},
			update: {
				name: primitives.name,
				email: primitives.email,
				profilePicture: primitives.profilePicture,
				passwordHash,
				subscriptionPlan: primitives.plan,
				qrValue: primitives.qrValue,
				oauthProvider: primitives.oauthProvider,
				oauthSubject: primitives.oauthSubject,
			},
		});
	}

	async search(id: UserId): Promise<User | null> {
		const row = await prisma.user.findUnique({ where: { id: id.value } });

		if (!row) {
			return null;
		}

		return this.toAggregate(row);
	}

	async searchByEmail(email: string): Promise<UserWithPasswordHash | null> {
		const row = await prisma.user.findUnique({ where: { email } });

		if (!row) {
			return null;
		}

		return {
			user: this.toAggregate(row),
			passwordHash: row.passwordHash,
		};
	}

	async searchByQrValue(qrValue: string): Promise<User | null> {
		const row = await prisma.user.findUnique({ where: { qrValue } });

		if (!row) {
			return null;
		}

		return this.toAggregate(row);
	}

	async updatePasswordHash(userId: UserId, passwordHash: string): Promise<void> {
		await prisma.user.update({
			where: { id: userId.value },
			data: { passwordHash },
		});
	}

	async isPlatformSuperadmin(userId: string): Promise<boolean> {
		const row = await prisma.user.findUnique({
			where: { id: userId },
			select: { platformRole: true },
		});

		return row?.platformRole === "superadmin";
	}

	private toAggregate(row: {
		id: string;
		name: string;
		email: string;
		profilePicture: string;
		subscriptionPlan: string;
		qrValue: string | null;
		oauthProvider: string | null;
		oauthSubject: string | null;
	}): User {
		return User.fromPrimitives({
			id: row.id,
			name: row.name,
			email: row.email,
			profilePicture: row.profilePicture,
			plan: row.subscriptionPlan as UserPlan,
			qrValue: row.qrValue,
			oauthProvider: row.oauthProvider,
			oauthSubject: row.oauthSubject,
		});
	}
}
