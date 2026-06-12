"use client";

import { useRouter } from "next/navigation";
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

import { useTheme } from "../theme/ThemeProvider";

export type TenantSessionUser = {
	id: string;
	name: string;
	email: string;
	profilePicture: string;
	plan: string;
};

export type TenantSessionTenant = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	subscriptionPlan: string;
	subscriptionPlanId: string | null;
	address: string;
	description: string;
	coverImageUrl: string;
	discoveryTags: string[];
};

export type TenantSessionData = {
	user: TenantSessionUser;
	tenant: TenantSessionTenant;
	role: string;
	planFeatures: string[];
};

type TenantSessionContextValue = {
	session: TenantSessionData | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

const TenantSessionContext = createContext<TenantSessionContextValue | null>(null);

export function TenantSessionProvider({ children }: { children: ReactNode }): ReactElement {
	const router = useRouter();
	const { applyTheme } = useTheme();
	const [session, setSession] = useState<TenantSessionData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const response = await fetch("/api/me", { credentials: "include" });
		if (response.status === 401) {
			setSession(null);
			setError(null);
			router.push("/login");

			return;
		}
		if (!response.ok) {
			setError("No se pudo cargar la sesión");
			setSession(null);

			return;
		}

		const data = (await response.json()) as TenantSessionData;
		setSession({
			...data,
			planFeatures: data.planFeatures ?? [],
		});
		setError(null);
		applyTheme({
			primaryColor: data.tenant.primaryColor,
			secondaryColor: data.tenant.secondaryColor,
		});
	}, [applyTheme, router]);

	useEffect(() => {
		setLoading(true);
		void refresh().finally(() => {
			setLoading(false);
		});
	}, [refresh]);

	const value = useMemo(
		() => ({
			session,
			loading,
			error,
			refresh,
		}),
		[session, loading, error, refresh],
	);

	return <TenantSessionContext.Provider value={value}>{children}</TenantSessionContext.Provider>;
}

export function useTenantSession(): TenantSessionContextValue {
	const context = useContext(TenantSessionContext);
	if (!context) {
		throw new Error("useTenantSession must be used within TenantSessionProvider");
	}

	return context;
}
