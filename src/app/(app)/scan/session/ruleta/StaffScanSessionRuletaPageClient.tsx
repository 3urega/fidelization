"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactElement, Suspense } from "react";

import { StaffScanRuletaPanel } from "../../../../_components/loyalty/StaffScanRuletaPanel";
import { StaffScanSessionLayout } from "../../../../_components/loyalty/StaffScanSessionLayout";
import { useStaffScanSession } from "../../../../_components/loyalty/StaffScanSessionProvider";

function RuletaPanelContent(): ReactElement {
	const searchParams = useSearchParams();
	const customerId = searchParams.get("c")?.trim() ?? "";
	const { session, pendingQrValue, refetch, loading, error } = useStaffScanSession();

	if (!customerId) {
		return (
			<StaffScanSessionLayout title="Ruleta" description="Autorización y estado de participación.">
				<p className="text-sm text-muted">
					Falta el cliente en la URL.{" "}
					<Link href="/scan" className="text-primary underline">
						Identifica un cliente
					</Link>
				</p>
			</StaffScanSessionLayout>
		);
	}

	const sessionReady = session !== null && session.customer.id === customerId;

	return (
		<StaffScanSessionLayout title="Ruleta" description="Autorización y estado de participación.">
			{error && !sessionReady ? <p className="text-sm text-error">{error.message}</p> : null}
			{loading && !sessionReady ? (
				<p className="text-sm text-muted">Cargando datos del cliente…</p>
			) : null}
			{sessionReady ? (
				<StaffScanRuletaPanel
					session={session}
					pendingQrValue={pendingQrValue}
					onAfterAction={refetch}
				/>
			) : null}
			{!loading && !sessionReady && !error ? (
				<p className="text-sm text-muted">No se pudo cargar la sesión de este cliente.</p>
			) : null}
		</StaffScanSessionLayout>
	);
}

export function StaffScanSessionRuletaPageClient(): ReactElement {
	return (
		<Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
			<RuletaPanelContent />
		</Suspense>
	);
}
