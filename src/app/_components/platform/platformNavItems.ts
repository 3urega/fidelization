/**
 * Static navigation for the platform admin shell.
 * To add a module: append an entry with href, label, and icon key; create the page under (platform)/platform/.
 */
export type PlatformNavIcon = "home" | "building" | "users" | "clients" | "plans" | "billing" | "flags" | "chart";

export type PlatformNavItem = {
	href: string;
	label: string;
	icon: PlatformNavIcon;
	comingSoon?: boolean;
};

export const platformNav: readonly PlatformNavItem[] = [
	{ href: "/platform", label: "Resumen", icon: "home" },
	{ href: "/platform/tenants", label: "Negocios", icon: "building" },
	{ href: "/platform/owners", label: "Comerciantes", icon: "users" },
	{ href: "/platform/users", label: "Clientes", icon: "clients" },
	{ href: "/platform/plans", label: "Planes", icon: "plans" },
	{ href: "/platform/billing", label: "Facturación", icon: "billing" },
	{ href: "/platform/features", label: "Feature flags", icon: "flags" },
	{ href: "/platform/analytics", label: "Analítica", icon: "chart" },
] as const;
