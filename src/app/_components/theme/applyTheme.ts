import { applyThemeTokensToDocument } from "./applyThemeTokens";
import { defaultTenantTheme, type TenantTheme } from "./mockTenantThemes";

export type { TenantTheme };
export { defaultTenantTheme };

export function applyThemeToDocument(theme: TenantTheme): void {
	applyThemeTokensToDocument({
		"--color-primary": theme.primaryColor,
		"--color-secondary": theme.secondaryColor,
	});
}

/** Canonical runtime API (issue #2). */
export const applyTheme = applyThemeToDocument;
