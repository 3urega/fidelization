"use client";

import { type ReactElement, useState } from "react";

import { useTenantSession } from "./TenantSessionProvider";
import { Button } from "../ui/Button";

export function PlatformImpersonationBanner(): ReactElement | null {
	const { session, loading } = useTenantSession();
	const [ending, setEnding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (loading || !session?.impersonation?.active) {
		return null;
	}

	const { tenantSlug, tenantStatus } = session.impersonation;
	const isSuspended = tenantStatus === "suspended";

	async function endImpersonation(): Promise<void> {
		setEnding(true);
		setError(null);

		try {
			const response = await fetch("/api/platform/impersonation/end", {
				method: "POST",
				credentials: "include",
			});
			const data = (await response.json()) as { redirectUrl?: string; error?: { description?: string } };

			if (!response.ok) {
				setError(data.error?.description ?? "No se pudo salir de la impersonación");

				return;
			}

			window.location.assign(data.redirectUrl ?? "/platform/login");
		} catch {
			setError("No se pudo conectar con el servidor");
		} finally {
			setEnding(false);
		}
	}

	return (
		<div className="fixed left-0 right-0 top-0 z-[60] border-b border-primary/30 bg-primary/10 px-4 py-2 md:pl-64">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-foreground">
					Estás impersonando <strong>{tenantSlug}</strong>
					{isSuspended ? " · Negocio suspendido" : null}
				</p>
				<div className="flex items-center gap-2">
					{error ? <span className="text-xs text-error">{error}</span> : null}
					<Button
						type="button"
						variant="secondary"
						className="text-xs"
						disabled={ending}
						onClick={() => void endImpersonation()}
					>
						{ending ? "Saliendo…" : "Volver a plataforma"}
					</Button>
				</div>
			</div>
		</div>
	);
}
