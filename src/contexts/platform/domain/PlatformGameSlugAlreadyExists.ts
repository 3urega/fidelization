import { DomainError } from "../../shared/domain/DomainError";

export class PlatformGameSlugAlreadyExists extends DomainError {
	readonly type = "PlatformGameSlugAlreadyExists";
	readonly message: string;

	constructor(public readonly slug: string) {
		const message = `Platform game slug "${slug}" already exists`;
		super(message);
		this.message = message;
	}
}
