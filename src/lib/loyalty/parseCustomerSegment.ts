import type { CustomerSegment } from "../../contexts/loyalty/customers/domain/analytics/CustomerSegment";

const VALID_SEGMENTS = new Set<CustomerSegment>(["featured", "at_risk", "near_reward", "all"]);

export function parseCustomerSegment(value: string | null): CustomerSegment | null {
	if (!value) {
		return null;
	}

	return VALID_SEGMENTS.has(value as CustomerSegment) ? (value as CustomerSegment) : null;
}
