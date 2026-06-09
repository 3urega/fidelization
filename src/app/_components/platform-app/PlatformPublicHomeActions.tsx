"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "../ui/Button";
import { platformRoutes } from "../../../lib/platform/routes";
import { PlatformAuthDivider } from "./PlatformAuthDivider";
import { PlatformGoogleSignInButton } from "./PlatformGoogleSignInButton";

export function PlatformPublicHomeActions(): ReactElement {
	return (
		<section aria-label="Acciones principales" className="flex flex-col gap-3">
			<PlatformGoogleSignInButton text="continue_with" />
			<PlatformAuthDivider label="o elige una opción" />
			<Link href={platformRoutes.register} className="block w-full">
				<Button type="button" className="w-full py-3">
					Registrarse
				</Button>
			</Link>
			<Link href={platformRoutes.registerBusiness} className="block w-full">
				<Button type="button" variant="secondary" className="w-full py-3">
					Registrar negocio
				</Button>
			</Link>
		</section>
	);
}
