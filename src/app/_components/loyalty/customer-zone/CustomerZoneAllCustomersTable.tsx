"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import {
	type CustomerZoneListCustomer,
	type CustomerZoneListResponse,
	formatCustomerZoneError,
	formatRelativeLastVisit,
} from "../../../../lib/loyalty/customerZone";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { CustomerZoneStatusBadge } from "./CustomerZoneStatusBadge";

const ALL_CUSTOMERS_LIST_LIMIT = 50;

type CustomerZoneAllCustomersTableProps = {
	isActive?: boolean;
};

export function CustomerZoneAllCustomersTable({
	isActive = true,
}: CustomerZoneAllCustomersTableProps): ReactElement {
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerZoneListCustomer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/loyalty/customers?segment=all", {
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
	}, []);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		void load();
	}, [isActive, load]);

	const navigateToCustomer = (customerId: string): void => {
		router.push(`/customers/${customerId}`);
	};

	return (
		<section className="flex flex-col gap-3">
			<div>
				<h2 className="font-medium text-foreground">Todos los clientes</h2>
				<p className="mt-1 text-sm text-muted">Listado completo de tu base de clientes.</p>
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
					<p className="text-sm text-muted">Aún no tienes clientes registrados.</p>
				</Card>
			) : null}

			{!loading && !error && customers.length > 0 ? (
				<Card className="overflow-hidden p-0">
					<div className="border-b border-border px-6 py-4">
						<p className="text-sm text-muted">
							{customers.length}{" "}
							{customers.length === 1 ? "cliente" : "clientes"}
						</p>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead>
								<tr className="border-b border-border bg-background">
									<th className="px-6 py-3 font-medium text-muted">Nombre</th>
									<th className="px-6 py-3 font-medium text-muted">Última visita</th>
									<th className="px-6 py-3 font-medium text-muted">Visitas</th>
									<th className="px-6 py-3 font-medium text-muted">Sellos</th>
									<th className="px-6 py-3 font-medium text-muted">Recompensas</th>
									<th className="px-6 py-3 font-medium text-muted">Estado</th>
								</tr>
							</thead>
							<tbody>
								{customers.map((customer) => (
									<tr
										key={customer.id}
										className="cursor-pointer border-b border-border last:border-b-0 hover:bg-background"
										onClick={() => navigateToCustomer(customer.id)}
									>
										<td className="px-6 py-3 font-medium text-foreground">
											<Link
												href={`/customers/${customer.id}`}
												className="hover:underline"
												onClick={(event) => event.stopPropagation()}
											>
												{customer.name}
											</Link>
										</td>
										<td className="px-6 py-3 text-muted">
											{formatRelativeLastVisit(customer.lastVisitAt)}
										</td>
										<td className="px-6 py-3 text-foreground">{customer.visitsCount}</td>
										<td className="px-6 py-3 text-foreground">{customer.totalStamps}</td>
										<td className="px-6 py-3 text-foreground">
											{customer.rewardsRedeemedCount}
										</td>
										<td className="px-6 py-3">
											<CustomerZoneStatusBadge status={customer.status} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{customers.length >= ALL_CUSTOMERS_LIST_LIMIT ? (
						<p className="border-t border-border px-6 py-3 text-xs text-muted">
							Mostrando hasta {ALL_CUSTOMERS_LIST_LIMIT} clientes.
						</p>
					) : null}
				</Card>
			) : null}
		</section>
	);
}
