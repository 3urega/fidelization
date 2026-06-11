import { InvalidStampType } from "./InvalidStampType";

const MAX_LABEL_LENGTH = 40;

export type StampTypeCreateInput = {
	label: string;
};

export function parseStampTypeCreate(input: { label?: string }): StampTypeCreateInput {
	const label = input.label?.trim() ?? "";

	if (!label) {
		throw new InvalidStampType("Label is required");
	}

	if (label.length > MAX_LABEL_LENGTH) {
		throw new InvalidStampType(`Label must be at most ${MAX_LABEL_LENGTH} characters`);
	}

	return { label };
}
