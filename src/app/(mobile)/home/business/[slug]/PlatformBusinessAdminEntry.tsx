"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../../lib/platform/routes";
import { Button } from "../../../../_components/ui/Button";
import { Card } from "../../../../_components/ui/Card";

type UserBusiness = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlan: string;
	status: string;
};

type UserRelationshipsResponse = {
	businesses: UserBusiness[];
};

export function PlatformBusinessAdminEntry(): ReactElement {
	const params = useParams();
	const router = useRouter();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [business, setBusiness] = useState<UserBusiness | null>(null);
	const [loading, setLoading] = useState(true);
	const [entering, setEntering] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const response = await platformFetch("/api/user/me/relationships");
			if (cancelled) {
				return;
			}

			if (!response.ok) {
				setError("No se pudo cargar el negocio");
				setLoading(false);

				return;
			}

			const data = (await response.json()) as UserRelationshipsResponse;
			const match = data.businesses.find((row) => row.slug === slug) ?? null;

			if (!match) {
				router.replace(platformRoutes.home);

				return;
			}

			setBusiness(match);
			setLoading(false);
		}

		if (slug) {
			void load();
		}

		return () => {
			cancelled = true;
		};
	}, [slug, router]);

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (error || !business) {
		return <p className="text-sm text-error">{error ?? "Negocio no encontrado"}</p>;
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col gap-2">
				<p className="text-sm font-medium text-primary">Panel del negocio</p>
				<h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
				<p className="text-sm text-muted">{business.slug}</p>
			</header>

			<Card>
				<p className="font-medium text-foreground">{business.name}</p>
				<p className="text-xs text-muted">{business.slug}</p>
			</Card>

			<Card>
				<p className="text-sm text-muted">
					Gestiona sellos, promociones, empleados y más desde el panel web de tu negocio.
				</p>
			</Card>

			<Button
				type="button"
				className="w-full"
				disabled={entering}
				onClick={() => {
					void (async () => {
						setEntering(true);
						setError(null);

						const response = await platformFetch(
							`/api/user/businesses/${business.slug}/enter`,
							{ method: "POST" },
						);
						const data = (await response.json()) as {
							redirectUrl?: string;
							error?: { description?: string };
						};

						if (!response.ok || !data.redirectUrl) {
							setError(data.error?.description ?? "No se pudo abrir el panel del negocio");
							setEntering(false);

							return;
						}

						window.location.assign(data.redirectUrl);
					})();
				}}
			>
				{entering ? "Abriendo panel…" : "Abrir panel del negocio"}
			</Button>
		</main>
	);
}
