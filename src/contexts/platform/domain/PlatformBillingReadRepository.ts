import { type PlatformBillingOverview } from "./PlatformBillingOverview";

export abstract class PlatformBillingReadRepository {
	abstract getOverview(): Promise<PlatformBillingOverview>;
}
