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

export type PlatformSessionUser = {
	id: string;
	name: string;
	email: string;
	profilePicture: string;
	plan: string;
};

export type PlatformSessionData = {
	user: PlatformSessionUser;
	role: string;
	kind: string;
};

type PlatformSessionContextValue = {
	session: PlatformSessionData | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

const PlatformSessionContext = createContext<PlatformSessionContextValue | null>(null);

export function PlatformSessionProvider({ children }: { children: ReactNode }): ReactElement {
	const router = useRouter();
	const [session, setSession] = useState<PlatformSessionData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		const response = await fetch("/api/platform/me", { credentials: "include" });
		if (response.status === 401) {
			setSession(null);
			setError(null);
			router.push("/platform/login");

			return;
		}
		if (!response.ok) {
			setError("No se pudo cargar la sesión");
			setSession(null);

			return;
		}

		const data = (await response.json()) as PlatformSessionData;
		setSession(data);
		setError(null);
	}, [router]);

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

	return (
		<PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>
	);
}

export function usePlatformSession(): PlatformSessionContextValue {
	const context = useContext(PlatformSessionContext);
	if (!context) {
		throw new Error("usePlatformSession must be used within PlatformSessionProvider");
	}

	return context;
}
