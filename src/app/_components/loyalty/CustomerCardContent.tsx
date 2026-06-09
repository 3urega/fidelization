"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useState } from "react";

import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LoyaltyCard, type StampProgressRow } from "./LoyaltyCard";

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
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			try {
				const response = await fetch("/api/loyalty/me", {
					credentials: "include",
				});
				const body = (await response.json()) as MeResponse;

				if (cancelled) {
					return;
				}

				if (!response.ok) {
					if (response.status === 401 || response.status === 403) {
						router.replace("/app/welcome");

						return;
					}

					setError(body.error?.description ?? "No se pudo cargar tu tarjeta.");

					return;
				}

				if (body.customer) {
					setCustomer(body.customer);
					setStampProgress(body.stampProgress ?? []);
				}
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
	}, [router]);

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
			/>
		</Card>
	);
}
