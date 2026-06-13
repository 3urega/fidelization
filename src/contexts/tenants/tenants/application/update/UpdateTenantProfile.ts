import { Service } from "diod";

import { GeocodeAddressString } from "../../../../shared/geocoding/application/geocode/GeocodeAddressString";
import { GeocodingFailed } from "../../../../shared/geocoding/domain/GeocodingFailed";
import { GeocodingNotConfigured } from "../../../../shared/geocoding/domain/GeocodingNotConfigured";
import { TenantRole } from "../../../memberships/domain/TenantRole";
import { Tenant } from "../../domain/Tenant";
import { TenantGeolocation } from "../../domain/TenantGeolocation";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantProfileForbidden } from "../../domain/TenantProfileForbidden";
import {
	parseTenantProfileUpdate,
	type TenantProfileUpdate,
	TenantProfileUpdateInput,
} from "../../domain/TenantProfileUpdate";
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
		private readonly geocodeAddressString: GeocodeAddressString,
	) {}

	async execute(params: UpdateTenantProfileParams): Promise<Tenant> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantProfileForbidden(params.role);
		}

		const profile = parseTenantProfileUpdate(params.profile);

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		await this.applyGeolocationIfAddressChanged(profile, existing.address);

		const updated = await this.tenantRepository.updateProfile(params.tenantId, profile);
		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return updated;
	}

	private async applyGeolocationIfAddressChanged(
		profile: TenantProfileUpdate,
		currentAddress: string,
	): Promise<void> {
		if (profile.address === undefined) {
			return;
		}

		if (profile.address === currentAddress) {
			return;
		}

		if (profile.address === "") {
			profile.geolocation = null;

			return;
		}

		try {
			const result = await this.geocodeAddressString.execute({ address: profile.address });
			profile.geolocation = TenantGeolocation.fromGeocodingResult(result);
		} catch (error) {
			if (error instanceof GeocodingFailed || error instanceof GeocodingNotConfigured) {
				console.warn(`[UpdateTenantProfile] geocoding skipped: ${error.message}`);
				profile.geolocation = null;

				return;
			}

			throw error;
		}
	}
}
