import { Service } from "diod";

import { type PlatformBillingOverview } from "../../domain/PlatformBillingOverview";
import { PlatformBillingReadRepository } from "../../domain/PlatformBillingReadRepository";

@Service()
export class GetPlatformBillingOverview {
	constructor(private readonly repository: PlatformBillingReadRepository) {}

	async execute(): Promise<PlatformBillingOverview> {
		return this.repository.getOverview();
	}
}
