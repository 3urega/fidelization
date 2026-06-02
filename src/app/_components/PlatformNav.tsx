"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactElement } from "react";

import { Button } from "./ui/Button";

export function PlatformNav(): ReactElement | null {
	const pathname = usePathname();
	const router = useRouter();

	if (pathname === "/platform/login") {
		return null;
	}

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		router.push("/platform/login");
		router.refresh();
	}

	return (
		<nav className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
			<Link href="/platform" className="font-medium text-foreground">
				Plataforma
			</Link>
			<Button type="button" variant="secondary" onClick={() => void logout()}>
				Cerrar sesión
			</Button>
		</nav>
	);
}
