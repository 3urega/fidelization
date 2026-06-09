"use client";

import Link from "next/link";
import { type ReactElement } from "react";

import { PlatformUserQrPanel } from "../../../../_components/platform-app/PlatformUserQrPanel";

export function PlatformUserQrScreen(): ReactElement {
	return (
		<main className="flex flex-1 flex-col items-center gap-6 py-4">
			<Link href="/u/home" className="self-start text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<PlatformUserQrPanel />
		</main>
	);
}
