import { StampType } from "./StampType";

export abstract class StampTypeRepository {
	abstract save(stampType: StampType): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<StampType | null>;

	abstract searchBySlug(tenantId: string, slug: string): Promise<StampType | null>;

	abstract listByTenant(tenantId: string): Promise<StampType[]>;

	abstract listActiveByTenant(tenantId: string): Promise<StampType[]>;

	abstract countActiveByTenant(tenantId: string): Promise<number>;

	abstract maxSortOrder(tenantId: string): Promise<number>;
}
