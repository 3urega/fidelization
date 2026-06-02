import Link from "next/link";

import { Button } from "./_components/ui/Button";
import { Card } from "./_components/ui/Card";

export default function LandingPage(): React.ReactElement {
	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
			<section className="flex flex-col gap-4">
				<p className="text-sm font-medium text-primary">Fidelización SaaS</p>
				<h1 className="text-3xl font-semibold text-foreground md:text-4xl">
					Fideliza clientes en tu cafetería o negocio local
				</h1>
				<p className="text-base text-muted">
					Puntos, sellos, promociones y QR en una sola plataforma multi-tenant pensada para
					hostelería pequeña.
				</p>
				<div className="flex flex-col gap-3 sm:flex-row">
					<Link href="/register">
						<Button className="w-full sm:w-auto">Crear cuenta</Button>
					</Link>
					<Link href="/login">
						<Button variant="secondary" className="w-full sm:w-auto">
							Iniciar sesión
						</Button>
					</Link>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<h2 className="font-medium text-foreground">QR + sellos</h2>
					<p className="mt-2 text-sm text-muted">Registra visitas sin tarjetas físicas.</p>
				</Card>
				<Card>
					<h2 className="font-medium text-foreground">Promociones</h2>
					<p className="mt-2 text-sm text-muted">Activa campañas por tenant cuando quieras.</p>
				</Card>
				<Card>
					<h2 className="font-medium text-foreground">Multi-tenant</h2>
					<p className="mt-2 text-sm text-muted">Branding y datos aislados por negocio.</p>
				</Card>
			</section>
		</main>
	);
}
