"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { PlatformNavIcon } from "./PlatformNavIcon";
import { platformNav } from "./platformNavItems";
import { usePlatformBranding } from "./PlatformBrandingProvider";
import { usePlatformSession } from "./PlatformSessionProvider";

type PlatformSidebarProps = {
	mobileOpen: boolean;
	onNavigate: () => void;
};

function isNavItemActive(pathname: string, href: string): boolean {
	if (href === "/platform") {
		return pathname === "/platform";
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformSidebar({ mobileOpen, onNavigate }: PlatformSidebarProps): ReactElement {
	const pathname = usePathname();
	const { session, loading } = usePlatformSession();
	const { branding, loading: brandingLoading } = usePlatformBranding();
	const [openModerationCount, setOpenModerationCount] = useState(0);

	const loadModerationSummary = useCallback(async (): Promise<void> => {
		try {
			const response = await fetch("/api/platform/moderation/summary", {
				credentials: "include",
			});

			if (!response.ok) {
				setOpenModerationCount(0);

				return;
			}

			const data = (await response.json()) as { openCount?: number };
			setOpenModerationCount(data.openCount ?? 0);
		} catch {
			setOpenModerationCount(0);
		}
	}, []);

	useEffect(() => {
		void loadModerationSummary();
	}, [loadModerationSummary]);

	useEffect(() => {
		function handleModerationUpdated(): void {
			void loadModerationSummary();
		}

		window.addEventListener("platform-moderation-updated", handleModerationUpdated);

		return () => {
			window.removeEventListener("platform-moderation-updated", handleModerationUpdated);
		};
	}, [loadModerationSummary]);

	return (
		<aside
			id="platform-admin-sidebar"
			className={[
				"fixed bottom-0 left-0 top-14 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 md:translate-x-0",
				mobileOpen ? "translate-x-0" : "-translate-x-full",
			].join(" ")}
			aria-label="Menú de plataforma"
		>
			<div className="flex items-center gap-3 border-b border-border px-4 py-4">
				{branding.logoUrl.trim() ? (
					<img
						src={branding.logoUrl}
						alt=""
						className="h-9 w-9 rounded-theme border border-border object-contain"
					/>
				) : (
					<span
						className="flex h-9 w-9 items-center justify-center rounded-theme bg-primary text-sm font-semibold text-primary-foreground"
						aria-hidden
					>
						{branding.displayName.charAt(0).toUpperCase()}
					</span>
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">
						{brandingLoading ? "…" : branding.displayName}
					</p>
					<p className="truncate text-xs text-muted">
						{loading ? "Cargando…" : session?.user.email ?? "Superadmin"}
					</p>
				</div>
			</div>

			<nav className="flex flex-1 flex-col gap-1 p-3">
				{platformNav.map((item) => {
					const active = isNavItemActive(pathname, item.href);

					if (item.comingSoon) {
						return (
							<span
								key={item.href}
								className="flex cursor-not-allowed items-center gap-3 rounded-theme px-3 py-2 text-sm font-medium text-muted/60"
								aria-disabled="true"
								title="Próximamente"
							>
								<PlatformNavIcon icon={item.icon} />
								<span className="flex-1">{item.label}</span>
								<span className="rounded-theme bg-border/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
									Pronto
								</span>
							</span>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onNavigate}
							className={[
								"flex items-center gap-3 rounded-theme px-3 py-2 text-sm font-medium transition-colors",
								active
									? "bg-primary text-primary-foreground"
									: "text-muted hover:bg-border/40 hover:text-foreground",
							].join(" ")}
							aria-current={active ? "page" : undefined}
						>
							<PlatformNavIcon icon={item.icon} />
							<span className="flex-1">{item.label}</span>
							{item.badgeSummary && openModerationCount > 0 ? (
								<span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-error px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
									{openModerationCount}
								</span>
							) : null}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
