"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LoyaltyCard, type PromotionRow, type RewardRow, type StampProgressRow } from "./LoyaltyCard";

type CustomerPayload = {
	id: string;
	name: string;
	email: string;
	phone: string;
	qrValue: string;
	pointsBalance: number;
	visitsCount: number;
};

type MeResponse = {
	customer?: CustomerPayload;
	stampProgress?: StampProgressRow[];
	rewards?: RewardRow[];
	promotions?: PromotionRow[];
	error?: {
		description?: string;
	};
};

type RedeemResponse = {
	customer?: CustomerPayload;
	rewardId?: string;
	error?: {
		description?: string;
	};
};

type CustomerCardContentProps = {
	businessName?: string;
};

export function CustomerCardContent({ businessName }: CustomerCardContentProps): ReactElement {
	const router = useRouter();
	const [customer, setCustomer] = useState<CustomerPayload | null>(null);
	const [stampProgress, setStampProgress] = useState<StampProgressRow[]>([]);
	const [rewards, setRewards] = useState<RewardRow[]>([]);
	const [promotions, setPromotions] = useState<PromotionRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [redeemError, setRedeemError] = useState<string | null>(null);
	const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const loadCard = useCallback(async (): Promise<boolean> => {
		const response = await fetch("/api/loyalty/me", {
			credentials: "include",
		});
		const body = (await response.json()) as MeResponse;

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				router.replace("/app/welcome");

				return false;
			}

			setError(body.error?.description ?? "No se pudo cargar tu tarjeta.");

			return false;
		}

		if (body.customer) {
			setCustomer(body.customer);
			setStampProgress(body.stampProgress ?? []);
			setRewards(body.rewards ?? []);
			setPromotions(body.promotions ?? []);
		}

		return true;
	}, [router]);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			try {
				await loadCard();
			} catch {
				if (!cancelled) {
					setError("Error de red al cargar tu tarjeta.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [loadCard]);

	async function handleRedeemReward(rewardId: string): Promise<void> {
		setRedeemError(null);
		setRedeemingRewardId(rewardId);

		try {
			const response = await fetch("/api/loyalty/rewards/redeem", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rewardId }),
			});
			const body = (await response.json()) as RedeemResponse;

			if (!response.ok) {
				setRedeemError(body.error?.description ?? "No se pudo canjear la recompensa.");

				return;
			}

			if (body.customer) {
				setCustomer(body.customer);
			}

			await loadCard();
		} catch {
			setRedeemError("Error de red al canjear la recompensa.");
		} finally {
			setRedeemingRewardId(null);
		}
	}

	if (loading) {
		return (
			<Card>
				<p className="text-sm text-muted">Cargando tu tarjeta…</p>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<p className="text-sm text-error">{error}</p>
				<Link href="/app/welcome" className="mt-4 block">
					<Button type="button" className="w-full">
						Volver al registro
					</Button>
				</Link>
			</Card>
		);
	}

	if (!customer) {
		return (
			<Card>
				<p className="text-sm text-muted">No se encontró tu tarjeta.</p>
			</Card>
		);
	}

	return (
		<Card>
			<LoyaltyCard
				name={customer.name}
				pointsBalance={customer.pointsBalance}
				qrValue={customer.qrValue}
				businessName={businessName}
				stampProgress={stampProgress}
				rewards={rewards}
				promotions={promotions}
				redeemingRewardId={redeemingRewardId}
				redeemError={redeemError}
				onRedeemReward={(rewardId) => {
					void handleRedeemReward(rewardId);
				}}
			/>
		</Card>
	);
}
