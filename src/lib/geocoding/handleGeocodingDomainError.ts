import { NextResponse } from "next/server";

import { DomainError } from "../../contexts/shared/domain/DomainError";
import { HttpNextResponse } from "../../contexts/shared/infrastructure/http/HttpNextResponse";

export function handleGeocodingDomainError(error: DomainError): NextResponse | undefined {
	if (error.type === "InvalidGeocodingAddress") {
		return HttpNextResponse.domainError(error, 400);
	}

	if (error.type === "GeocodingFailed") {
		return HttpNextResponse.domainError(error, 422);
	}

	if (error.type === "GeocodingNotConfigured") {
		return HttpNextResponse.domainError(error, 503);
	}

	return undefined;
}
