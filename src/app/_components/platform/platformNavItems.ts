/**
 * Static navigation for the platform admin shell.
 * To add a module: append an entry with href, label, and icon key; create the page under (platform)/platform/.
 */
export type PlatformNavIcon = "building" | "plans" | "chart";

export type PlatformNavItem = {
	href: string;
	label: string;
	icon: PlatformNavIcon;
	comingSoon?: boolean;
};

export const platformNav: readonly PlatformNavItem[] = [
	{ href: "/platform", label: "Negocios", icon: "building" },
	{ href: "/platform/plans", label: "Planes", icon: "plans", comingSoon: true },
	{ href: "/platform/analytics", label: "Analítica", icon: "chart", comingSoon: true },
] as const;
