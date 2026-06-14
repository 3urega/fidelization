import { Service } from "diod";

import { TenantRole } from "../../../memberships/domain/TenantRole";
import { ApplyTenantGeocodingForAddress } from "../geocoding/ApplyTenantGeocodingForAddress";
import { Tenant } from "../../domain/Tenant";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantProfileForbidden } from "../../domain/TenantProfileForbidden";
import { tenantProfileGeocodingOutcome } from "../../domain/TenantProfileGeocodingOutcome";
import {
	parseTenantProfileUpdate,
	type TenantProfileUpdate,
	TenantProfileUpdateInput,
} from "../../domain/TenantProfileUpdate";
import type { TenantProfileUpdateResult } from "../../domain/TenantProfileUpdateResult";
import { TENANT_GEOCODING_STATUS } from "../../domain/TenantGeocodingStatus";
import { TenantRepository } from "../../domain/TenantRepository";

export type UpdateTenantProfileParams = {
	tenantId: string;
	role: TenantRole;
	profile: TenantProfileUpdateInput;
};

@Service()
export class UpdateTenantProfile {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly applyTenantGeocodingForAddress: ApplyTenantGeocodingForAddress,
	) {}

	async execute(params: UpdateTenantProfileParams): Promise<TenantProfileUpdateResult> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantProfileForbidden(params.role);
		}

		const profile = parseTenantProfileUpdate(params.profile);

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const geocodingOutcome = await this.applyGeolocationIfAddressChanged(profile, existing.address);

		const updated = await this.tenantRepository.updateProfile(params.tenantId, profile);
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return {
			tenant: updated,
			geocodingStatus: geocodingOutcome.status,
			geocodingMessage: geocodingOutcome.message,
		};
	}

	private async applyGeolocationIfAddressChanged(
		profile: TenantProfileUpdate,
		currentAddress: string,
	) {
		if (profile.address === undefined) {
			return tenantProfileGeocodingOutcome(TENANT_GEOCODING_STATUS.Skipped);
		}

		if (profile.address === currentAddress) {
			return tenantProfileGeocodingOutcome(TENANT_GEOCODING_STATUS.Skipped);
		}

		if (profile.address === "") {
			profile.geolocation = null;

			return tenantProfileGeocodingOutcome(TENANT_GEOCODING_STATUS.Cleared);
		}

		const result = await this.applyTenantGeocodingForAddress.execute(profile.address);
		profile.geolocation = result.geolocation;

		return result.outcome;
	}
}
