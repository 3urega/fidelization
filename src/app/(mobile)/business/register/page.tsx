import type { Metadata } from "next";

import { safeRedirectPath } from "../../../../lib/auth/safeRedirectPath";
import { platformRoutes } from "../../../../lib/platform/routes";
import { PlatformBusinessAuthGate } from "./PlatformBusinessAuthGate";

export const metadata: Metadata = {
	title: "Registrar negocio — App Fidelización",
};

export default function PlatformRegisterBusinessPage(): React.ReactElement {
	const next = safeRedirectPath(platformRoutes.registerBusinessTenant) ?? platformRoutes.registerBusinessTenant;
	const registerHref = `${platformRoutes.register}?next=${encodeURIComponent(next)}`;
	const loginHref = `${platformRoutes.login}?next=${encodeURIComponent(next)}`;

	return <PlatformBusinessAuthGate registerHref={registerHref} loginHref={loginHref} />;
}
