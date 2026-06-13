## Objetivo

Mover el acceso a **Clientes** del tab Dashboard al **menú lateral** owner y preparar la ruta `/customers` en el shell tenant.

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Hoy [`StampCampaignDashboardPanel`](../../src/app/_components/loyalty/StampCampaignDashboardPanel.tsx) incluye card «Clientes — Próximamente»; debe eliminarse. Nav estático en [`navItems.ts`](../../src/app/_components/shell/navItems.ts).

## Alcance

| In | Fuera |
|----|-------|
| Entrada nav `{ href: "/customers", label: "Clientes", icon: "customers", ownerOnly: true }` | Contenido analytics (L4–L6) |
| Icono `customers` en `NavIcon` + tipo en `TenantAdminNavIcon` | API fetch |
| Página `(app)/customers/page.tsx` con `PageHeader` + placeholder mínimo o shell vacío listo para L4 | Cambios middleware |
| Quitar `ClientesPlaceholderCard` de `StampCampaignDashboardPanel` | |

## Criterios de aceptación

- [ ] Owner ve «Clientes» en sidebar (desktop + mobile drawer); empleado no
- [ ] `/customers` carga dentro de `TenantAdminShell` (200 con sesión owner)
- [ ] Tab Dashboard ya no muestra card Clientes
- [ ] `npm run verify:owner-login` sigue pasando

## Capas / archivos principales

- [`navItems.ts`](../../src/app/_components/shell/navItems.ts)
- [`NavIcon.tsx`](../../src/app/_components/shell/NavIcon.tsx)
- `src/app/(app)/customers/page.tsx`
- [`StampCampaignDashboardPanel.tsx`](../../src/app/_components/loyalty/StampCampaignDashboardPanel.tsx)

## Issues relacionadas

- L4: UI segmentos (`customer-zone-segments-ui.md`)

## Referencias

- [zona-clientes.md](../zona-clientes.md)
- [style-guidelines.md](../frontend/style-guidelines.md)
