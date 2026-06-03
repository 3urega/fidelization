import { NextResponse } from "next/server";

import { UserFinder } from "../../contexts/identity/users/application/find/UserFinder";
import { User } from "../../contexts/identity/users/domain/User";
import { UserDoesNotExist } from "../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../contexts/shared/infrastructure/dependency-injection/diod.config";
import {
	getAuthenticatedSession,
	isOnboardingSession,
	type OnboardingSessionClaims,
} from "./session";

export type OnboardingSessionContext = {
	session: OnboardingSessionClaims;
	user: User;
};

export async function requireOnboardingSession(
	request: Request,
): Promise<OnboardingSessionContext | NextResponse> {
	const session = await getAuthenticatedSession(request);

	if (!session || !isOnboardingSession(session)) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	try {
		const user = await container.get(UserFinder).find(session.userId);

		return { session, user };
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			return NextResponse.json({ error: { description: error.message } }, { status: 401 });
		}

		throw error;
	}
}
