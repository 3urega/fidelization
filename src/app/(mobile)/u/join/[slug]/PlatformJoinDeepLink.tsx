"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../../../lib/platform/apiUrl";

type JoinState = "loading" | "error";

export function PlatformJoinDeepLink(): ReactElement {
	const params = useParams();
	const router = useRouter();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [state, setState] = useState<JoinState>("loading");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function join(): Promise<void> {
			if (!slug) {
				setState("error");
				setError("Local no válido");

				return;
			}

			const response = await platformFetch("/api/user/establishments/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug }),
			});

			if (cancelled) {
				return;
			}

			if (!response.ok) {
				const body = (await response.json()) as { error?: { description?: string } };
				setState("error");
				setError(body.error?.description ?? "No se pudo unir al local");

				return;
			}

			router.replace("/u/home");
		}

		void join();

		return () => {
			cancelled = true;
		};
	}, [slug, router]);

	if (state === "loading") {
		return <p className="text-sm text-muted">Uniéndote a {slug}…</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-error">{error ?? "No se pudo unir al local"}</p>
			<Link href="/u/home" className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>
		</div>
	);
}
