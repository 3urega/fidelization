"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";

import { StampCampaignCards } from "../../../_components/loyalty/StampCampaignCards";
import { platformFetch } from "../../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../../lib/platform/routes";
import {
	buildUserStampCardsSummary,
	type UserStampCardItem,
} from "../../../../lib/platform/userStampCardsSummary";
import { Card } from "../../../_components/ui/Card";

type UserRelationshipsResponse = {
	businesses: unknown[];
	establishments: {
		name: string;
		slug: string;
		logoUrl: string | null;
		stampProgress: UserStampCardItem["campaign"][];
	}[];
};

function EstablishmentAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }): ReactElement {
	if (logoUrl) {
		return (
			<img
				src={logoUrl}
				alt=""
				className="h-8 w-8 rounded-theme border border-border object-cover"
			/>
		);
	}

	return (
		<div
			aria-hidden
			className="flex h-8 w-8 items-center justify-center rounded-theme border border-border bg-background text-xs font-semibold text-primary"
		>
			{name.charAt(0).toUpperCase()}
		</div>
	);
}

function StampCardItem({ item }: { item: UserStampCardItem }): ReactElement {
	return (
		<Link
			href={platformRoutes.homeEstablishment(item.establishmentSlug)}
			className="block transition-opacity hover:opacity-90"
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<EstablishmentAvatar name={item.establishmentName} logoUrl={item.logoUrl} />
					<p className="text-sm font-medium text-foreground">{item.establishmentName}</p>
				</div>
				<StampCampaignCards rows={[item.campaign]} title="" />
			</div>
		</Link>
	);
}

function StampCardsSection({
	title,
	items,
}: {
	title: string;
	items: UserStampCardItem[];
}): ReactElement | null {
	if (items.length === 0) {
		return null;
	}

	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-sm font-medium text-foreground">{title}</h2>
			<ul className="flex flex-col gap-4">
				{items.map((item) => (
					<li key={`${item.establishmentSlug}-${item.campaign.campaignId}`}>
						<StampCardItem item={item} />
					</li>
				))}
			</ul>
		</section>
	);
}

function NoEstablishmentsEmptyState(): ReactElement {
	return (
		<Card>
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted">
					Aún no tienes locales vinculados. Explora la app o únete a un establecimiento para
					empezar a acumular sellos.
				</p>
				<div className="flex flex-col gap-2">
					<Link
						href={platformRoutes.homeTab("explore")}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Explorar locales
					</Link>
					<Link
						href={platformRoutes.homeTab("locales")}
						className="text-center text-sm font-medium text-primary hover:opacity-80"
					>
						Unirse por identificador
					</Link>
				</div>
			</div>
		</Card>
	);
}

function NoStampCardsEmptyState(): ReactElement {
	return (
		<Card>
			<p className="text-sm text-muted">
				Aún no tienes tarjetas de sellos en curso. Visita un local y escanea tu QR para empezar a
				acumular sellos.
			</p>
		</Card>
	);
}

export function PlatformUserStampCardsTab(): ReactElement {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<ReturnType<typeof buildUserStampCardsSummary> | null>(null);
	const [hasEstablishments, setHasEstablishments] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function load(): Promise<void> {
			const response = await platformFetch("/api/user/me/relationships");

			if (cancelled) {
				return;
			}

			if (!response.ok) {
				setError("No se pudieron cargar tus tarjetas");
				setLoading(false);

				return;
			}

			const data = (await response.json()) as UserRelationshipsResponse;
			setHasEstablishments(data.establishments.length > 0);
			setSummary(buildUserStampCardsSummary(data.establishments));
			setError(null);
			setLoading(false);
		}

		void load();

		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return <p className="text-sm text-muted">Cargando tarjetas…</p>;
	}

	if (error) {
		return <p className="text-sm text-error">{error}</p>;
	}

	if (!summary) {
		return <p className="text-sm text-error">No se pudieron cargar tus tarjetas</p>;
	}

	if (!hasEstablishments) {
		return <NoEstablishmentsEmptyState />;
	}

	if (summary.inProgress.length === 0 && summary.completed.length === 0) {
		return <NoStampCardsEmptyState />;
	}

	return (
		<div className="flex flex-col gap-6">
			<StampCardsSection title="En curso" items={summary.inProgress} />
			<StampCardsSection title="Completadas" items={summary.completed} />
		</div>
	);
}
