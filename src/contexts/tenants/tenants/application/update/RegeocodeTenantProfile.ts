import { Service } from "diod";

import { TenantRole } from "../../../memberships/domain/TenantRole";
import { ApplyTenantGeocodingForAddress } from "../geocoding/ApplyTenantGeocodingForAddress";
import { TenantGeocodingAddressRequired } from "../../domain/TenantGeocodingAddressRequired";
import { TenantNotFound } from "../../domain/TenantNotFound";
import { TenantProfileForbidden } from "../../domain/TenantProfileForbidden";
import type { TenantProfileUpdateResult } from "../../domain/TenantProfileUpdateResult";
import { TenantRepository } from "../../domain/TenantRepository";

export type RegeocodeTenantProfileParams = {
	tenantId: string;
	role: TenantRole;
};

@Service()
export class RegeocodeTenantProfile {
	constructor(
		private readonly tenantRepository: TenantRepository,
		private readonly applyTenantGeocodingForAddress: ApplyTenantGeocodingForAddress,
	) {}

	async execute(params: RegeocodeTenantProfileParams): Promise<TenantProfileUpdateResult> {
		if (params.role !== TenantRole.Owner) {
			throw new TenantProfileForbidden(params.role);
		}

		const existing = await this.tenantRepository.findById(params.tenantId);
		if (!existing) {
			throw new TenantNotFound(params.tenantId);
		}

		const address = existing.address.trim();
		if (!address) {
			throw new TenantGeocodingAddressRequired();
		}

		const geocodingResult = await this.applyTenantGeocodingForAddress.execute(address);

		const updated = await this.tenantRepository.updateProfile(params.tenantId, {
			geolocation: geocodingResult.geolocation,
		});

		if (!updated) {
			throw new TenantNotFound(params.tenantId);
		}

		return {
			tenant: updated,
			geocodingStatus: geocodingResult.outcome.status,
			geocodingMessage: geocodingResult.outcome.message,
		};
	}
}
