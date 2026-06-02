import Link from "next/link";

import { Button } from "../../_components/ui/Button";

export default function TenantNotFoundPage(): React.ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16 text-center">
			<h1 className="text-2xl font-semibold text-foreground">Negocio no encontrado</h1>
			<p className="text-sm text-muted">
				El subdominio no corresponde a ningún negocio registrado en la plataforma.
			</p>
			<Link href="/">
				<Button type="button" className="w-full">
					Ir al inicio
				</Button>
			</Link>
		</main>
	);
}
