import type { TenantPlanFeature } from "../../contexts/billing/subscriptions/domain/TenantPlanFeature";

export type PlatformFeatureCatalogEntry = {
	key: TenantPlanFeature;
	label: string;
	description: string;
	enforced: boolean;
};

export const PLATFORM_PLAN_FEATURE_CATALOG: PlatformFeatureCatalogEntry[] = [
	{ key: "stamps", label: "Sellos", description: "Tarjetas de sellos", enforced: false },
	{ key: "points", label: "Puntos", description: "Programa de puntos", enforced: false },
	{
		key: "promotions",
		label: "Promociones",
		description: "CRUD promociones owner (Pro+)",
		enforced: true,
	},
	{ key: "coupons", label: "Cupones", description: "Cupones (API pendiente)", enforced: false },
	{ key: "push", label: "Push", description: "Notificaciones push (API pendiente)", enforced: false },
	{
		key: "gamification",
		label: "Gamificación",
		description: "Juegos / ruleta (biblioteca P11; motor pendiente)",
		enforced: false,
	},
	{
		key: "referrals",
		label: "Referidos",
		description: "Programa referidos (API pendiente)",
		enforced: false,
	},
	{ key: "analytics", label: "Analítica", description: "Analítica avanzada", enforced: false },
];

export const PLATFORM_FEATURE_PRECEDENCE =
	"Override por tenant gana cuando la clave está definida; si no, aplica el catálogo del plan.";
