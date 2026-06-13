import type { ReactElement } from "react";

const BENEFITS = [
	{
		icon: "☕",
		title: "Acumula sellos",
		description: "Cada visita cuenta.",
	},
	{
		icon: "🎁",
		title: "Consigue premios",
		description: "Cafés gratis, descuentos y promociones.",
	},
	{
		icon: "❤️",
		title: "Descubre nuevos locales",
		description: "Explora negocios que usan Fideli.",
	},
] as const;

export function PlatformPublicHomeBenefits(): ReactElement {
	return (
		<section aria-label="Beneficios" className="flex flex-col gap-4">
			{BENEFITS.map((benefit) => (
				<article
					key={benefit.title}
					className="flex gap-3 rounded-theme border border-border bg-background/60 px-4 py-3"
				>
					<span className="text-xl leading-none" aria-hidden>
						{benefit.icon}
					</span>
					<div className="flex flex-col gap-0.5">
						<h2 className="text-sm font-semibold text-foreground">{benefit.title}</h2>
						<p className="text-sm text-muted">{benefit.description}</p>
					</div>
				</article>
			))}
		</section>
	);
}
