"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type PromotionRow,
	type StampProgressRow,
} from "../../../../_components/loyalty/LoyaltyCard";
import { StampCampaignCards } from "../../../../_components/loyalty/StampCampaignCards";
import { EstablishmentHeroCover } from "../../../../_components/platform-app/EstablishmentHeroCover";
import { platformFetch } from "../../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../../lib/platform/routes";
import { Button } from "../../../../_components/ui/Button";
import { Card } from "../../../../_components/ui/Card";

type EstablishmentTenant = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	primaryColor: string | null;
	secondaryColor: string | null;
	subscriptionPlan: string;
	status: string;
	address?: string | null;
	description?: string | null;
	coverImageUrl?: string | null;
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
	stampProgress?: StampProgressRow[];
	error?: { description?: string };
};

function EstablishmentProfileInfo({ tenant }: { tenant: EstablishmentTenant }): ReactElement | null {
	const description = tenant.description?.trim();
	const address = tenant.address?.trim();

	if (!description && !address) {
		return null;
	}

	return (
		<Card className="flex flex-col gap-3">
			{description ? (
				<div>
					<h2 className="text-sm font-medium text-foreground">Sobre el local</h2>
					<p className="mt-1 text-sm text-muted whitespace-pre-wrap">{description}</p>
				</div>
			) : null}
			{address ? (
				<div>
					<h2 className="text-sm font-medium text-foreground">Dirección</h2>
					<p className="mt-1 text-sm text-muted">{address}</p>
				</div>
			) : null}
		</Card>
	);
}

function PromotionsSection({
	title,
	promotions,
	emptyMessage,
}: {
	title: string;
	promotions: PromotionRow[];
	emptyMessage: string;
}): ReactElement {
	if (promotions.length === 0) {
		return (
			<Card>
				<p className="text-sm text-muted">{emptyMessage}</p>
			</Card>
		);
	}

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold text-foreground">{title}</h2>
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

function splitStampProgressRows(rows: StampProgressRow[]): {
	activeCards: StampProgressRow[];
	availableCards: StampProgressRow[];
} {
	const activeCards = rows.filter((row) => row.current > 0 || row.completed);
	const availableCards = rows.filter((row) => row.current === 0 && !row.completed);

	return { activeCards, availableCards };
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

		const response = await platformFetch(`/api/user/establishments/${encodeURIComponent(slug)}`);
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

		const response = await platformFetch("/api/user/establishments/join", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
				<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
			</div>
		);
	}

	const stampRows = detail.stampProgress ?? [];
	const { activeCards, availableCards } = splitStampProgressRows(stampRows);

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<EstablishmentHeroCover
				name={detail.tenant.name}
				logoUrl={detail.tenant.logoUrl}
				coverImageUrl={detail.tenant.coverImageUrl}
				primaryColor={detail.tenant.primaryColor}
			/>

			<EstablishmentProfileInfo tenant={detail.tenant} />

			{detail.mode === "discovery" ? (
				<>
					<Card>
						<div className="flex flex-col gap-4">
							<p className="text-sm text-muted">
								Explora las campañas de sellos y promociones de este local. Únete para activar tu
								tarjeta de fidelización.
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

					<StampCampaignCards rows={stampRows} preview />

					<PromotionsSection
						title="Promociones"
						promotions={detail.promotions}
						emptyMessage="Este local no tiene promociones activas ahora."
					/>
				</>
			) : (
				<>
					{activeCards.length > 0 ? (
						<StampCampaignCards title="Mis tarjetas" rows={activeCards} />
					) : null}

					{availableCards.length > 0 ? (
						<StampCampaignCards
							title="Otras tarjetas disponibles"
							preview
							previewSubtitle="Escanea en el local para empezar a acumular."
							rows={availableCards}
						/>
					) : null}

					{activeCards.length === 0 && availableCards.length === 0 ? (
						<StampCampaignCards rows={[]} />
					) : null}

					<PromotionsSection
						title="Promociones"
						promotions={detail.promotions}
						emptyMessage="Este local no tiene promociones activas ahora."
					/>
				</>
			)}
		</main>
	);
}
