"use client";

import { type ReactElement, useEffect } from "react";

import { applyThemeToDocument, type TenantTheme } from "./applyTheme";

type HostTenantThemeApplierProps = {
	theme: TenantTheme;
};

/** Applies tenant branding from subdomain resolution (issue #5). */
export function HostTenantThemeApplier({ theme }: HostTenantThemeApplierProps): ReactElement | null {
	useEffect(() => {
		applyThemeToDocument(theme);
	}, [theme.primaryColor, theme.secondaryColor, theme]);

	return null;
}
