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

import { DEFAULT_PLATFORM_DISPLAY_NAME } from "../../../contexts/platform/domain/PlatformBranding";
import type { PlatformBrandingResponse } from "../../../lib/platform/settings";

type PlatformBrandingContextValue = {
	branding: PlatformBrandingResponse;
	loading: boolean;
	refresh: () => Promise<void>;
};

const defaultBranding: PlatformBrandingResponse = {
	displayName: DEFAULT_PLATFORM_DISPLAY_NAME,
	logoUrl: "",
};

const PlatformBrandingContext = createContext<PlatformBrandingContextValue>({
	branding: defaultBranding,
	loading: true,
	refresh: async () => {},
});

export function usePlatformBranding(): PlatformBrandingContextValue {
	return useContext(PlatformBrandingContext);
}

type PlatformBrandingProviderProps = {
	children: ReactNode;
};

export function PlatformBrandingProvider({ children }: PlatformBrandingProviderProps): ReactElement {
	const [branding, setBranding] = useState<PlatformBrandingResponse>(defaultBranding);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async (): Promise<void> => {
		try {
			const response = await fetch("/api/platform/settings", {
				credentials: "include",
			});

			if (!response.ok) {
				setBranding(defaultBranding);

				return;
			}

			const data = (await response.json()) as { branding?: PlatformBrandingResponse };
			setBranding(data.branding ?? defaultBranding);
		} catch {
			setBranding(defaultBranding);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		function handleSettingsUpdated(): void {
			void refresh();
		}

		window.addEventListener("platform-settings-updated", handleSettingsUpdated);

		return () => {
			window.removeEventListener("platform-settings-updated", handleSettingsUpdated);
		};
	}, [refresh]);

	const value = useMemo(
		() => ({
			branding,
			loading,
			refresh,
		}),
		[branding, loading, refresh],
	);

	return <PlatformBrandingContext.Provider value={value}>{children}</PlatformBrandingContext.Provider>;
}

export function notifyPlatformSettingsUpdated(): void {
	window.dispatchEvent(new Event("platform-settings-updated"));
}
