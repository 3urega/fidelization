import type { ThemeTokenSet } from "./themePresets";

export function applyThemeTokensToDocument(tokens: Partial<ThemeTokenSet>): void {
	for (const [name, value] of Object.entries(tokens)) {
		if (value !== undefined) {
			document.documentElement.style.setProperty(name, value);
		}
	}
}
