"use client";

import { usePathname } from "next/navigation";
import { type ReactElement, type ReactNode, useState } from "react";

import { PlatformBrandingProvider } from "./PlatformBrandingProvider";
import { PlatformSessionProvider } from "./PlatformSessionProvider";
import { PlatformSidebar } from "./PlatformSidebar";
import { PlatformTopBar } from "./PlatformTopBar";

type PlatformAdminShellProps = {
	children: ReactNode;
};

export function PlatformAdminShell({ children }: PlatformAdminShellProps): ReactElement {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	if (pathname === "/platform/login") {
		return <>{children}</>;
	}

	function closeMobile(): void {
		setMobileOpen(false);
	}

	return (
		<PlatformSessionProvider>
			<PlatformBrandingProvider>
				<div className="min-h-screen bg-background">
				<PlatformTopBar
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

				<PlatformSidebar mobileOpen={mobileOpen} onNavigate={closeMobile} />

				<div className="pt-14 md:pl-64">
					<main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">{children}</main>
				</div>
			</div>
			</PlatformBrandingProvider>
		</PlatformSessionProvider>
	);
}
