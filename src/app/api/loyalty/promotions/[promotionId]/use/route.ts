import "reflect-metadata";

import { NextResponse } from "next/server";

import { RecordStaffScanByTarget } from "../../../../../../contexts/loyalty/customers/application/scan/RecordStaffScanByTarget";
import { customerPromotionSummaryFromPromotion } from "../../../../../../contexts/loyalty/promotions/domain/CustomerPromotionSummary";
import { PromotionRepository } from "../../../../../../contexts/loyalty/promotions/domain/PromotionRepository";
import { DomainError } from "../../../../../../contexts/shared/domain/DomainError";
import { container } from "../../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { HttpNextResponse } from "../../../../../../contexts/shared/infrastructure/http/HttpNextResponse";
import { TenantNotFound } from "../../../../../../contexts/tenants/tenants/domain/TenantNotFound";
import { TenantRole } from "../../../../../../contexts/tenants/memberships/domain/TenantRole";
import {
	customerPromotionSummaryToJson,
	customerToJson,
	handleAuthDomainError,
	staffScanOutcomesToJson,
} from "../../../../../../lib/auth/http";
import { requireTenantSession } from "../../../../../../lib/auth/requireTenantSession";

export const dynamic = "force-dynamic";

type RouteContext = {
	params: { promotionId: string };
};

type Body = {
	qrValue?: string;
};

export async function POST(request: Request, context: RouteContext): Promise<Response> {
	const auth = await requireTenantSession(request);
	if (auth instanceof NextResponse) {
		return auth;
	}

	const body = (await request.json()) as Body;
	if (!body.qrValue?.trim()) {
		return NextResponse.json({ error: { description: "qrValue is required" } }, { status: 400 });
	}

	try {
		const result = await container.get(RecordStaffScanByTarget).execute({
			tenantId: auth.session.tenantId,
			qrValue: body.qrValue,
			targetType: "promotion",
			targetId: context.params.promotionId,
			createdByUserId: auth.session.userId,
			staffRole: auth.session.role as TenantRole,
		});

		const applied = result.outcomes.find((outcome) => outcome.kind === "promotion_applied");
		if (applied) {
			const promotion = await container
				.get(PromotionRepository)
				.searchById(auth.session.tenantId, applied.promotionId);

			const summary = promotion
				? customerPromotionSummaryFromPromotion(promotion, applied.usedCount)
				: {
						id: applied.promotionId,
						tenantId: auth.session.tenantId,
						title: applied.promotionTitle,
						description: "",
						type: "discount" as const,
						startDate: null,
						endDate: null,
						isActive: true,
						maxUsesPerUser: applied.maxUsesPerUser,
						usedCount: applied.usedCount,
					};

			return NextResponse.json({
				customer: customerToJson(result.customer),
				promotion: customerPromotionSummaryToJson(summary),
			});
		}

		const exhausted = result.outcomes.find((outcome) => outcome.kind === "promotion_exhausted");
		if (exhausted) {
			const promotion = await container
				.get(PromotionRepository)
				.searchById(auth.session.tenantId, exhausted.promotionId);

			const usedCount = exhausted.maxUsesPerUser ?? 0;
			const summary = promotion
				? customerPromotionSummaryFromPromotion(promotion, usedCount)
				: {
						id: exhausted.promotionId,
						tenantId: auth.session.tenantId,
						title: exhausted.promotionTitle,
						description: "",
						type: "discount" as const,
						startDate: null,
						endDate: null,
						isActive: true,
						maxUsesPerUser: exhausted.maxUsesPerUser,
						usedCount,
					};

			return NextResponse.json({
				customer: customerToJson(result.customer),
				promotion: customerPromotionSummaryToJson(summary),
				outcomes: staffScanOutcomesToJson(result.outcomes),
			});
		}

		return NextResponse.json({
			customer: customerToJson(result.customer),
			outcomes: staffScanOutcomesToJson(result.outcomes),
		});
	} catch (error) {
		if (error instanceof DomainError) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		if (error instanceof TenantNotFound) {
			return HttpNextResponse.domainError(error, 404);
		}

		throw error;
	}
}
