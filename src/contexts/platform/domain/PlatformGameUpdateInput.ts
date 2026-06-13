import { InvalidPlatformGame } from "./InvalidPlatformGame";
import type { PlatformGameCreateInput } from "./PlatformGameCreateInput";
import { parsePlatformGameCreate } from "./PlatformGameCreateInput";
import { parsePlatformGameRequiredFeature } from "./PlatformGameRequiredFeature";
import { parsePlatformGameStatus } from "./PlatformGameStatus";

export type PlatformGameUpdateInput = PlatformGameCreateInput & {
	sortOrder: number;
};

export function parsePlatformGamePartialUpdate(input: {
	label?: string;
	description?: string;
	status?: unknown;
	requiredFeature?: unknown;
	sortOrder?: number;
}): Partial<PlatformGameUpdateInput> {
	const partial: Partial<PlatformGameUpdateInput> = {};

	if (input.label !== undefined) {
		const label = input.label.trim();

		if (!label) {
			throw new InvalidPlatformGame("Game label is required");
		}

		partial.label = label;
	}

	if (input.description !== undefined) {
		partial.description = String(input.description).trim();
	}

	if (input.status !== undefined) {
		try {
			partial.status = parsePlatformGameStatus(input.status);
		} catch {
			throw new InvalidPlatformGame(`Invalid status: ${String(input.status)}`);
		}
	}

	if (input.requiredFeature !== undefined) {
		try {
			partial.requiredFeature = parsePlatformGameRequiredFeature(input.requiredFeature);
		} catch {
			throw new InvalidPlatformGame(`Invalid requiredFeature: ${String(input.requiredFeature)}`);
		}
	}

	if (input.sortOrder !== undefined) {
		if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
			throw new InvalidPlatformGame("sortOrder must be a non-negative integer");
		}

		partial.sortOrder = input.sortOrder;
	}

	return partial;
}
