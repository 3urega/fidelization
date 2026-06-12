import { InvalidTenantProfile } from "./InvalidTenantProfile";

export type TenantDiscoveryTagId =
	| "panaderia"
	| "cafe-autor"
	| "comidas"
	| "desayunos"
	| "brunch"
	| "merienda"
	| "tapas"
	| "para-llevar";

export type TenantDiscoveryTagOption = {
	id: TenantDiscoveryTagId;
	label: string;
};

export const TENANT_DISCOVERY_TAG_OPTIONS: TenantDiscoveryTagOption[] = [
	{ id: "panaderia", label: "Panadería" },
	{ id: "cafe-autor", label: "Café de autor" },
	{ id: "comidas", label: "Comidas" },
	{ id: "desayunos", label: "Desayunos" },
	{ id: "brunch", label: "Brunch" },
	{ id: "merienda", label: "Merienda" },
	{ id: "tapas", label: "Tapas" },
	{ id: "para-llevar", label: "Para llevar" },
];

export const TENANT_DISCOVERY_TAGS_MAX = 5;

const TAG_ID_SET = new Set<string>(TENANT_DISCOVERY_TAG_OPTIONS.map((tag) => tag.id));

export function isTenantDiscoveryTagId(value: string): value is TenantDiscoveryTagId {
	return TAG_ID_SET.has(value);
}

export function parseTenantDiscoveryTags(value: unknown): TenantDiscoveryTagId[] {
	if (value === undefined) {
		return [];
	}

	if (!Array.isArray(value)) {
		throw new InvalidTenantProfile("discoveryTags must be an array");
	}

	const unique: TenantDiscoveryTagId[] = [];

	for (const entry of value) {
		if (typeof entry !== "string" || !isTenantDiscoveryTagId(entry)) {
			throw new InvalidTenantProfile(`Invalid discovery tag: ${String(entry)}`);
		}

		if (!unique.includes(entry)) {
			unique.push(entry);
		}
	}

	if (unique.length > TENANT_DISCOVERY_TAGS_MAX) {
		throw new InvalidTenantProfile(
			`discoveryTags must contain at most ${TENANT_DISCOVERY_TAGS_MAX} tags`,
		);
	}

	return unique;
}

export function resolveTenantDiscoveryTagLabel(tagId: string): string {
	return TENANT_DISCOVERY_TAG_OPTIONS.find((tag) => tag.id === tagId)?.label ?? tagId;
}
