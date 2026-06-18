import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { User } from "../domain/User";
import { UserDoesNotExist } from "../domain/UserDoesNotExist";
import { UserId } from "../domain/UserId";
import { UserPlan } from "../domain/UserPlan";
import { UserRepository, UserWithPasswordHash } from "../domain/UserRepository";
import { UserSearchZone } from "../domain/UserSearchZone";

@Service()
export class PrismaUserRepository extends UserRepository {
	async save(user: User, passwordHash: string): Promise<void> {
		const primitives = user.toPrimitives();
		const searchZone = primitives.searchZone?.toPrimitives();

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
				searchZoneLabel: searchZone?.label ?? null,
				searchZoneLatitude: searchZone?.latitude ?? null,
				searchZoneLongitude: searchZone?.longitude ?? null,
				searchZoneUpdatedAt: searchZone ? new Date(searchZone.updatedAt) : null,
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
				searchZoneLabel: searchZone?.label ?? null,
				searchZoneLatitude: searchZone?.latitude ?? null,
				searchZoneLongitude: searchZone?.longitude ?? null,
				searchZoneUpdatedAt: searchZone ? new Date(searchZone.updatedAt) : null,
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

	async searchByOAuthSubject(oauthProvider: string, oauthSubject: string): Promise<User | null> {
		const row = await prisma.user.findFirst({
			where: {
				oauthProvider,
				oauthSubject,
			},
		});

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

	async assignQrValueIfAbsent(userId: UserId, qrValue: string): Promise<void> {
		await prisma.user.updateMany({
			where: { id: userId.value, qrValue: null },
			data: { qrValue },
		});
	}

	async updateSearchZone(userId: UserId, zone: UserSearchZone | null): Promise<User> {
		const zonePrimitives = zone?.toPrimitives();

		await prisma.user.update({
			where: { id: userId.value },
			data: zonePrimitives
				? {
						searchZoneLabel: zonePrimitives.label,
						searchZoneLatitude: zonePrimitives.latitude,
						searchZoneLongitude: zonePrimitives.longitude,
						searchZoneUpdatedAt: new Date(zonePrimitives.updatedAt),
					}
				: {
						searchZoneLabel: null,
						searchZoneLatitude: null,
						searchZoneLongitude: null,
						searchZoneUpdatedAt: null,
					},
		});

		const user = await this.search(userId);
		if (!user) {
			throw new UserDoesNotExist(userId.value);
		}

		return user;
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
		searchZoneLabel: string | null;
		searchZoneLatitude: number | null;
		searchZoneLongitude: number | null;
		searchZoneUpdatedAt: Date | null;
	}): User {
		const searchZone =
			row.searchZoneLabel &&
			row.searchZoneLatitude != null &&
			row.searchZoneLongitude != null &&
			row.searchZoneUpdatedAt
				? UserSearchZone.fromPrimitives({
						label: row.searchZoneLabel,
						latitude: row.searchZoneLatitude,
						longitude: row.searchZoneLongitude,
						updatedAt: row.searchZoneUpdatedAt.toISOString(),
					})
				: null;

		return User.fromPrimitives({
			id: row.id,
			name: row.name,
			email: row.email,
			profilePicture: row.profilePicture,
			plan: row.subscriptionPlan as UserPlan,
			qrValue: row.qrValue,
			oauthProvider: row.oauthProvider,
			oauthSubject: row.oauthSubject,
			searchZone,
		});
	}
}
