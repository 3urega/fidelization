import { Service } from "diod";

import { SubscriptionPlan } from "../../domain/SubscriptionPlan";
import { TenantBillingRepository } from "../../domain/TenantBillingRepository";

@Service()
export class ListPlatformSubscriptionPlans {
	constructor(private readonly billingRepository: TenantBillingRepository) {}

	async execute(): Promise<SubscriptionPlan[]> {
		return this.billingRepository.listAllPlans();
	}
}
