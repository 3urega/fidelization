import { DomainError } from "../../../shared/domain/DomainError";

export class TenantSlugAlreadyExists extends DomainError {
	static readonly ERROR_TYPE = "TenantSlugAlreadyExists";
	readonly type = TenantSlugAlreadyExists.ERROR_TYPE;
	readonly message: string;

	constructor(public readonly slug: string) {
		const message = `El slug "${slug}" ya está en uso por otro negocio`;
		super(message);
		this.message = message;
	}
}
