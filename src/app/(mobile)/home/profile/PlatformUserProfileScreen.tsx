"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../lib/platform/apiUrl";
import type { UserSearchZoneJson } from "../../../../lib/platform/resolveSearchZoneMapInitialDraft";
import {
	parsePlatformProfileTab,
	platformRoutes,
	type PlatformProfileTab,
} from "../../../../lib/platform/routes";
import {
	PlatformUserProfilePersonalTab,
} from "./PlatformUserProfilePersonalTab";
import { PlatformUserStampCardsTab } from "./PlatformUserStampCardsTab";

type UserMeResponse = {
	user: {
		id: string;
		name: string;
		email: string;
		qrValue: string | null;
		searchZone: UserSearchZoneJson | null;
	};
	kind: "user";
};

type PlatformUserProfileScreenProps = {
	initialTab?: PlatformProfileTab;
};

function parseProfileTab(value: string | null): PlatformProfileTab {
	return parsePlatformProfileTab(value);
}

export function PlatformUserProfileScreen({
	initialTab = "personal",
}: PlatformUserProfileScreenProps): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [user, setUser] = useState<UserMeResponse["user"] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<PlatformProfileTab>(initialTab);

	useEffect(() => {
		setActiveTab(parseProfileTab(searchParams.get("tab")));
	}, [searchParams]);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const response = await platformFetch("/api/user/me");

			if (cancelled) {
				return;
			}

			if (!response.ok) {
				setError("No se pudo cargar tu perfil");
				setLoading(false);

				return;
			}

			const data = (await response.json()) as UserMeResponse;
			setUser(data.user);
			setError(null);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	function selectTab(tab: PlatformProfileTab): void {
		setActiveTab(tab);
		router.replace(platformRoutes.homeProfile(tab), { scroll: false });
	}

	const tabButtonClass = (tab: PlatformProfileTab): string =>
		[
			"rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
			activeTab === tab
				? "border-primary bg-primary/10 text-primary"
				: "border-border bg-surface text-muted hover:text-foreground",
		].join(" ");

	if (error) {
		return (
			<main className="flex flex-1 flex-col gap-4 py-4">
				<p className="text-sm text-error">{error}</p>
				<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
			</main>
		);
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-foreground">Tu perfil</h1>
				{loading ? (
					<p className="text-sm text-muted">Cargando…</p>
				) : user ? (
					<p className="text-sm text-muted">{user.email}</p>
				) : null}
			</header>

			<div
				className="flex flex-wrap gap-2 border-b border-border pb-4"
				role="tablist"
				aria-label="Secciones del perfil"
			>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "personal"}
					className={tabButtonClass("personal")}
					onClick={() => selectTab("personal")}
				>
					Información personal
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "tarjetas"}
					className={tabButtonClass("tarjetas")}
					onClick={() => selectTab("tarjetas")}
				>
					Mis tarjetas
				</button>
			</div>

			<div role="tabpanel">
				{activeTab === "tarjetas" ? (
					<PlatformUserStampCardsTab />
				) : !user && !loading ? (
					<p className="text-sm text-error">Sesión no disponible</p>
				) : (
					<PlatformUserProfilePersonalTab
						name={user?.name ?? "…"}
						email={user?.email ?? "…"}
						searchZone={user?.searchZone ?? null}
					/>
				)}
			</div>
		</main>
	);
}
