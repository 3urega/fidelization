"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "../ui/Button";
import { platformRoutes } from "../../../lib/platform/routes";
import { PlatformAuthDivider } from "./PlatformAuthDivider";
import { PlatformGoogleSignInButton } from "./PlatformGoogleSignInButton";

export function PlatformPublicHomeActions(): ReactElement {
	return (
		<div className="flex flex-col gap-8">
			<section aria-label="Acciones principales" className="flex flex-col gap-4">
				<Link href={platformRoutes.register} className="block w-full">
					<Button type="button" className="w-full py-3 text-base">
						Empezar
					</Button>
				</Link>

				<p className="text-center text-sm text-muted">
					¿Ya tienes cuenta?{" "}
					<Link href={platformRoutes.login} className="font-medium text-primary hover:opacity-80">
						Iniciar sesión
					</Link>
				</p>

				<PlatformAuthDivider label="o continúa con Google" />
				<PlatformGoogleSignInButton text="continue_with" />
			</section>

			<section
				aria-label="Programa de fidelización para negocios"
				className="flex flex-col gap-3 border-t border-border pt-8"
			>
				<div className="flex flex-col gap-1 text-center">
					<p className="text-sm font-medium text-foreground">¿Tienes un negocio?</p>
					<p className="text-sm text-muted">
						Crea tu programa de fidelización en menos de 5 minutos.
					</p>
				</div>
				<Link href={platformRoutes.registerBusiness} className="block w-full">
					<Button type="button" variant="secondary" className="w-full py-3">
						Registrar negocio
					</Button>
				</Link>
			</section>
		</div>
	);
}
