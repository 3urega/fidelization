## Objetivo

Persistir y exponer la plantilla visual elegida por el owner en cada campaña de sellos (`visualTemplate`).

## Contexto

Phase J4 — dominio + API. Depende de J1 (enum documentado). J5/J6 consumen el campo.

## Alcance

| In | Fuera |
|----|-------|
| Migración Prisma: `stamp_campaigns.visual_template` (default `generic`) | Campo en `promotions` |
| Migración: `stamp_campaigns.card_background_variant` (default `coffee-photo`) | Fondos custom upload |
| Validación enum en `CreateStampCampaign` / `UpdateStampCampaign` | Templates custom upload |
| `POST/GET/PATCH /api/loyalty/stamp-campaigns` incluyen `visualTemplate` | |
| `stampProgress[]` en APIs cliente incluyen `visualTemplate` por campaña | |

## Criterios de aceptación

- [ ] Migración aplicada; campañas existentes → `generic`
- [ ] Owner puede setear `visualTemplate` al crear/editar; employee GET only
- [ ] `GET /api/loyalty/me` y APIs platform user detail incluyen `visualTemplate` en cada fila de `stampProgress`
- [ ] `npm run verify:stamp-campaigns-use-case` + `verify:stamp-campaigns` actualizados
- [ ] `npm run verify:customer-stamp-progress*` regresión OK

## Capas / archivos principales

- `prisma/schema.prisma` + migración
- `src/contexts/loyalty/stamp_campaigns/`
- `src/contexts/loyalty/customers/application/profile/GetCustomerStampProgress.ts`
- `src/lib/auth/http.ts` (`stampProgressToJson`)
- `scripts/verify-stamp-campaigns*.ts`

## Issues relacionadas

- `loyalty-progress-component.md` (J3)
- `owner-stamp-campaign-visual-picker.md` (J5)

## Referencias

- [`visual-assets-system.md`](../domain/visual-assets-system.md)
