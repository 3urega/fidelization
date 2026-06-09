import "reflect-metadata";

import { NextResponse } from "next/server";

import { EnterPlatformUserFromTenantSession } from "../../../../../contexts/identity/users/application/authenticate/EnterPlatformUserFromTenantSession";
import { PlatformUserCannotUseUserLogin } from "../../../../../contexts/identity/users/domain/PlatformUserCannotUseUserLogin";
import { UserDoesNotExist } from "../../../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userAuthResponseToJson } from "../../../../../lib/auth/http";
import { createSessionToken, jsonWithSessionCookie } from "../../../../../lib/auth/session";
import { requireTenantSession } from "../../../../../lib/auth/requireTenantSession";
import { resolvePlatformHomeUrlFromRequest } from "../../../../../lib/platform/resolvePlatformHomeUrl";

export async function POST(request: Request): Promise<Response> {
	try {
		const auth = await requireTenantSession(request);
		if (auth instanceof NextResponse) {
			return auth;
		}

		const user = await container
			.get(EnterPlatformUserFromTenantSession)
			.enter(auth.session.userId);

		const session = {
			kind: "user" as const,
			userId: user.id.value,
			...(user.qrValue ? { qrValue: user.qrValue } : {}),
		};
		const token = await createSessionToken(session);

		return jsonWithSessionCookie(
			{
				...userAuthResponseToJson(user, session),
				redirectUrl: resolvePlatformHomeUrlFromRequest(request),
			},
			token,
		);
	} catch (error) {
		if (error instanceof PlatformUserCannotUseUserLogin || error instanceof UserDoesNotExist) {
			const response = handleAuthDomainError(error);

			if (response) {
				return response;
			}
		}

		throw error;
	}
}
