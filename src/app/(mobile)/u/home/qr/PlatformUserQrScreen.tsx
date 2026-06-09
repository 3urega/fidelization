"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { type ReactElement, useEffect, useState } from "react";

import { platformFetch } from "../../../../../lib/platform/apiUrl";
import { Card } from "../../../../_components/ui/Card";

type UserMeResponse = {
	user?: { name: string; qrValue: string | null };
	error?: { description?: string };
};

export function PlatformUserQrScreen(): ReactElement {
	const [name, setName] = useState<string>("");
	const [qrValue, setQrValue] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
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
	}, []);

	if (loading) {
		return <p className="text-sm text-muted">Cargando QR…</p>;
	}

	if (error || !qrValue) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-error">{error ?? "QR no disponible"}</p>
				<Link href="/u/home" className="text-sm font-medium text-primary hover:opacity-80">
					← Volver al inicio
				</Link>
			</div>
		);
	}

	return (
		<main className="flex flex-1 flex-col items-center gap-6 py-4">
			<Link href="/u/home" className="self-start text-sm font-medium text-primary hover:opacity-80">
				← Volver al inicio
			</Link>

			<header className="flex flex-col items-center gap-1 text-center">
				<h1 className="text-2xl font-semibold text-foreground">{name}</h1>
				<p className="text-sm text-muted">Tu QR de pago</p>
			</header>

			<Card className="flex flex-col items-center gap-4 p-6">
				<div className="rounded-xl border border-border bg-white p-4">
					<QRCode value={qrValue} size={240} level="M" />
				</div>
				<p className="text-center text-sm text-muted">
					Muestra este código al personal en cualquier local de la plataforma.
				</p>
			</Card>
		</main>
	);
}
