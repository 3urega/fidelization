export function hasTenantChosenPlan(tenant: { subscriptionPlanId: string | null }): boolean {
	return tenant.subscriptionPlanId !== null;
}
