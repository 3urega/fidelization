import { InvalidStampType } from "./InvalidStampType";

export function parseStampTypeDeactivate(input: { isActive?: boolean }): { isActive: false } {
	if (input.isActive !== false) {
		throw new InvalidStampType("Only deactivation is supported (isActive: false)");
	}

	return { isActive: false };
}
