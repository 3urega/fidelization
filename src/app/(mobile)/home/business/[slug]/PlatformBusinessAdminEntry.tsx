"use client";

import { useParams, useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../../lib/platform/routes";

export function PlatformBusinessAdminEntry(): ReactElement {
	const params = useParams();
	const router = useRouter();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function enter(): Promise<void> {
			if (!slug) {
				setError("Negocio no válido");

				return;
			}

			const response = await platformFetch(
				`/api/user/businesses/${encodeURIComponent(slug)}/enter`,
				{ method: "POST" },
			);
			const data = (await response.json()) as {
				redirectUrl?: string;
				error?: { description?: string };
			};

			if (cancelled) {
				return;
			}

			if (!response.ok || !data.redirectUrl) {
				setError(data.error?.description ?? "No se pudo abrir el panel del negocio");

				return;
			}

			window.location.assign(data.redirectUrl);
		}

		void enter();

		return () => {
			cancelled = true;
		};
	}, [slug, router]);

	if (error) {
		return (
			<main className="flex flex-1 flex-col gap-4 py-4">
				<p className="text-sm text-error">{error}</p>
				<button
					type="button"
					className="text-sm font-medium text-primary hover:opacity-80"
					onClick={() => router.replace(platformRoutes.home)}
				>
					← Volver al inicio
				</button>
			</main>
		);
	}

	return (
		<main className="flex flex-1 flex-col gap-4 py-4">
			<p className="text-sm text-muted">Abriendo panel del negocio…</p>
		</main>
	);
}
