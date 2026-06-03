import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "./ui/Button";

export function PublicNav(): ReactElement {
	return (
		<nav className="flex items-center gap-4 border-b border-border px-4 py-4 md:px-8">
			<Link href="/" className="mr-auto text-sm font-semibold text-foreground md:text-base">
				Fidelización
			</Link>
			<Link href="/login" className="text-sm text-muted hover:text-foreground">
				Iniciar sesión
			</Link>
			<Link href="/register/business">
				<Button type="button" className="text-sm">
					Crear cuenta
				</Button>
			</Link>
		</nav>
	);
}
