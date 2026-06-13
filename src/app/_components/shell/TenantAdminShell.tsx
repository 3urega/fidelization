"use client";

import { type ReactElement, type ReactNode, useState } from "react";

import { PlatformImpersonationBanner } from "./PlatformImpersonationBanner";
import { Sidebar } from "./Sidebar";
import { TenantSessionProvider, useTenantSession } from "./TenantSessionProvider";
import { TopBar } from "./TopBar";

type TenantAdminShellProps = {
	children: ReactNode;
};

export function TenantAdminShell({ children }: TenantAdminShellProps): ReactElement {
	const [mobileOpen, setMobileOpen] = useState(false);

	function closeMobile(): void {
		setMobileOpen(false);
	}

	return (
		<TenantSessionProvider>
			<TenantAdminShellLayout
				mobileOpen={mobileOpen}
				onCloseMobile={closeMobile}
				onToggleMobile={() => {
					setMobileOpen((open) => !open);
				}}
			>
				{children}
			</TenantAdminShellLayout>
		</TenantSessionProvider>
	);
}

function TenantAdminShellLayout({
	children,
	mobileOpen,
	onCloseMobile,
	onToggleMobile,
}: {
	children: ReactNode;
	mobileOpen: boolean;
	onCloseMobile: () => void;
	onToggleMobile: () => void;
}): ReactElement {
	const { session } = useTenantSession();
	const impersonating = Boolean(session?.impersonation?.active);

	return (
		<div className="min-h-screen bg-background">
			<PlatformImpersonationBanner />
			<TopBar mobileOpen={mobileOpen} onMenuToggle={onToggleMobile} />

			{mobileOpen ? (
				<button
					type="button"
					className={`fixed inset-0 ${impersonating ? "top-24" : "top-14"} z-30 bg-foreground/20 md:hidden`}
					aria-label="Cerrar menú"
					onClick={onCloseMobile}
				/>
			) : null}

			<Sidebar mobileOpen={mobileOpen} onNavigate={onCloseMobile} />

			<div className={`${impersonating ? "pt-24" : "pt-14"} md:pl-64`}>
				<main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">{children}</main>
			</div>
		</div>
	);
}
