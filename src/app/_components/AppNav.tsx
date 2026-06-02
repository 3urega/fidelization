"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { useTheme } from "./theme/ThemeProvider";
import { Button } from "./ui/Button";

type MeResponse = {
	user: { name: string };
	tenant: { name: string };
};

export function AppNav(): ReactElement {
	const router = useRouter();
	const { resetTheme } = useTheme();
	const [session, setSession] = useState<MeResponse | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void fetch("/api/me", { credentials: "include" })
			.then((response) => (response.ok ? (response.json() as Promise<MeResponse>) : null))
			.then((data) => {
				setSession(data);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		resetTheme();
		setSession(null);
		router.push("/login");
		router.refresh();
	}

	return (
		<nav className="flex items-center gap-4 border-b border-border px-4 py-4 md:px-8">
			<strong className="mr-auto text-sm font-semibold text-foreground md:text-base">
				{session?.tenant.name ?? "Fidelización"}
			</strong>
			{loading ? null : session ? (
				<>
					<Link href="/home" className="text-sm text-muted hover:text-foreground">
						Inicio
					</Link>
					<Link href="/profile" className="text-sm text-muted hover:text-foreground">
						Perfil
					</Link>
					<Button type="button" variant="secondary" onClick={() => void logout()}>
						Cerrar sesión
					</Button>
				</>
			) : null}
		</nav>
	);
}
