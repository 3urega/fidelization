/**
 * Static navigation for the tenant admin shell.
 * To add a module: append an entry with href, label, and icon key; create the page under (app)/.
 */
export type TenantAdminNavIcon =
	| "home"
	| "user"
	| "palette"
	| "scan"
	| "customers"
	| "stamps"
	| "promotions"
	| "team"
	| "store";

export type TenantAdminNavItem = {
	href: string;
	label: string;
	icon: TenantAdminNavIcon;
	ownerOnly?: boolean;
};

export const tenantAdminNav: readonly TenantAdminNavItem[] = [
	{ href: "/panel", label: "Inicio", icon: "home" },
	{ href: "/scan", label: "Escanear QR", icon: "scan" },
	{ href: "/customers", label: "Clientes", icon: "customers", ownerOnly: true },
	{ href: "/settings/branding", label: "Branding", icon: "palette", ownerOnly: true },
	{ href: "/settings/profile", label: "Datos del negocio", icon: "store", ownerOnly: true },
	{ href: "/settings/stamps", label: "Sellos", icon: "stamps", ownerOnly: true },
	{ href: "/settings/promotions", label: "Promociones", icon: "promotions", ownerOnly: true },
	{ href: "/settings/team", label: "Equipo", icon: "team", ownerOnly: true },
	{ href: "/profile", label: "Perfil", icon: "user" },
] as const;
