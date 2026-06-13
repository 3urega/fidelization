import { InvalidPlatformGame } from "./InvalidPlatformGame";
import { parsePlatformGameRequiredFeature } from "./PlatformGameRequiredFeature";
import { parsePlatformGameStatus } from "./PlatformGameStatus";

const MAX_LABEL_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PlatformGameCreateInput = {
	slug: string;
	label: string;
	description: string;
	status: ReturnType<typeof parsePlatformGameStatus>;
	requiredFeature: ReturnType<typeof parsePlatformGameRequiredFeature>;
};

function parseOptionalText(value: unknown, field: string, maxLength: number): string {
	if (value === undefined || value === null) {
		return "";
	}

	const text = String(value).trim();

	if (text.length > maxLength) {
		throw new InvalidPlatformGame(`${field} must be at most ${maxLength} characters`);
	}

	return text;
}

function parseSlug(value: unknown): string {
	const slug = String(value ?? "")
		.trim()
		.toLowerCase();

	if (!slug) {
		throw new InvalidPlatformGame("Game slug is required");
	}

	if (!SLUG_PATTERN.test(slug)) {
		throw new InvalidPlatformGame(
			"Game slug must be lowercase alphanumeric with optional hyphens",
		);
	}

	return slug;
}

export function parsePlatformGameCreate(input: {
	slug?: string;
	label?: string;
	description?: string;
	status?: unknown;
	requiredFeature?: unknown;
}): PlatformGameCreateInput {
	const label = input.label?.trim() ?? "";

	if (!label) {
		throw new InvalidPlatformGame("Game label is required");
	}

	if (label.length > MAX_LABEL_LENGTH) {
		throw new InvalidPlatformGame(`Game label must be at most ${MAX_LABEL_LENGTH} characters`);
	}

	let status: ReturnType<typeof parsePlatformGameStatus>;

	try {
		status = parsePlatformGameStatus(input.status ?? "draft");
	} catch {
		throw new InvalidPlatformGame(`Invalid status: ${String(input.status)}`);
	}

	let requiredFeature: ReturnType<typeof parsePlatformGameRequiredFeature>;

	try {
		requiredFeature = parsePlatformGameRequiredFeature(input.requiredFeature);
	} catch {
		throw new InvalidPlatformGame(`Invalid requiredFeature: ${String(input.requiredFeature)}`);
	}

	return {
		slug: parseSlug(input.slug),
		label,
		description: parseOptionalText(input.description, "description", MAX_DESCRIPTION_LENGTH),
		status,
		requiredFeature,
	};
}
