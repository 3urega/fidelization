import type { ThemeTokenKey, ThemeTokenSet } from "./themePresets";

export function applyThemeTokensToDocument(tokens: Partial<ThemeTokenSet>): void {
	for (const key of Object.keys(tokens) as ThemeTokenKey[]) {
		const value = tokens[key];

		if (value !== undefined) {
			document.documentElement.style.setProperty(key, value);
		}
	}
}
