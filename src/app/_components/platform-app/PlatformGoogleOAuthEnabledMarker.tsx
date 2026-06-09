import type { ReactElement } from "react";

import { isGoogleOAuthConfigured } from "../../../lib/platform/googleOAuth";

/** SSR marker for verify scripts when Google OAuth env is set. */
export function PlatformGoogleOAuthEnabledMarker(): ReactElement | null {
	if (!isGoogleOAuthConfigured()) {
		return null;
	}

	return <span className="hidden" data-platform-google-oauth-enabled="" />;
}
