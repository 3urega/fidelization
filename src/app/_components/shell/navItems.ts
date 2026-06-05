/**
 * Static navigation for the tenant admin shell.
 * To add a module: append an entry with href, label, and icon key; create the page under (app)/.
 */
export type TenantAdminNavIcon = "home" | "user" | "palette";

export type TenantAdminNavItem = {
	href: string;
	label: string;
	icon: TenantAdminNavIcon;
	ownerOnly?: boolean;
};

export const tenantAdminNav: readonly TenantAdminNavItem[] = [
	{ href: "/home", label: "Inicio", icon: "home" },
	{ href: "/settings/branding", label: "Branding", icon: "palette", ownerOnly: true },
	{ href: "/profile", label: "Perfil", icon: "user" },
] as const;
