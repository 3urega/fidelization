import { InvalidTenantProfile } from "./InvalidTenantProfile";

export const TENANT_ADDRESS_MAX_LENGTH = 500;
export const TENANT_DESCRIPTION_MAX_LENGTH = 2000;

export type TenantProfileUpdate = {
	address?: string;
	description?: string;
};

export type TenantProfileUpdateInput = {
	address?: string;
	description?: string;
};

function trimField(value: string | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	return value.trim();
}

function assertMaxLength(value: string, maxLength: number, field: string): void {
	if (value.length > maxLength) {
		throw new InvalidTenantProfile(`${field} must be at most ${maxLength} characters`);
	}
}

export function parseTenantProfileUpdate(input: TenantProfileUpdateInput): TenantProfileUpdate {
	const profile: TenantProfileUpdate = {};

	if (input.address !== undefined) {
		const address = trimField(input.address) ?? "";
		assertMaxLength(address, TENANT_ADDRESS_MAX_LENGTH, "address");
		profile.address = address;
	}

	if (input.description !== undefined) {
		const description = trimField(input.description) ?? "";
		assertMaxLength(description, TENANT_DESCRIPTION_MAX_LENGTH, "description");
		profile.description = description;
	}

	if (Object.keys(profile).length === 0) {
		throw new InvalidTenantProfile("At least one profile field is required");
	}

	return profile;
}
