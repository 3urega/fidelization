import {
	type PlatformOwnersListParams,
	type PlatformOwnersPage,
} from "./PlatformOwnerSummary";

export abstract class PlatformOwnersReadRepository {
	abstract list(params: PlatformOwnersListParams): Promise<PlatformOwnersPage>;
}
