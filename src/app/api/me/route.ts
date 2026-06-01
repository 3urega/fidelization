import "reflect-metadata";

import { NextResponse } from "next/server";

import { UserFinder } from "../../../contexts/identity/users/application/find/UserFinder";
import { UserProfileUpdater } from "../../../contexts/identity/users/application/update_profile/UserProfileUpdater";
import { UserDoesNotExist } from "../../../contexts/identity/users/domain/UserDoesNotExist";
import { container } from "../../../contexts/shared/infrastructure/dependency-injection/diod.config";
import { handleAuthDomainError, userToJson } from "../../../lib/auth/http";
import { getAuthenticatedUserId } from "../../../lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const userId = await getAuthenticatedUserId(request);
	if (!userId) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	try {
		const user = await container.get(UserFinder).find(userId);

		return NextResponse.json({ user: userToJson(user) });
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}

type PatchBody = {
	name?: string;
	profilePicture?: string;
};

export async function PATCH(request: Request): Promise<Response> {
	const userId = await getAuthenticatedUserId(request);
	if (!userId) {
		return NextResponse.json({ error: { description: "Unauthorized" } }, { status: 401 });
	}

	const body = (await request.json()) as PatchBody;
	if (body.name === undefined && body.profilePicture === undefined) {
		return NextResponse.json(
			{ error: { description: "name or profilePicture required" } },
			{ status: 400 },
		);
	}

	try {
		const finder = container.get(UserFinder);
		const current = await finder.find(userId);
		const updater = container.get(UserProfileUpdater);
		const user = await updater.update({
			userId,
			name: body.name ?? current.name.value,
			profilePicture: body.profilePicture ?? current.profilePicture.value,
		});

		return NextResponse.json({ user: userToJson(user) });
	} catch (error) {
		if (error instanceof UserDoesNotExist) {
			const response = handleAuthDomainError(error);
			if (response) {
				return response;
			}
		}

		throw error;
	}
}
