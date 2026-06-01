import { UserPlan } from "../../contexts/identity/users/domain/UserPlan";

export function maxEmbeddingsPerQueryForPlan(plan: UserPlan): number {
	switch (plan) {
		case UserPlan.Premium:
			return 50;
		case UserPlan.Free:
		default:
			return 10;
	}
}
