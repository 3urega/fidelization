"use client";

import QRCode from "react-qr-code";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { QrDevScanHint } from "../loyalty/QrDevScanHint";
import { Card } from "../ui/Card";

type PlatformUserQrPanelProps = {
	name?: string;
	qrValue?: string | null;
	loading?: boolean;
	error?: string | null;
};

type UserMeResponse = {
	user?: { name: string; qrValue: string | null };
	error?: { description?: string };
};

export function PlatformUserQrPanel({
	name: nameProp,
	qrValue: qrValueProp,
	loading: loadingProp,
	error: errorProp,
}: PlatformUserQrPanelProps): ReactElement {
	const [name, setName] = useState(nameProp ?? "");
	const [qrValue, setQrValue] = useState<string | null>(qrValueProp ?? null);
	const [loading, setLoading] = useState(loadingProp ?? qrValueProp === undefined);
	const [error, setError] = useState<string | null>(errorProp ?? null);

	const shouldFetch = qrValueProp === undefined && nameProp === undefined;

	useEffect(() => {
		if (!shouldFetch) {
			if (nameProp !== undefined) {
				setName(nameProp);
			}
			if (qrValueProp !== undefined) {
				setQrValue(qrValueProp);
			}
			if (loadingProp !== undefined) {
				setLoading(loadingProp);
			}
			if (errorProp !== undefined) {
				setError(errorProp);
			}

			return;
		}

		let cancelled = false;

		async function load(): Promise<void> {
			const response = await platformFetch("/api/user/me");
			const body = (await response.json()) as UserMeResponse;

			if (cancelled) {
				return;
			}

			if (!response.ok || !body.user?.qrValue) {
				setError(body.error?.description ?? "No se pudo cargar tu QR");
				setLoading(false);

				return;
			}

			setName(body.user.name);
			setQrValue(body.user.qrValue);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, [shouldFetch, nameProp, qrValueProp, loadingProp, errorProp]);

	if (loading) {
		return <p className="text-sm text-muted">Cargando QR…</p>;
	}

	if (error || !qrValue) {
		return <p className="text-sm text-error">{error ?? "QR no disponible"}</p>;
	}

	return (
		<div className="flex flex-col items-center gap-4">
			<header className="flex flex-col items-center gap-1 text-center">
				<h2 className="text-lg font-semibold text-foreground">{name}</h2>
				<p className="text-sm text-muted">Tu QR de pago</p>
			</header>

			<Card className="flex w-full flex-col items-center gap-4 p-6">
				<div className="rounded-xl border border-border bg-white p-4">
					<QRCode value={qrValue} size={240} level="M" />
				</div>
				<QrDevScanHint qrValue={qrValue} />
				<p className="text-center text-sm text-muted">
					Muestra este código al personal en cualquier local de la plataforma. Si es tu primera
					visita, el local se añadirá automáticamente a «Mis locales».
				</p>
			</Card>
		</div>
	);
}
