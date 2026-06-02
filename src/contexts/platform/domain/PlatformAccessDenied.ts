import { DomainError } from "../../shared/domain/DomainError";

export class PlatformAccessDenied extends DomainError {
	readonly type = "PlatformAccessDenied";
	readonly message: string;

	constructor() {
		const message = "Platform superadmin access required";
		super(message);
		this.message = message;
	}
}
