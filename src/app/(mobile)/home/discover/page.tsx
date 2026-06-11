import { redirect } from "next/navigation";

import { platformRoutes } from "../../../../lib/platform/routes";

/** Legacy discover URL — join form lives on `/home?tab=locales`. */
export default function PlatformDiscoverPage(): never {
	redirect(platformRoutes.homeTab("locales"));
}
