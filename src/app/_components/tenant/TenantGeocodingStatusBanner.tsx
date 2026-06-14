"use client";

import { type ReactElement } from "react";

import type { TenantGeocodingDisplayState } from "../../../lib/tenant/deriveTenantGeocodingDisplayState";

type TenantGeocodingStatusBannerProps = {
	state: TenantGeocodingDisplayState;
	onRetry?: () => void;
	retrying?: boolean;
};

function messageClassName(variant: TenantGeocodingDisplayState["variant"]): string {
	if (variant === "failed") {
		return "text-sm text-error";
	}

	if (variant === "pending") {
		return "text-sm text-muted";
	}

	return "text-sm text-foreground";
}

export function TenantGeocodingStatusBanner({
	state,
	onRetry,
	retrying = false,
}: TenantGeocodingStatusBannerProps): ReactElement | null {
	if (state.variant === "none") {
		return null;
	}

	const showRetry = "showRetry" in state && state.showRetry;

	return (
		<div
			className="flex flex-col gap-2 rounded-theme border border-border bg-surface px-3 py-2"
			role="status"
			aria-live="polite"
		>
			<p className={messageClassName(state.variant)}>{state.message}</p>
			{showRetry && onRetry ? (
				<button
					type="button"
					onClick={onRetry}
					disabled={retrying}
					className="self-start text-sm font-medium text-primary hover:opacity-80 disabled:opacity-60"
				>
					{retrying ? "Reintentando…" : "Reintentar ubicación"}
				</button>
			) : null}
		</div>
	);
}
