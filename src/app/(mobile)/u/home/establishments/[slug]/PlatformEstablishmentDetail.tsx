"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type CSSProperties, type ReactElement, useCallback, useEffect, useState } from "react";

import { type PromotionRow } from "../../../../../_components/loyalty/LoyaltyCard";
import { Button } from "../../../../../_components/ui/Button";
import { Card } from "../../../../../_components/ui/Card";

type EstablishmentTenant = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	primaryColor: string | null;
	secondaryColor: string | null;
	subscriptionPlan: string;
	status: string;
};

type EstablishmentCustomer = {
	id: string;
	name: string;
	pointsBalance: number;
	visitsCount: number;
};

type EstablishmentDetailResponse = {
	mode: "discovery" | "interaction";
	tenant: EstablishmentTenant;
	promotions: PromotionRow[];
	customer: EstablishmentCustomer | null;
	error?: { description?: string };
};

function tenantAccentStyle(tenant: EstablishmentTenant): CSSProperties | undefined {
	if (!tenant.primaryColor) {
		return undefined;
	}

	return { ["--color-primary" as string]: tenant.primaryColor };
}

function EstablishmentHeader({ tenant }: { tenant: EstablishmentTenant }): ReactElement {
	return (
		<header
			className="flex flex-col items-center gap-3 rounded-theme border border-border bg-surface p-4"
			style={tenantAccentStyle(tenant)}
		>
			{tenant.logoUrl ? (
				<img
					src={tenant.logoUrl}
					alt=""
					className="h-16 w-16 rounded-theme border border-border object-cover"
				/>
			) : (
				<div
					aria-hidden
					className="flex h-16 w-16 items-center justify-center rounded-theme border border-border bg-background text-xl font-semibold text-primary"
				>
					{tenant.name.charAt(0).toUpperCase()}
				</div>
			)}
			<div className="flex flex-col items-center gap-1 text-center">
				<h1 className="text-2xl font-semibold text-foreground">{tenant.name}</h1>
				<p className="text-sm text-muted">{tenant.slug}</p>
			</div>
		</header>
	);
}

function PromotionsSection({ promotions }: { promotions: PromotionRow[] }): ReactElement {
	if (promotions.length === 0) {
		return (
			<Card>
				<p className="text-sm text-muted">Este local no tiene promociones activas ahora.</p>
			</Card>
		);
	}

	return (
		<section aria-labelledby="promos-heading" className="flex flex-col gap-3">
			<h2 id="promos-heading" className="text-lg font-semibold text-foreground">
				Promociones
			</h2>
			<ul className="flex flex-col gap-3">
				{promotions.map((promotion) => (
					<li key={promotion.id}>
						<Card>
							<p className="font-medium text-foreground">{promotion.title}</p>
							<p className="text-sm text-muted">{promotion.description}</p>
						</Card>
					</li>
				))}
			</ul>
		</section>
	);
}

export function PlatformEstablishmentDetail(): ReactElement {
	const params = useParams();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const [detail, setDetail] = useState<EstablishmentDetailResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [joining, setJoining] = useState(false);

	const loadDetail = useCallback(async (): Promise<void> => {
		if (!slug) {
			setError("Local no válido");
			setLoading(false);

			return;
		}

		const response = await fetch(`/api/user/establishments/${encodeURIComponent(slug)}`, {
			credentials: "include",
		});
		const body = (await response.json()) as EstablishmentDetailResponse;

		if (!response.ok) {
			setError(body.error?.description ?? "No se pudo cargar el local");
			setLoading(false);

			return;
		}

		setDetail(body);
		setError(null);
		setLoading(false);
	}, [slug]);

	useEffect(() => {
		setLoading(true);
		void loadDetail();
	}, [loadDetail]);

	async function handleJoin(): Promise<void> {
		setJoining(true);
		setError(null);

		const response = await fetch("/api/user/establishments/join", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ slug }),
		});

		const body = (await response.json()) as { error?: { description?: string } };

		if (!response.ok) {
			setError(body.error?.description ?? "No se pudo unir al local");
			setJoining(false);

			return;
		}

		setJoining(false);
		setLoading(true);
		await loadDetail();
	}

	if (loading) {
		return <p className="text-sm text-muted">Cargando local…</p>;
	}

	if (error || !detail) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-error">{error ?? "Local no disponible"}</p>
				<Link href="/u/home" className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
			</div>
		);
	}

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href="/u/home" className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<EstablishmentHeader tenant={detail.tenant} />

			{detail.mode === "discovery" ? (
				<Card>
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted">
							Explora las promociones de este local. Cuando quieras acumular puntos, únete para
							activar tu tarjeta de fidelización.
						</p>
						<Button
							type="button"
							className="w-full"
							disabled={joining}
							onClick={() => void handleJoin()}
						>
							{joining ? "Uniéndote…" : "Unirme al local"}
						</Button>
					</div>
				</Card>
			) : (
				<Card>
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium text-primary">Ya estás unido</p>
						<p className="text-3xl font-bold text-foreground">
							{detail.customer?.pointsBalance ?? 0}
						</p>
						<p className="text-sm text-muted">
							puntos · {detail.customer?.visitsCount ?? 0} visitas
						</p>
					</div>
				</Card>
			)}

			<PromotionsSection promotions={detail.promotions} />
		</main>
	);
}
