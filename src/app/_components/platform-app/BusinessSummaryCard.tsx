"use client";

import { type ReactElement, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { Card } from "../ui/Card";

type UserBusiness = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	subscriptionPlan: string;
	status: string;
};

function planLabel(plan: string): string {
	return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function BusinessAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }): ReactElement {
	if (logoUrl) {
		return (
			<img
				src={logoUrl}
				alt=""
				className="h-10 w-10 rounded-theme border border-border object-cover"
			/>
		);
	}

	return (
		<div
			aria-hidden
			className="flex h-10 w-10 items-center justify-center rounded-theme border border-border bg-background text-sm font-semibold text-primary"
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

async function enterBusinessPanel(slug: string): Promise<{ redirectUrl?: string; error?: string }> {
	const response = await platformFetch(`/api/user/businesses/${encodeURIComponent(slug)}/enter`, {
		method: "POST",
	});
	const data = (await response.json()) as {
		redirectUrl?: string;
		error?: { description?: string };
	};

	if (!response.ok || !data.redirectUrl) {
		return { error: data.error?.description ?? "No se pudo abrir el panel del negocio" };
	}

	return { redirectUrl: data.redirectUrl };
}

export function BusinessSummaryCard({ business }: { business: UserBusiness }): ReactElement {
	const [entering, setEntering] = useState(false);
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-1">
			<button
				type="button"
				disabled={entering}
				className="block w-full text-left disabled:opacity-60"
				onClick={() => {
					void (async () => {
						setEntering(true);
						setError(null);

						const result = await enterBusinessPanel(business.slug);
						if (result.error || !result.redirectUrl) {
							setError(result.error ?? "No se pudo abrir el panel");
							setEntering(false);

							return;
						}

						window.location.assign(result.redirectUrl);
					})();
				}}
			>
				<Card className="transition-opacity hover:opacity-90">
					<div className="flex items-start gap-3">
						<BusinessAvatar name={business.name} logoUrl={business.logoUrl} />
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<p className="font-medium text-foreground">{business.name}</p>
							<p className="text-xs text-muted">
								{entering ? "Abriendo panel…" : "Gestionar negocio"}
							</p>
							<div className="flex flex-wrap gap-2 pt-1">
								<span className="rounded-theme bg-muted/30 px-2 py-0.5 text-xs text-muted">
									Plan {planLabel(business.subscriptionPlan)}
								</span>
								<span className="rounded-theme bg-muted/30 px-2 py-0.5 text-xs capitalize text-muted">
									{business.status}
								</span>
							</div>
						</div>
					</div>
				</Card>
			</button>
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
