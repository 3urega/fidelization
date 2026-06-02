"use client";

import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import { useTheme } from "../theme/ThemeProvider";
import { Button } from "../ui/Button";
import { useTenantSession } from "./TenantSessionProvider";

type TopBarProps = {
	mobileOpen: boolean;
	onMenuToggle: () => void;
};

export function TopBar({ mobileOpen, onMenuToggle }: TopBarProps): ReactElement {
	const router = useRouter();
	const { resetTheme } = useTheme();
	const { session, loading } = useTenantSession();

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		resetTheme();
		router.push("/login");
		router.refresh();
	}

	return (
		<header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
			<button
				type="button"
				className="inline-flex h-10 w-10 items-center justify-center rounded-theme border border-border text-foreground md:hidden"
				onClick={onMenuToggle}
				aria-expanded={mobileOpen}
				aria-controls="tenant-admin-sidebar"
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
				{loading ? "…" : session?.tenant.name ?? "Panel"}
			</p>

			<div className="ml-auto flex items-center gap-2">
				{session?.user.name ? (
					<span className="hidden text-sm text-muted sm:inline">{session.user.name}</span>
				) : null}
				<Button type="button" variant="secondary" onClick={() => void logout()}>
					Cerrar sesión
				</Button>
			</div>
		</header>
	);
}
