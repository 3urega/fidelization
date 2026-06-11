"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { platformRoutes, parsePlatformHomeTab, type PlatformHomeTab } from "../../../lib/platform/routes";
import { PlatformUserQrModal } from "../../_components/platform-app/PlatformUserQrModal";
import { BusinessSummaryCard } from "../../_components/platform-app/BusinessSummaryCard";
import { EstablishmentDiscoverGrid } from "../../_components/platform-app/EstablishmentDiscoverGrid";
import { EstablishmentSummaryCard } from "../../_components/platform-app/PlatformRelationshipCards";
import { Button } from "../../_components/ui/Button";
import { Card } from "../../_components/ui/Card";
import { PlatformDiscoverJoinForm } from "./discover/PlatformDiscoverJoinForm";

type UserMeResponse = {
	user: { id: string; name: string; email: string; qrValue: string | null };
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
	stampProgress: {
		campaignId: string;
		campaignName: string;
		current: number;
		required: number;
		completed: boolean;
	}[];
};

type UserRelationshipsResponse = {
	businesses: UserBusiness[];
	establishments: UserEstablishment[];
};

function parseHomeTab(value: string | null): PlatformHomeTab {
	return parsePlatformHomeTab(value);
}

type PlatformUserDashboardProps = {
	initialTab?: PlatformHomeTab;
};

export function PlatformUserDashboard({
	initialTab = "explore",
}: PlatformUserDashboardProps): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [user, setUser] = useState<UserMeResponse["user"] | null>(null);
	const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
	const [establishments, setEstablishments] = useState<UserEstablishment[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<PlatformHomeTab>(initialTab);

	const refreshRelationships = useCallback(async (): Promise<void> => {
		const relationshipsResponse = await platformFetch("/api/user/me/relationships");

		if (!relationshipsResponse.ok) {
			return;
		}

		const relationshipsData = (await relationshipsResponse.json()) as UserRelationshipsResponse;
		setBusinesses(relationshipsData.businesses);
		setEstablishments(relationshipsData.establishments);
	}, []);

	useEffect(() => {
		setActiveTab(parseHomeTab(searchParams.get("tab")));
	}, [searchParams]);

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

	function selectTab(tab: PlatformHomeTab): void {
		setActiveTab(tab);
		router.replace(platformRoutes.homeTab(tab), { scroll: false });
	}

	async function logout(): Promise<void> {
		await platformFetch("/api/auth/logout", { method: "POST" });
		window.location.assign(platformRoutes.publicHome);
	}

	const tabButtonClass = (tab: PlatformHomeTab): string =>
		[
			"rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
			activeTab === tab
				? "border-primary bg-primary/10 text-primary"
				: "border-border bg-surface text-muted hover:text-foreground",
		].join(" ");

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (!loading && !user) {
		return <p className="text-sm text-error">Sesión no disponible</p>;
	}

	const displayName = user?.name ?? "…";
	const displayEmail = user?.email ?? "";
	const qrValue = user?.qrValue ?? null;

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<header className="flex flex-col gap-1">
				<p className="text-sm font-medium text-primary">Tu espacio</p>
				<h1 className="text-2xl font-semibold text-foreground">Hola, {displayName}</h1>
				{displayEmail ? <p className="text-sm text-muted">{displayEmail}</p> : null}
			</header>

			<Button
				type="button"
				className="w-full"
				disabled={loading || !qrValue}
				onClick={() => {
					setQrModalOpen(true);
				}}
			>
				Mostrar mi QR
			</Button>

			{user ? (
				<PlatformUserQrModal
					open={qrModalOpen}
					onClose={() => {
						setQrModalOpen(false);
					}}
					name={user.name}
					qrValue={user.qrValue}
				/>
			) : null}

			<div
				className="flex flex-wrap gap-2 border-b border-border pb-4"
				role="tablist"
				aria-label="Secciones del inicio"
			>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "explore"}
					className={tabButtonClass("explore")}
					onClick={() => selectTab("explore")}
				>
					Explorar
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "locales"}
					className={tabButtonClass("locales")}
					onClick={() => selectTab("locales")}
				>
					Mis locales
					{establishments.length > 0 ? (
						<span className="ml-1.5 text-xs opacity-80">({establishments.length})</span>
					) : null}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === "negocios"}
					className={tabButtonClass("negocios")}
					onClick={() => selectTab("negocios")}
				>
					Mis negocios
					{businesses.length > 0 ? (
						<span className="ml-1.5 text-xs opacity-80">({businesses.length})</span>
					) : null}
				</button>
			</div>

			<div role="tabpanel">
				{activeTab === "explore" ? (
					<EstablishmentDiscoverGrid showHeading={false} />
				) : null}

				{activeTab === "locales" ? (
					<div className="flex flex-col gap-6">
						{loading ? (
							<p className="text-sm text-muted">Cargando tus locales…</p>
						) : establishments.length === 0 ? (
							<Card>
								<p className="text-sm text-muted">
									Todavía no tienes locales con actividad.{" "}
									<button
										type="button"
										className="font-medium text-primary hover:opacity-80"
										onClick={() => selectTab("explore")}
									>
										Explorar locales
									</button>
								</p>
							</Card>
						) : (
							<ul className="flex flex-col gap-3">
								{establishments.map((establishment) => (
									<li key={establishment.customerId}>
										<EstablishmentSummaryCard establishment={establishment} />
									</li>
								))}
							</ul>
						)}

						<section
							aria-labelledby="join-by-slug-heading"
							className="flex flex-col gap-3 border-t border-border pt-6"
						>
							<h2 id="join-by-slug-heading" className="text-sm font-medium text-foreground">
								Unirse por identificador
							</h2>
							<PlatformDiscoverJoinForm
								onJoined={() => {
									void refreshRelationships();
								}}
							/>
						</section>
					</div>
				) : null}

				{activeTab === "negocios" ? (
					<div className="flex flex-col gap-3">
						{loading ? (
							<p className="text-sm text-muted">Cargando tus negocios…</p>
						) : businesses.length === 0 ? (
							<Card>
								<p className="text-sm text-muted">
									Aún no tienes un negocio registrado.{" "}
									<Link
										href={platformRoutes.registerBusiness}
										className="font-medium text-primary hover:opacity-80"
									>
										Registrar negocio
									</Link>
								</p>
							</Card>
						) : (
							<ul className="flex flex-col gap-3">
								{businesses.map((business) => (
									<li key={business.id}>
										<BusinessSummaryCard business={business} />
									</li>
								))}
							</ul>
						)}
					</div>
				) : null}
			</div>

			<Button type="button" variant="secondary" className="w-full" onClick={() => void logout()}>
				Cerrar sesión
			</Button>
		</main>
	);
}
