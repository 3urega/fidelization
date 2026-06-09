"use client";

import { type ReactElement, useMemo, useState } from "react";

import { buildTenantLoyaltyAppUrl } from "../../../lib/tenant/buildTenantLoyaltyAppUrl";
import { Button } from "../ui/Button";

type LoyaltyAppLinkCardProps = {
	tenantSlug: string;
};

export function LoyaltyAppLinkCard({ tenantSlug }: LoyaltyAppLinkCardProps): ReactElement {
	const [copied, setCopied] = useState(false);

	const loyaltyUrl = useMemo(() => {
		const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
		const port =
			typeof window !== "undefined" && window.location.port ? window.location.port : undefined;
		const protocol =
			typeof window !== "undefined" ? window.location.protocol.replace(/:$/, "") : "http";

		return buildTenantLoyaltyAppUrl({
			slug: tenantSlug,
			appDomain,
			protocol,
			port,
		});
	}, [tenantSlug]);

	async function handleCopy(): Promise<void> {
		if (!loyaltyUrl) {
			return;
		}

		try {
			await navigator.clipboard.writeText(loyaltyUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	if (!loyaltyUrl) {
		return (
			<p className="text-sm text-muted">
				Configura <code className="text-xs">NEXT_PUBLIC_APP_DOMAIN</code> para ver el enlace de
				fidelización.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<p className="break-all font-mono text-sm text-foreground">{loyaltyUrl}</p>
				<p className="mt-1 text-sm text-muted">Compártelo con tus clientes (WhatsApp, QR en local, etc.).</p>
			</div>
			<div className="flex shrink-0 flex-col gap-2 sm:items-end">
				<Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => void handleCopy()}>
					{copied ? "Copiado" : "Copiar enlace"}
				</Button>
				<a
					href={loyaltyUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-center text-sm font-medium text-primary hover:underline"
				>
					Abrir en nueva pestaña
				</a>
			</div>
		</div>
	);
}
