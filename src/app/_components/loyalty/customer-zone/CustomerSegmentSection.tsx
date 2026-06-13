"use client";

import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type CustomerZoneListCustomer,
	type CustomerZoneListResponse,
	type CustomerZoneSegment,
	formatCustomerZoneError,
} from "../../../lib/loyalty/customerZone";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import {
	CustomerZoneCustomerCard,
	type CustomerZoneCustomerCardVariant,
} from "./CustomerZoneCustomerCard";

type CustomerSegmentSectionProps = {
	title: string;
	description?: string;
	segment: CustomerZoneSegment;
	emptyMessage: string;
	variant: CustomerZoneCustomerCardVariant;
	showRewardCta?: boolean;
};

export function CustomerSegmentSection({
	title,
	description,
	segment,
	emptyMessage,
	variant,
	showRewardCta = false,
}: CustomerSegmentSectionProps): ReactElement {
	const [customers, setCustomers] = useState<CustomerZoneListCustomer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/loyalty/customers?segment=${segment}`, {
				credentials: "include",
			});
			const body = (await response.json()) as CustomerZoneListResponse;

			if (!response.ok) {
				setCustomers([]);
				setError(formatCustomerZoneError(body));

				return;
			}

			setCustomers(body.customers ?? []);
		} catch {
			setCustomers([]);
			setError("Error de red al cargar los clientes.");
		} finally {
			setLoading(false);
		}
	}, [segment]);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<section className="flex flex-col gap-3">
			<div>
				<h2 className="font-medium text-foreground">{title}</h2>
				{description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
			</div>

			{loading ? (
				<Card className="p-4">
					<p className="text-sm text-muted">Cargando clientes…</p>
				</Card>
			) : null}

			{!loading && error ? (
				<Card className="p-4">
					<p className="text-sm text-error">{error}</p>
					<Button type="button" variant="secondary" className="mt-4" onClick={() => void load()}>
						Reintentar
					</Button>
				</Card>
			) : null}

			{!loading && !error && customers.length === 0 ? (
				<Card className="p-4">
					<p className="text-sm text-muted">{emptyMessage}</p>
				</Card>
			) : null}

			{!loading && !error && customers.length > 0 ? (
				<ul className="flex flex-col gap-3">
					{customers.map((customer) => (
						<li key={customer.id}>
							<CustomerZoneCustomerCard customer={customer} variant={variant} />
							{showRewardCta ? (
								<div className="mt-2">
									<Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
										Enviar recompensa
									</Button>
									<p className="mt-1 text-xs text-muted">Próximamente</p>
								</div>
							) : null}
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
