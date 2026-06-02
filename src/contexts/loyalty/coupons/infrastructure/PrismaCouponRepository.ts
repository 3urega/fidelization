import { Service } from "diod";

import { prisma } from "../../../../lib/prisma";
import { Coupon, CouponType } from "../domain/Coupon";
import { CouponRepository } from "../domain/CouponRepository";

@Service()
export class PrismaCouponRepository extends CouponRepository {
	async save(coupon: Coupon): Promise<void> {
		const p = coupon.toPrimitives();

		await prisma.coupon.upsert({
			where: { id: p.id },
			create: {
				id: p.id,
				tenantId: p.tenantId,
				code: p.code,
				type: p.type,
				value: p.value,
				isActive: p.isActive,
			},
			update: {
				code: p.code,
				type: p.type,
				value: p.value,
				isActive: p.isActive,
			},
		});
	}

	async searchById(tenantId: string, id: string): Promise<Coupon | null> {
		const row = await prisma.coupon.findFirst({
			where: { id, tenantId },
		});

		return row ? this.toAggregate(row) : null;
	}

	async searchByCode(tenantId: string, code: string): Promise<Coupon | null> {
		const row = await prisma.coupon.findFirst({
			where: { tenantId, code },
		});

		return row ? this.toAggregate(row) : null;
	}

	private toAggregate(row: {
		id: string;
		tenantId: string;
		code: string;
		type: string;
		value: string;
		isActive: boolean;
	}): Coupon {
		return Coupon.fromPrimitives({
			id: row.id,
			tenantId: row.tenantId,
			code: row.code,
			type: row.type as CouponType,
			value: row.value,
			isActive: row.isActive,
		});
	}
}
