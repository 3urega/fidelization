"use client";

import { type ReactElement, type ReactNode, useState } from "react";

import { Sidebar } from "./Sidebar";
import { TenantSessionProvider } from "./TenantSessionProvider";
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
			<div className="min-h-screen bg-background">
				<TopBar
					mobileOpen={mobileOpen}
					onMenuToggle={() => {
						setMobileOpen((open) => !open);
					}}
				/>

				{mobileOpen ? (
					<button
						type="button"
						className="fixed inset-0 top-14 z-30 bg-foreground/20 md:hidden"
						aria-label="Cerrar menú"
						onClick={closeMobile}
					/>
				) : null}

				<Sidebar mobileOpen={mobileOpen} onNavigate={closeMobile} />

				<div className="pt-14 md:pl-64">
					<main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">{children}</main>
				</div>
			</div>
		</TenantSessionProvider>
	);
}
