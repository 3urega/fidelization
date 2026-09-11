"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type ReactElement, useEffect, useRef } from "react";

import { StaffScanActivityHub } from "../../../_components/loyalty/StaffScanActivityHub";
import { useStaffScanSession } from "../../../_components/loyalty/StaffScanSessionProvider";
import { PageHeader } from "../../../_components/shell/PageHeader";
import { Card } from "../../../_components/ui/Card";
import { Button } from "../../../_components/ui/Button";

export function StaffScanSessionPageClient(): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const customerId = searchParams.get("c")?.trim() ?? "";
	const { session, loading, error, loadByCustomerId, clearSession } = useStaffScanSession();
	const loadedForRef = useRef<string | null>(null);

	useEffect(() => {
		if (!customerId) {
			router.replace("/scan");

			return;
		}

		if (loadedForRef.current === customerId && session?.customer.id === customerId) {
			return;
		}

		loadedForRef.current = customerId;
		void loadByCustomerId(customerId);
	}, [customerId, loadByCustomerId, router, session?.customer.id]);

	function handleScanAnother(): void {
		clearSession();
		router.push("/scan");
	}

	if (!customerId) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Sesión de escaneo" description="Redirigiendo…" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Cliente identificado"
				description="Elige qué quieres gestionar para este cliente."
			/>
			<Card>
				{loading && !session ? (
					<p className="text-sm text-muted">Cargando datos del cliente…</p>
				) : null}

				{error && !session ? (
					<div className="flex flex-col gap-3">
						<p className="text-sm text-error">{error.message}</p>
						<Button type="button" variant="secondary" onClick={() => router.push("/scan")}>
							Volver a escanear
						</Button>
					</div>
				) : null}

				{session && session.customer.id === customerId ? (
					<StaffScanActivityHub
						session={session}
						customerId={customerId}
						onScanAnother={handleScanAnother}
					/>
				) : null}
			</Card>
		</div>
	);
}
