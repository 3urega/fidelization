"use client";

import { type ReactElement } from "react";

import { Button } from "../../../_components/ui/Button";
import { Card } from "../../../_components/ui/Card";

export type UserSearchZoneJson = {
	label: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

type PlatformUserProfilePersonalTabProps = {
	name: string;
	email: string;
	searchZone: UserSearchZoneJson | null;
};

function scrollToSearchZone(): void {
	document.getElementById("search-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PlatformUserProfilePersonalTab({
	name,
	email,
	searchZone,
}: PlatformUserProfilePersonalTabProps): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<Card className="flex flex-col gap-3">
				<div>
					<p className="text-sm font-medium text-foreground">Nombre</p>
					<p className="mt-1 text-sm text-muted">{name}</p>
				</div>
				<div>
					<p className="text-sm font-medium text-foreground">Email</p>
					<p className="mt-1 text-sm text-muted">{email}</p>
				</div>
			</Card>

			<section id="search-zone" className="flex flex-col gap-3 scroll-mt-4">
				<h2 className="text-sm font-medium text-foreground">Zona de búsqueda</h2>

				{searchZone ? (
					<Card className="flex flex-col gap-3">
						<p className="text-sm text-muted">
							Exploras locales cerca de{" "}
							<span className="font-medium text-foreground">{searchZone.label}</span>.
						</p>
						<Button type="button" variant="secondary" className="w-full" onClick={scrollToSearchZone}>
							Cambiar zona
						</Button>
					</Card>
				) : (
					<Card className="flex flex-col gap-3">
						<p className="text-sm text-muted">
							Elige dónde quieres explorar locales. Tu zona se usará en «Explorar» en lugar de
							pedirte la ubicación cada vez.
						</p>
						<Button type="button" className="w-full" onClick={scrollToSearchZone}>
							Establecer zona de búsqueda
						</Button>
					</Card>
				)}

				<p className="text-xs text-muted">
					Pronto podrás configurar tu zona en el mapa desde aquí.
				</p>
			</section>
		</div>
	);
}

export function PlatformUserProfileStampCardsPlaceholderTab(): ReactElement {
	return (
		<Card className="flex flex-col gap-2">
			<p className="text-sm text-muted">
				Aquí verás un resumen de tus tarjetas de sellos activas y completadas en todos tus
				locales.
			</p>
			<p className="text-sm font-medium text-foreground">Próximamente</p>
		</Card>
	);
}
