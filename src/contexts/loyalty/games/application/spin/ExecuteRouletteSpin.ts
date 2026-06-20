import { Service } from "diod";

import { GetTenantRouletteConfig } from "../config/GetTenantRouletteConfig";
import type { RoulettePrizeType } from "../../domain/RoulettePrizeType";
import type { RouletteSegmentPrize } from "../../domain/RouletteSegment";
import {
	RouletteSpin,
	type RouletteSpinStatus,
	type RouletteSpinTriggerSource,
} from "../../domain/RouletteSpin";
import { RouletteSpinUnitOfWork } from "../../domain/RouletteSpinUnitOfWork";
import { TenantGameActivationNotFound } from "../../domain/TenantGameActivationNotFound";
import { TenantGameActivationRepository } from "../../domain/TenantGameActivationRepository";
import { pickSegment, type RandomNumberGenerator } from "../../domain/RouletteWheel";
import { AssertRouletteSpinAccess } from "./AssertRouletteSpinAccess";

export type ExecuteRouletteSpinParams = {
	tenantId: string;
	customerId: string;
	userId: string;
	triggerSource?: RouletteSpinTriggerSource;
	triggerRef?: string | null;
	rng?: RandomNumberGenerator;
};

export type ExecuteRouletteSpinResult = {
	spinId: string;
	segmentIndex: number;
	segmentLabel: string;
	prizeType: RoulettePrizeType;
	prize: RouletteSegmentPrize;
	status: RouletteSpinStatus;
};

@Service()
export class ExecuteRouletteSpin {
	constructor(
		private readonly assertRouletteSpinAccess: AssertRouletteSpinAccess,
		private readonly getTenantRouletteConfig: GetTenantRouletteConfig,
		private readonly activationRepository: TenantGameActivationRepository,
		private readonly spinUnitOfWork: RouletteSpinUnitOfWork,
	) {}

	async execute(params: ExecuteRouletteSpinParams): Promise<ExecuteRouletteSpinResult> {
		await this.assertRouletteSpinAccess.execute({
			tenantId: params.tenantId,
			customerId: params.customerId,
		});

		const activationRow = await this.activationRepository.searchByTenantAndSlug(
			params.tenantId,
			"ruleta",
		);

		if (!activationRow) {
			throw new TenantGameActivationNotFound(params.tenantId, "ruleta");
		}

		const config = activationRow.config;
		const pick = pickSegment(config.segments, params.rng ?? Math.random);
		const segmentPrimitives = pick.segment.toPrimitives();
		const prizeType = segmentPrimitives.prizeType;
		const prize = { ...segmentPrimitives.prize };
		const status: RouletteSpinStatus = prizeType === "physical" ? "pending_redeem" : "applied";
		const configSnapshot = config.toPrimitives();

		const spin = RouletteSpin.create({
			tenantId: params.tenantId,
			customerId: params.customerId,
			segmentId: segmentPrimitives.id,
			segmentIndex: pick.segmentIndex,
			prizeType,
			prizePayload: prize,
			status,
			triggerSource: params.triggerSource ?? "manual",
			triggerRef: params.triggerRef ?? null,
			configSnapshot,
		});

		const updatedConfig = config.withIncrementedStockUsed(segmentPrimitives.id);
		const updatedActivation = activationRow.withConfig(updatedConfig);

		const prizeApplication =
			prizeType === "none" || prizeType === "physical"
				? null
				: {
						prizeType,
						prize,
						tenantId: params.tenantId,
						customerId: params.customerId,
						userId: params.userId,
						spinId: spin.toPrimitives().id,
					};

		await this.spinUnitOfWork.execute({
			spin,
			activation: updatedActivation,
			prizeApplication,
		});

		return {
			spinId: spin.toPrimitives().id,
			segmentIndex: pick.segmentIndex,
			segmentLabel: segmentPrimitives.label,
			prizeType,
			prize,
			status,
		};
	}
}
