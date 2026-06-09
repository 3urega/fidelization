## Objetivo

UI owner para **gestionar promociones** en `/settings/promotions`, entrada en nav del shell, y checklist en `/home` cuando el tenant Pro+ no tiene ninguna promo activa.

## Contexto

- Depende de: **promotions-owner-crud-api** (API CRUD operativa).
- Patrón: [`/settings/stamps`](../../src/app/(app)/settings/stamps/page.tsx), [`StampCampaignsForm`](../../src/app/_components/loyalty/StampCampaignsForm.tsx).
- Plan Basic: mostrar mensaje de upgrade (planFeatures desde `/api/me`) sin formulario editable.

## Alcance

| In | Fuera |
|----|-------|
| `/settings/promotions` — listar, crear, desactivar promos | Editar promo inactiva reactivando (PATCH isActive true OK si API lo soporta) |
| `PromotionsForm` client component | Calendario avanzado / reglas `conditions` |
| Nav owner-only en `TenantAdminShell` | Employee acceso settings promos |
| Checklist `/home`: «Crea tu primera promoción» hasta 1+ promo activa (owner Pro+) | Placeholder «Promociones — Próximamente» en grid (reemplazar o mantener analítica) |
| Mensaje si plan Basic: enlace a `/onboarding/plan` | Customer UI |

## Criterios de aceptación

- [ ] Owner Pro+ accede a `/settings/promotions` y crea promo desde UI.
- [ ] Lista muestra promos con estado activo/inactivo.
- [ ] Desactivar promo desde UI refleja PATCH API.
- [ ] Owner Basic ve aviso plan Pro requerido (no formulario POST).
- [ ] `/home` checklist marca promoción completada con ≥1 promo activa.
- [ ] Nav «Promociones» visible solo owner (consistente con stamps/branding).
- [ ] UI theme-driven (tokens, sin colores hardcodeados).

## Capas / archivos principales

- `src/app/(app)/settings/promotions/page.tsx`
- `src/app/_components/loyalty/PromotionsForm.tsx`
- `src/app/_components/shell/TenantAdminShell.tsx` — nav link
- `src/app/(app)/home/HomeDashboard.tsx` — checklist + fetch promos
- `AGENTS.md` — ruta `/settings/promotions`

## Issues relacionadas

- Depende de: `promotions-owner-crud-api.md`
- Relacionada: `promotions-customer-card.md`

## Referencias

- [Platform Mobile App](../domain/customer-platform-app.md) — promos en detalle local (Phase G)
- [`HomeDashboard.tsx`](../../src/app/(app)/home/HomeDashboard.tsx)
