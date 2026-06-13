import { DomainError } from "../../domain/DomainError";

export class InvalidGeocodingAddress extends DomainError {
	readonly type = "InvalidGeocodingAddress";
	readonly message: string;

	constructor(description = "Address is required for geocoding") {
		super(description);
		this.message = description;
	}
}
