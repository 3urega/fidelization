"use client";

import QRCode from "react-qr-code";
import type { ReactElement } from "react";

type LoyaltyCardProps = {
	name: string;
	pointsBalance: number;
	qrValue: string;
	businessName?: string;
};

export function LoyaltyCard({
	name,
	pointsBalance,
	qrValue,
	businessName,
}: LoyaltyCardProps): ReactElement {
	return (
		<div className="flex flex-col gap-6">
			{businessName ? (
				<p className="text-center text-sm font-medium uppercase tracking-wide text-muted">
					{businessName}
				</p>
			) : null}

			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="text-2xl font-semibold text-foreground">{name}</h1>
				<p className="text-4xl font-bold text-primary">{pointsBalance}</p>
				<p className="text-sm text-muted">puntos</p>
			</div>

			<div className="mx-auto rounded-xl border border-border bg-white p-4 shadow-sm">
				<QRCode value={qrValue} size={200} level="M" />
			</div>

			<p className="text-center text-sm text-muted">
				Muestra este código QR al personal para acumular puntos.
			</p>
		</div>
	);
}
