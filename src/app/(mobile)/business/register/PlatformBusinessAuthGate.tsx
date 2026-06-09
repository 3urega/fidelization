import Link from "next/link";

import { Button } from "../../../../_components/ui/Button";

type PlatformBusinessAuthGateProps = {
	registerHref: string;
	loginHref: string;
};

export function PlatformBusinessAuthGate({
	registerHref,
	loginHref,
}: PlatformBusinessAuthGateProps): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col justify-center gap-8 py-4">
			<header className="flex flex-col gap-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted">Paso 1 de 2</p>
				<h1 className="text-2xl font-semibold text-foreground">Registrar negocio</h1>
				<p className="text-sm text-muted">
					Primero identifícate con tu cuenta de la app. Después configurarás el perfil de tu negocio.
				</p>
			</header>

			<section aria-label="Autenticación" className="flex flex-col gap-3">
				<Link href={registerHref} className="block w-full">
					<Button type="button" className="w-full py-3">
						Crear cuenta
					</Button>
				</Link>
				<Link href={loginHref} className="block w-full">
					<Button type="button" variant="secondary" className="w-full py-3">
						Ya tengo cuenta — Iniciar sesión
					</Button>
				</Link>
			</section>
		</main>
	);
}
