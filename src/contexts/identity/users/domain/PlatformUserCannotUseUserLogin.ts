import { DomainError } from "../../../shared/domain/DomainError";

export class PlatformUserCannotUseUserLogin extends DomainError {
	readonly type = "PlatformUserCannotUseUserLogin";
	readonly message: string;

	constructor() {
		const message = "Esta cuenta es de administración de plataforma. Usa /platform/login.";
		super(message);
		this.message = message;
	}
}
