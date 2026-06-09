import type { Metadata } from "next";

import { safeRedirectPath } from "../../../../../lib/auth/safeRedirectPath";
import { PlatformBusinessAuthGate } from "./PlatformBusinessAuthGate";

export const metadata: Metadata = {
	title: "Registrar negocio — App Fidelización",
};

const TENANT_STEP_PATH = "/u/register/business/tenant";

export default function PlatformRegisterBusinessPage(): React.ReactElement {
	const next = safeRedirectPath(TENANT_STEP_PATH) ?? TENANT_STEP_PATH;
	const registerHref = `/u/register?next=${encodeURIComponent(next)}`;
	const loginHref = `/u/login?next=${encodeURIComponent(next)}`;

	return <PlatformBusinessAuthGate registerHref={registerHref} loginHref={loginHref} />;
}
