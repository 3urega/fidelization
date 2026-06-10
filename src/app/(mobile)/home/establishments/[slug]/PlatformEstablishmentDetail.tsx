"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type CSSProperties, type ReactElement, useCallback, useEffect, useState } from "react";

import {
	LoyaltyCard,
	type PromotionRow,
	type RewardRow,
	type StampProgressRow,
} from "../../../../_components/loyalty/LoyaltyCard";
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
};

type EstablishmentCustomer = {
	id: string;
	name: string;
	pointsBalance: number;
	visitsCount: number;
};

type OtherPromotionGroup = {
	tenantId: string;
	tenantName: string;
	tenantSlug: string;
	promotions: PromotionRow[];
};

type EstablishmentDetailResponse = {
	mode: "discovery" | "interaction";
	tenant: EstablishmentTenant;
	promotions: PromotionRow[];
	customer: EstablishmentCustomer | null;
	stampProgress?: StampProgressRow[];
	rewards?: RewardRow[];
	userQrValue?: string | null;
	otherPromotions?: OtherPromotionGroup[];
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

function OtherPromotionsSection({ groups }: { groups: OtherPromotionGroup[] }): ReactElement | null {
	if (groups.length === 0) {
		return null;
	}

	return (
		<section aria-labelledby="other-promos-heading" className="flex flex-col gap-3">
			<h2 id="other-promos-heading" className="text-lg font-semibold text-foreground">
				Otras promos activas
			</h2>
			<ul className="flex flex-col gap-4">
				{groups.map((group) => (
					<li key={group.tenantId}>
						<p className="mb-2 text-sm font-medium text-muted">{group.tenantName}</p>
						<ul className="flex flex-col gap-2">
							{group.promotions.map((promotion) => (
								<li key={promotion.id}>
									<Card>
										<p className="font-medium text-foreground">{promotion.title}</p>
										<p className="text-sm text-muted">{promotion.description}</p>
									</Card>
								</li>
							))}
						</ul>
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
	const [redeemError, setRedeemError] = useState<string | null>(null);
	const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);

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

	async function handleRedeemReward(rewardId: string): Promise<void> {
		setRedeemError(null);
		setRedeemingRewardId(rewardId);

		const response = await platformFetch(
			`/api/user/establishments/${encodeURIComponent(slug)}/rewards/redeem`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rewardId }),
			},
		);

		const body = (await response.json()) as { error?: { description?: string } };

		if (!response.ok) {
			setRedeemError(body.error?.description ?? "No se pudo canjear la recompensa");
			setRedeemingRewardId(null);

			return;
		}

		setRedeemingRewardId(null);
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

	const qrValue = detail.userQrValue ?? "";

	return (
		<main className="flex flex-1 flex-col gap-6 py-4">
			<Link href={platformRoutes.home} className="text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<EstablishmentHeader tenant={detail.tenant} />

			<EstablishmentProfileInfo tenant={detail.tenant} />

			{detail.mode === "discovery" ? (
				<>
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
					<PromotionsSection
						title="Promociones"
						promotions={detail.promotions}
						emptyMessage="Este local no tiene promociones activas ahora."
					/>
				</>
			) : (
				<>
					{detail.customer && qrValue ? (
						<Card>
							<LoyaltyCard
								name={detail.customer.name}
								pointsBalance={detail.customer.pointsBalance}
								qrValue={qrValue}
								businessName={detail.tenant.name}
								stampProgress={detail.stampProgress ?? []}
								rewards={detail.rewards ?? []}
								promotions={detail.promotions}
								redeemingRewardId={redeemingRewardId}
								redeemError={redeemError}
								onRedeemReward={(rewardId) => {
									void handleRedeemReward(rewardId);
								}}
							/>
						</Card>
					) : (
						<Card>
							<p className="text-sm text-error">No se pudo cargar tu QR de usuario.</p>
						</Card>
					)}

					<Link href={platformRoutes.homeQr} className="text-center text-sm font-medium text-primary hover:opacity-80">
						Ver QR en pantalla completa
					</Link>

					<OtherPromotionsSection groups={detail.otherPromotions ?? []} />
				</>
			)}
		</main>
	);
}
