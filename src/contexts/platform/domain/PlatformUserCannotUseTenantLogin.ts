import { DomainError } from "../../shared/domain/DomainError";

export class PlatformUserCannotUseTenantLogin extends DomainError {
	readonly type = "PlatformUserCannotUseTenantLogin";
	readonly message: string;

	constructor() {
		const message = "Esta cuenta es de plataforma. Usa /platform/login.";
		super(message);
		this.message = message;
	}
}
