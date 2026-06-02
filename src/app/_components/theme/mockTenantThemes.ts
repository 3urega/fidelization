/** Tenant branding mocks (issue #2). Not platform presets — see themePresets.ts. */
export type TenantTheme = {
	primaryColor: string;
	secondaryColor: string;
};

/** Platform default; matches tokens.css and issue #1 baseline. */
export const defaultTenantTheme: TenantTheme = {
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
};

/** Café Demo seed (`prisma/seed.ts`). */
export const demoTenantTheme: TenantTheme = {
	primaryColor: "#7C3AED",
	secondaryColor: "#4F46E5",
};

/** Alternate mock for runtime preview without login. */
export const mockBakeryTheme: TenantTheme = {
	primaryColor: "#B45309",
	secondaryColor: "#D97706",
};

export const mockTenantThemes = {
	default: defaultTenantTheme,
	demo: demoTenantTheme,
	bakery: mockBakeryTheme,
} as const;
