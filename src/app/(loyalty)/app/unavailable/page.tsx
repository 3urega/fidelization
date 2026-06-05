import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "../../../_components/ui/Button";
import { Card } from "../../../_components/ui/Card";

export default function CustomerAppUnavailablePage(): ReactElement {
	return (
		<Card>
			<div className="flex flex-col gap-4 text-center">
				<h1 className="text-2xl font-semibold text-foreground">Enlace del negocio requerido</h1>
				<p className="text-sm text-muted">
					La app de fidelización solo está disponible desde el enlace de tu negocio (por ejemplo,
					cafe-demo.localhost). Pide al establecimiento el enlace correcto o escanea su código QR.
				</p>
				<Link href="/">
					<Button type="button" className="w-full">
						Ir al inicio
					</Button>
				</Link>
			</div>
		</Card>
	);
}
