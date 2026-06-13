import { DomainError } from "../../domain/DomainError";

export class GeocodingFailed extends DomainError {
	readonly type = "GeocodingFailed";
	readonly message: string;

	constructor(description: string) {
		super(description);
		this.message = description;
	}
}
