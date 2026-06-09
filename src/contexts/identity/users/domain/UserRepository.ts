import { User } from "./User";
import { UserId } from "./UserId";

export type UserWithPasswordHash = {
	user: User;
	passwordHash: string;
};

export abstract class UserRepository {
	abstract save(user: User, passwordHash: string): Promise<void>;

	abstract search(id: UserId): Promise<User | null>;

	abstract searchByEmail(email: string): Promise<UserWithPasswordHash | null>;

	abstract searchByQrValue(qrValue: string): Promise<User | null>;

	abstract searchByOAuthSubject(oauthProvider: string, oauthSubject: string): Promise<User | null>;

	abstract updatePasswordHash(userId: UserId, passwordHash: string): Promise<void>;

	abstract isPlatformSuperadmin(userId: string): Promise<boolean>;
}
