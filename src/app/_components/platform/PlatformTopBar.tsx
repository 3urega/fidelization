"use client";

import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import { Button } from "../ui/Button";
import { usePlatformBranding } from "./PlatformBrandingProvider";
import { usePlatformSession } from "./PlatformSessionProvider";

type PlatformTopBarProps = {
	mobileOpen: boolean;
	onMenuToggle: () => void;
};

export function PlatformTopBar({ mobileOpen, onMenuToggle }: PlatformTopBarProps): ReactElement {
	const router = useRouter();
	const { session, loading } = usePlatformSession();
	const { branding, loading: brandingLoading } = usePlatformBranding();

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		router.push("/platform/login");
		router.refresh();
	}

	return (
		<header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
			<button
				type="button"
				className="inline-flex h-10 w-10 items-center justify-center rounded-theme border border-border text-foreground md:hidden"
				onClick={onMenuToggle}
				aria-expanded={mobileOpen}
				aria-controls="platform-admin-sidebar"
			>
				<span className="sr-only">Abrir menú</span>
				<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<p className="truncate text-sm font-semibold text-foreground md:hidden">
				{brandingLoading ? "…" : branding.displayName}
			</p>

			<div className="ml-auto flex items-center gap-2">
				{session?.user.name ? (
					<span className="hidden text-sm text-muted sm:inline">{session.user.name}</span>
				) : loading ? (
					<span className="hidden text-sm text-muted sm:inline">…</span>
				) : null}
				<Button type="button" variant="secondary" onClick={() => void logout()}>
					Cerrar sesión
				</Button>
			</div>
		</header>
	);
}
