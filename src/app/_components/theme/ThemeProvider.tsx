"use client";

import {
	createContext,
	type ReactElement,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { applyPresetToDocument } from "./applyPreset";
import { applyThemeToDocument, type TenantTheme } from "./applyTheme";
import { defaultPresetId, type ThemePresetId } from "./themePresets";

type ThemeContextValue = {
	applyTheme: (theme: TenantTheme) => void;
	applyPreset: (presetId: ThemePresetId) => void;
	activePresetId: ThemePresetId;
	resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type MeResponse = {
	tenant?: {
		primaryColor: string;
		secondaryColor: string;
	};
};

export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
	const [activePresetId, setActivePresetId] = useState<ThemePresetId>(defaultPresetId);

	const applyPreset = useCallback((presetId: ThemePresetId) => {
		applyPresetToDocument(presetId);
		setActivePresetId(presetId);
	}, []);

	const applyTheme = useCallback((theme: TenantTheme) => {
		applyThemeToDocument(theme);
	}, []);

	const resetTheme = useCallback(() => {
		applyPreset(defaultPresetId);
	}, [applyPreset]);

	useEffect(() => {
		applyPreset(defaultPresetId);
	}, [applyPreset]);

	useEffect(() => {
		void fetch("/api/me", { credentials: "include" })
			.then((response) => (response.ok ? (response.json() as Promise<MeResponse>) : null))
			.then((data) => {
				if (data?.tenant) {
					applyTheme({
						primaryColor: data.tenant.primaryColor,
						secondaryColor: data.tenant.secondaryColor,
					});
				}
			})
			.catch(() => {});
	}, [applyTheme]);

	const value = useMemo(
		() => ({
			applyTheme,
			applyPreset,
			activePresetId,
			resetTheme,
		}),
		[applyTheme, applyPreset, activePresetId, resetTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}

	return context;
}
