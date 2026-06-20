import { TenantGameActivation } from "./TenantGameActivation";

export abstract class TenantGameActivationRepository {
	abstract searchByTenantAndSlug(
		tenantId: string,
		gameSlug: string,
	): Promise<TenantGameActivation | null>;

	abstract save(activation: TenantGameActivation): Promise<void>;
}
