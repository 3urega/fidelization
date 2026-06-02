import { Coupon } from "./Coupon";

export abstract class CouponRepository {
	abstract save(coupon: Coupon): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<Coupon | null>;

	abstract searchByCode(tenantId: string, code: string): Promise<Coupon | null>;
}
