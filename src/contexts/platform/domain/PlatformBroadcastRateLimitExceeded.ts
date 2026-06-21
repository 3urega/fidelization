import { DomainError } from "../../shared/domain/DomainError";

export class PlatformBroadcastRateLimitExceeded extends DomainError {
	readonly type = "PlatformBroadcastRateLimitExceeded";
	readonly message: string;
	readonly limit: number;

	constructor(limit: number) {
		super(`Platform broadcast rate limit exceeded (${limit} per hour)`);
		this.message = `Platform broadcast rate limit exceeded (${limit} per hour)`;
		this.limit = limit;
	}
}
