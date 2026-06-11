import Link from "next/link";
import type { Metadata } from "next";

import { EstablishmentDiscoverGrid } from "../../../_components/platform-app/EstablishmentDiscoverGrid";
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
					Explora todos los establecimientos o introduce un identificador para unirte directamente.
				</p>
			</header>

			<EstablishmentDiscoverGrid showHeading={false} />

			<section aria-labelledby="join-by-slug-heading" className="flex flex-col gap-3 border-t border-border pt-6">
				<h2 id="join-by-slug-heading" className="text-sm font-medium text-foreground">
					Unirse por identificador
				</h2>
				<PlatformDiscoverJoinForm />
			</section>
		</main>
	);
}
