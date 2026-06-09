"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { resolveTenantHomeUrl } from "../../../../lib/tenant/resolveTenantHomeUrl";
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
	status: string;
};

type UserRelationshipsResponse = {
	businesses: UserBusiness[];
	establishments: [];
};

export function PlatformUserHomePlaceholder(): ReactElement {
	const [user, setUser] = useState<UserMeResponse["user"] | null>(null);
	const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const [meResponse, relationshipsResponse] = await Promise.all([
				fetch("/api/user/me", { credentials: "include" }),
				fetch("/api/user/me/relationships", { credentials: "include" }),
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
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	async function logout(): Promise<void> {
		await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
		window.location.assign("/u");
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando…</p>;
	}

	if (error || !user) {
		return <p className="text-sm text-error">{error ?? "Sesión no disponible"}</p>;
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<header className="flex flex-col gap-1">
				<p className="text-sm font-medium text-primary">Tu espacio</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {user.name}</h1>
				<p className="text-sm text-muted">{user.email}</p>
			</header>

			<section aria-labelledby="mis-negocios-heading" className="flex flex-col gap-3">
				<h2 id="mis-negocios-heading" className="text-lg font-semibold text-foreground">
					Mis negocios
				</h2>
				{businesses.length === 0 ? (
					<Card>
						<p className="text-sm text-muted">
							Aún no tienes un negocio registrado.{" "}
							<Link href="/u/register/business" className="font-medium text-primary hover:opacity-80">
								Registrar negocio
							</Link>
						</p>
					</Card>
				) : (
					<ul className="flex flex-col gap-3">
						{businesses.map((business) => (
							<li key={business.id}>
								<Card>
									<div className="flex flex-col gap-2">
										<p className="font-medium text-foreground">{business.name}</p>
										<p className="text-xs text-muted">{business.slug}</p>
										<a
											href={resolveTenantHomeUrl(business.slug)}
											className="text-sm font-medium text-primary hover:opacity-80"
										>
											Abrir panel del negocio
										</a>
									</div>
								</Card>
							</li>
						))}
					</ul>
				)}
			</section>

			<section aria-labelledby="mis-locales-heading" className="flex flex-col gap-3">
				<h2 id="mis-locales-heading" className="text-lg font-semibold text-foreground">
					Mis locales
				</h2>
				<Card>
					<p className="text-sm text-muted">
						Todavía no tienes locales vinculados. Escanea un QR en un establecimiento para empezar.
					</p>
				</Card>
			</section>

			<Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
				Cerrar sesión
			</Button>
		</main>
	);
}
