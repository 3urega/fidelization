import { RouletteParticipation } from "./RouletteParticipation";

export abstract class RouletteParticipationRepository {
	abstract save(participation: RouletteParticipation): Promise<void>;

	abstract findByTenantAndCustomer(
		tenantId: string,
		customerId: string,
	): Promise<RouletteParticipation | null>;
}
