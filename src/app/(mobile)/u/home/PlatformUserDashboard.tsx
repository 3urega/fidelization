"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../lib/platform/apiUrl";
import {
	BusinessSummaryCard,
	DualEmptyRelationshipsCard,
	EstablishmentSummaryCard,
} from "../../../_components/platform-app/PlatformRelationshipCards";
import { Button } from "../../../_components/ui/Button";
import { Card } from "../../../_components/ui/Card";

type UserMeResponse = {
	user: { id: string; name: string; email: string };
	kind: "user";
};

type UserBusiness = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlan: string;
	status: string;
};

type UserEstablishment = {
	customerId: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	pointsBalance: number;
	visitsCount: number;
};

type UserRelationshipsResponse = {
	businesses: UserBusiness[];
	establishments: UserEstablishment[];
};

export function PlatformUserDashboard(): ReactElement {
	const [user, setUser] = useState<UserMeResponse["user"] | null>(null);
	const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
	const [establishments, setEstablishments] = useState<UserEstablishment[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const [meResponse, relationshipsResponse] = await Promise.all([
				platformFetch("/api/user/me"),
				platformFetch("/api/user/me/relationships"),
			]);

			if (cancelled) {
				return;
			}

			if (!meResponse.ok || !relationshipsResponse.ok) {
				setError("No se pudo cargar tu sesión");
				setLoading(false);

				return;
			}

			const meData = (await meResponse.json()) as UserMeResponse;
			const relationshipsData = (await relationshipsResponse.json()) as UserRelationshipsResponse;
			setUser(meData.user);
			setBusinesses(relationshipsData.businesses);
			setEstablishments(relationshipsData.establishments);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	async function logout(): Promise<void> {
		await platformFetch("/api/auth/logout", { method: "POST" });
		window.location.assign("/u");
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (error || !user) {
		return <p className="text-sm text-error">{error ?? "Sesión no disponible"}</p>;
	}

	const hasNoRelationships = businesses.length === 0 && establishments.length === 0;

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<header className="flex flex-col gap-1">
				<p className="text-sm font-medium text-primary">Tu espacio</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {user.name}</h1>
				<p className="text-sm text-muted">{user.email}</p>
			</header>

			{hasNoRelationships ? <DualEmptyRelationshipsCard /> : null}

			<section aria-labelledby="mis-negocios-heading" className="flex flex-col gap-3">
				<h2 id="mis-negocios-heading" className="text-lg font-semibold text-foreground">
					Mis negocios
				</h2>
				{businesses.length === 0 ? (
					hasNoRelationships ? null : (
						<Card>
							<p className="text-sm text-muted">
								Aún no tienes un negocio registrado.{" "}
								<Link
									href="/u/register/business"
									className="font-medium text-primary hover:opacity-80"
								>
									Registrar negocio
								</Link>
							</p>
						</Card>
					)
				) : (
					<ul className="flex flex-col gap-3">
						{businesses.map((business) => (
							<li key={business.id}>
								<BusinessSummaryCard business={business} />
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby="mis-locales-heading" className="flex flex-col gap-3">
				<h2 id="mis-locales-heading" className="text-lg font-semibold text-foreground">
					Mis locales
				</h2>
				{establishments.length === 0 ? (
					hasNoRelationships ? null : (
						<Card>
							<p className="text-sm text-muted">
								Todavía no tienes locales con actividad.{" "}
								<Link href="/u/home/discover" className="font-medium text-primary hover:opacity-80">
									Descubrir locales
								</Link>
							</p>
						</Card>
					)
				) : (
					<ul className="flex flex-col gap-3">
						{establishments.map((establishment) => (
							<li key={establishment.customerId}>
								<EstablishmentSummaryCard establishment={establishment} />
							</li>
						))}
					</ul>
				)}
			</section>

			<Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
				Cerrar sesión
			</Button>
		</main>
	);
}
