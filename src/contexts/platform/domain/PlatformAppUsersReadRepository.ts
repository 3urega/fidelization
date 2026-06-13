import type {
	PlatformAppUserDetail,
	PlatformAppUsersListParams,
	PlatformAppUsersPage,
} from "./PlatformAppUserSummary";

export abstract class PlatformAppUsersReadRepository {
	abstract list(params: PlatformAppUsersListParams): Promise<PlatformAppUsersPage>;

	abstract getDetail(userId: string): Promise<PlatformAppUserDetail | null>;
}
