import { Service } from "diod";

import { env } from "../../../../../lib/env";
import { endOfZonedDayUtc, startOfZonedDayUtc } from "../../../../../lib/time/zonedCalendarWindows";
import {
	computeParticipationUsage,
	type RouletteParticipationUsage,
} from "../../domain/RouletteParticipationQuota";
import type { RouletteParticipation } from "../../domain/RouletteParticipation";
import type { RouletteRulesV2 } from "../../domain/RouletteConfig";
import { RouletteSpinEligibilityRepository } from "../../domain/RouletteSpinEligibilityRepository";
import { RouletteSpinRepository } from "../../domain/RouletteSpinRepository";

export type ResolveRouletteParticipationUsageParams = {
	tenantId: string;
	customerId: string;
	participation: RouletteParticipation | null;
	rules: RouletteRulesV2;
	at?: Date;
};

@Service()
export class ResolveRouletteParticipationUsage {
	constructor(
		private readonly spinRepository: RouletteSpinRepository,
		private readonly eligibilityRepository: RouletteSpinEligibilityRepository,
	) {}

	async execute(params: ResolveRouletteParticipationUsageParams): Promise<RouletteParticipationUsage> {
		const at = params.at ?? new Date();
		const timezone = env.appTimezone;

		if (!params.participation) {
			return computeParticipationUsage({
				rules: params.rules,
				spinsInPeriod: 0,
				authorizationsInPeriod: 0,
				spinsToday: 0,
				authorizationsToday: 0,
			});
		}

		const enrolledAt = new Date(params.participation.toPrimitives().enrolledAt);
		const periodEndsAt = new Date(params.participation.toPrimitives().periodEndsAt);
		const todayStart = startOfZonedDayUtc(at, timezone);
		const todayEnd = endOfZonedDayUtc(at, timezone);
		const periodStart = enrolledAt;
		const periodUsageEnd =
			at.getTime() < periodEndsAt.getTime()
				? new Date(at.getTime() + 1)
				: periodEndsAt;

		const [spinsInPeriod, authorizationsInPeriod, spinsToday, authorizationsToday] =
			await Promise.all([
				this.spinRepository.countByCustomerBetween(
					params.tenantId,
					params.customerId,
					periodStart,
					periodUsageEnd,
				),
				this.eligibilityRepository.countUnconsumedCreatedBetween(
					params.tenantId,
					params.customerId,
					periodStart,
					periodUsageEnd,
				),
				this.spinRepository.countByCustomerBetween(
					params.tenantId,
					params.customerId,
					todayStart,
					todayEnd,
				),
				this.eligibilityRepository.countUnconsumedCreatedBetween(
					params.tenantId,
					params.customerId,
					todayStart,
					todayEnd,
				),
			]);

		return computeParticipationUsage({
			rules: params.rules,
			spinsInPeriod,
			authorizationsInPeriod,
			spinsToday,
			authorizationsToday,
		});
	}
}
