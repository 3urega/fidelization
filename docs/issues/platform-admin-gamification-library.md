## Objetivo

Sentar la **biblioteca de juegos** (gamificación) a nivel plataforma: catálogo, estados y gating por plan, sin motor completo.

## Contexto

- Producto futuro: ruleta, rasca y gana, caja misteriosa ([`docs/superadmin.md`](../superadmin.md) § Biblioteca de Juegos).
- Premium / add-ons en [`business-model.md`](../domain/business-model.md); sin engine implementado.

## Alcance

| In | Fuera |
|----|-------|
| Modelo `platform_games` (id, slug, label, status: draft/active/beta) | Lógica de juego playable |
| CRUD superadmin `/platform/games` | Integración POS |
| Vincular juego ↔ feature flag key | Ruleta 3D / animaciones |
| Owners ven juegos disponibles según plan (read-only stub) | |

## Criterios de aceptación

- [ ] Superadmin crea/desactiva juegos; tenant no muta catálogo global.
- [ ] Feature flag `gamification` (o por juego) controla visibilidad.
- [ ] Verify use case dominio stub.

## Capas / archivos principales

- Prisma + use cases CRUD
- Placeholder UI owner «Próximamente» hasta engine

## Issues relacionadas

- `platform-admin-feature-flags-editor.md` (P7)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
