## Objetivo

Fundación del módulo de **moderación** para revisar contenido reportado (negocios, promos) — UI y modelo, sin ML.

## Contexto

- Marcado «para el futuro» en [`docs/superadmin.md`](../superadmin.md) § Moderación.
- MVP: cola manual vacía + API extensible.

## Alcance

| In | Fuera |
|----|-------|
| Tabla `moderation_reports` (reporter, targetType, targetId, reason, status) | Report flow desde app cliente |
| `/platform/moderation` cola open/resolved | Auto-detección fraude |
| Acciones: marcar resuelto, suspender tenant (link P2) | Legal export |

## Criterios de aceptación

- [ ] Superadmin ve cola (seed vacío OK).
- [ ] Suspender desde reporte llama flujo tenant status existente.
- [ ] Verify use case stub.

## Capas / archivos principales

- Domain + Prisma + platform API
- Nav entry con badge count (0 default)

## Issues relacionadas

- `platform-admin-tenant-detail.md` (P2)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
