/**
 * Runtime preset tokens. Values must stay in sync with src/app/theme/tokens.css (:root).
 */
export type ThemePresetId = "cafeClassic" | "modernCoffee" | "minimalLight";

export type ThemeTokenKey =
	| "--color-primary"
	| "--color-secondary"
	| "--color-background"
	| "--color-foreground"
	| "--color-muted-foreground"
	| "--color-muted"
	| "--color-border"
	| "--color-error"
	| "--color-primary-foreground"
	| "--border-radius"
	| "--font-family";

export type ThemeTokenSet = Record<ThemeTokenKey, string>;

/** System base (issue #1). Same values as tokens.css :root. */
export const systemBaseTokens: ThemeTokenSet = {
	"--color-primary": "#7c3aed",
	"--color-secondary": "#4f46e5",
	"--color-background": "#fafafa",
	"--color-foreground": "#111827",
	"--color-muted-foreground": "#6b7280",
	"--color-muted": "#6b7280",
	"--color-border": "#e5e7eb",
	"--color-error": "#dc2626",
	"--color-primary-foreground": "#ffffff",
	"--border-radius": "12px",
	"--font-family": "var(--font-inter), system-ui, sans-serif",
};

export type ThemePresetOverrides = Partial<ThemeTokenSet>;

/** Overrides per preset (issue #3). */
export const themePresets: Record<ThemePresetId, ThemePresetOverrides> = {
	cafeClassic: {
		"--color-primary": "#6f4e37",
		"--color-secondary": "#a67c52",
		"--color-background": "#faf8f5",
		"--color-foreground": "#3d2c21",
		"--color-muted-foreground": "#8b7355",
		"--color-muted": "#8b7355",
		"--color-border": "#e8dfd4",
	},
	modernCoffee: {
		"--color-primary": "#1e293b",
		"--color-secondary": "#0d9488",
		"--color-background": "#f8fafc",
		"--color-foreground": "#0f172a",
		"--color-muted-foreground": "#64748b",
		"--color-muted": "#64748b",
		"--color-border": "#cbd5e1",
		"--border-radius": "10px",
	},
	minimalLight: {
		"--color-primary": "#525252",
		"--color-secondary": "#737373",
		"--color-background": "#ffffff",
		"--color-foreground": "#171717",
		"--color-muted-foreground": "#a3a3a3",
		"--color-muted": "#a3a3a3",
		"--color-border": "#f5f5f5",
		"--border-radius": "8px",
	},
};

export const defaultPresetId: ThemePresetId = "cafeClassic";

export const themePresetIds = Object.keys(themePresets) as ThemePresetId[];

export const themePresetLabels: Record<ThemePresetId, string> = {
	cafeClassic: "Café clásico",
	modernCoffee: "Modern coffee",
	minimalLight: "Minimal light",
};

export function resolvePresetTokens(presetId: ThemePresetId): ThemeTokenSet {
	return {
		...systemBaseTokens,
		...themePresets[presetId],
	};
}
