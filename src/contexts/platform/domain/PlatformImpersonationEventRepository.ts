export type PlatformImpersonationEventRecord = {
	platformUserId: string;
	tenantId: string;
	impersonatedUserId: string;
};

export abstract class PlatformImpersonationEventRepository {
	abstract record(event: PlatformImpersonationEventRecord): Promise<void>;
}
