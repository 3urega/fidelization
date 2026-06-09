"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactElement, ReactNode } from "react";

import { getGoogleOAuthClientId } from "../../../lib/platform/googleOAuth";

type PlatformGoogleOAuthProviderProps = {
	children: ReactNode;
};

export function PlatformGoogleOAuthProvider({
	children,
}: PlatformGoogleOAuthProviderProps): ReactElement {
	const clientId = getGoogleOAuthClientId();

	if (!clientId) {
		return <>{children}</>;
	}

	return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
