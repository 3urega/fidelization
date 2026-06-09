import { DomainError } from "../../../shared/domain/DomainError";

/** Email account already linked to a different Google identity. */
export class OAuthAccountAlreadyLinked extends DomainError {
	readonly type = "OAuthAccountAlreadyLinked";
	readonly message: string;

	constructor(public readonly email: string) {
		const message = `Email ${email} is already linked to another sign-in method`;
		super(message);
		this.message = message;
	}
}
