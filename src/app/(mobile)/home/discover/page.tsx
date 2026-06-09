import Link from "next/link";
import type { Metadata } from "next";

import { platformRoutes } from "../../../../lib/platform/routes";
import { PlatformDiscoverJoinForm } from "./PlatformDiscoverJoinForm";

export const metadata: Metadata = {
	title: "Descubrir locales — App Fidelización",
};

export default function PlatformDiscoverPage(): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">Descubrir locales</h1>
				<p className="text-sm text-muted">
					Introduce el identificador de un local para unirte. También puedes escanear un QR del
					escaparate que te lleve a esta app.
				</p>
			</header>

			<PlatformDiscoverJoinForm />
		</main>
	);
}
