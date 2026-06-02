"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement } from "react";

import { NavIcon } from "./NavIcon";
import { tenantAdminNav } from "./navItems";
import { useTenantSession } from "./TenantSessionProvider";

type SidebarProps = {
	mobileOpen: boolean;
	onNavigate: () => void;
};

export function Sidebar({ mobileOpen, onNavigate }: SidebarProps): ReactElement {
	const pathname = usePathname();
	const { session, loading } = useTenantSession();

	const tenantName = session?.tenant.name ?? "Fidelización";
	const logoUrl = session?.tenant.logoUrl.trim();

	return (
		<aside
			id="tenant-admin-sidebar"
			className={[
				"fixed bottom-0 left-0 top-14 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 md:translate-x-0",
				mobileOpen ? "translate-x-0" : "-translate-x-full",
			].join(" ")}
			aria-label="Menú principal"
		>
			<div className="flex items-center gap-3 border-b border-border px-4 py-4">
				{logoUrl ? (
					// eslint-disable-next-line @next/next/no-img-element -- tenant logo URL from API
					<img src={logoUrl} alt="" className="h-9 w-9 rounded-theme object-cover" />
				) : (
					<span
						className="flex h-9 w-9 items-center justify-center rounded-theme bg-primary text-sm font-semibold text-primary-foreground"
						aria-hidden
					>
						{loading ? "…" : tenantName.charAt(0).toUpperCase()}
					</span>
				)}
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">
						{loading ? "Cargando…" : tenantName}
					</p>
					{session?.tenant.slug ? (
						<p className="truncate text-xs text-muted">{session.tenant.slug}</p>
					) : null}
				</div>
			</div>

			<nav className="flex flex-1 flex-col gap-1 p-3">
				{tenantAdminNav.map((item) => {
					const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

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
							<NavIcon icon={item.icon} />
							{item.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
