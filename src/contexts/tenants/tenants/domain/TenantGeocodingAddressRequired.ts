import { DomainError } from "../../../shared/domain/DomainError";

export class TenantGeocodingAddressRequired extends DomainError {
	readonly type = "TenantGeocodingAddressRequired";
	readonly message: string;

	constructor() {
		const message = "A saved address is required before geocoding can be retried.";
		super(message);
		this.message = message;
	}
}
