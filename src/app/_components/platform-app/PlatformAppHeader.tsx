import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { platformRoutes } from "../../../lib/platform/routes";

type PlatformAppHeaderProps = {
	eyebrow?: string;
	title: ReactNode;
	subtitle?: ReactNode;
};

function PlatformUserProfileIcon(): ReactElement {
	return (
		<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
			/>
		</svg>
	);
}

export function PlatformAppHeader({
	eyebrow,
	title,
	subtitle,
}: PlatformAppHeaderProps): ReactElement {
	return (
		<header className="flex items-start justify-between gap-3">
			<div className="flex min-w-0 flex-col gap-1">
				{eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
				<h1 className="text-2xl font-semibold text-foreground">{title}</h1>
				{subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
			</div>

			<nav
				className="flex shrink-0 items-center gap-2"
				aria-label="Acciones rápidas"
			>
				<Link
					href={platformRoutes.homeMap}
					className="text-sm font-medium text-primary hover:opacity-80"
				>
					Ver en el mapa
				</Link>
				<Link
					href={platformRoutes.homeProfile()}
					aria-label="Perfil"
					className="rounded-theme p-1 text-primary hover:bg-primary/10"
				>
					<PlatformUserProfileIcon />
				</Link>
			</nav>
		</header>
	);
}
