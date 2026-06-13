## Objetivo

**Biblioteca global de plantillas** de campañas de sellos que los owners puedan adoptar al crear campañas.

## Contexto

- Owner hoy crea campañas desde cero en `/settings/stamps` (#21).
- Ejemplos producto: «10 cafés = 1 gratis», croissants, matcha ([`docs/superadmin.md`](../superadmin.md) § Biblioteca de Campañas).

## Alcance

| In | Fuera |
|----|-------|
| Tabla `platform_campaign_templates` (o equivalente) | Publicación automática en todos los tenants |
| CRUD superadmin: nombre, descripción, `requiredStamps`, `stampTypeId` sugerido, assets | Editor visual drag-and-drop |
| Owner: «Usar plantilla» al crear campaña (copia local al tenant) | Plantillas de promociones (otro issue) |
| `GET/POST/PATCH /api/platform/campaign-templates` | |

## Criterios de aceptación

- [ ] Plantilla inactiva no visible para owners.
- [ ] Adoptar plantilla crea campaña tenant-scoped normal.
- [ ] Verify use case + E2E owner adopt flow.

## Capas / archivos principales

- Nuevo subdominio ligero en `loyalty/` o `platform/`
- Migración Prisma
- UI `/platform/campaign-templates`

## Issues relacionadas

- `platform-admin-feature-flags-editor.md` (P7)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
