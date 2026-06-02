import Link from "next/link";
import type { ReactElement } from "react";

export function AuthNav(): ReactElement {
	return (
		<nav className="flex items-center border-b border-border px-4 py-4 md:px-8">
			<Link href="/" className="text-sm text-muted hover:text-foreground">
				← Volver al inicio
			</Link>
		</nav>
	);
}
