import Link from "next/link";
import type { Metadata } from "next";

import { PlatformGoogleOAuthEnabledMarker } from "../../_components/platform-app/PlatformGoogleOAuthEnabledMarker";
import { PlatformPublicHomeActions } from "../../_components/platform-app/PlatformPublicHomeActions";

export const metadata: Metadata = {
	title: "App — Fidelización",
	description: "Regístrate, descubre locales o crea tu negocio en la plataforma de fidelización.",
};

export default function PlatformAppPublicHomePage(): React.ReactElement {
	return (
		<main className="flex flex-1 flex-col justify-center gap-10 py-6">
			<PlatformGoogleOAuthEnabledMarker />
			<header className="flex flex-col items-center gap-3 text-center">
				<div
					aria-hidden
					className="flex h-16 w-16 items-center justify-center rounded-theme border border-border bg-background text-xl font-semibold text-primary"
				>
					3
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium text-primary">3urega</p>
					<h1 className="text-2xl font-semibold text-foreground">Tu fidelización, en un solo lugar</h1>
					<p className="text-sm text-muted">
						Acumula puntos en tus locales favoritos o gestiona el programa de tu negocio.
					</p>
				</div>
			</header>

			<PlatformPublicHomeActions />

			<p className="text-center text-sm text-muted">
				¿Ya tienes cuenta?{" "}
				<Link href="/u/login" className="font-medium text-primary hover:opacity-80">
					Iniciar sesión
				</Link>
			</p>
		</main>
	);
}
