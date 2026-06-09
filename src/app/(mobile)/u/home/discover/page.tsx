import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "../../../../_components/ui/Card";

export const metadata: Metadata = {
	title: "Descubrir locales — App Fidelización",
};

export default function PlatformDiscoverPage(): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href="/u/home" className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">Descubrir locales</h1>
				<p className="text-sm text-muted">
					Próximamente podrás buscar establecimientos y unirte escaneando un QR. Mientras tanto, visita
					un local que use la plataforma y muestra tu QR de la app.
				</p>
			</header>

			<Card>
				<p className="text-sm text-muted">
					El flujo de unión a un local llegará en la siguiente fase del roadmap (#42).
				</p>
			</Card>
		</main>
	);
}
