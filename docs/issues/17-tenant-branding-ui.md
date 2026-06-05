## Objetivo

UI para que el owner configure branding y vea el progreso en el dashboard.

Parte de **Phase A — slices A2 + A3 + A4** en [`docs/domain/post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md).

## Contexto

- Depende de **#16** (`PATCH /api/tenant/branding`).
- `/home` hoy solo muestra tarjetas «Próximamente» ([`HomeDashboard.tsx`](../../src/app/(app)/home/HomeDashboard.tsx)).
- `ThemeProvider` / `TenantSessionProvider` ya aplican colores del tenant en sesión.

## Alcance

| In | Fuera |
|----|-------|
| Página `(app)/settings/branding` (o sección en `/profile`) | Upload de imagen |
| Formulario: logo URL, color primario, color secundario | Checklist completa Step 6 (rewards, empleados, etc.) |
| Tras guardar: `applyTheme` + refrescar sesión tenant sin re-login | Plan selection |

## Criterios de aceptación

- [ ] Owner accede a ajustes de branding desde el shell (`TenantAdminShell`).
- [ ] Submit llama `PATCH /api/tenant/branding` con `credentials: include`.
- [ ] Colores y logo se reflejan en sidebar y tema sin cerrar sesión.
- [ ] `/home` muestra ítem de checklist «Completa tu branding» (hecho / pendiente según defaults vs personalizado).
- [ ] `npm run verify:tenant-branding` — script E2E: login owner → PATCH → GET `/api/me` + assert Prisma.
- [ ] Docs: Step 5 branding **partial** en `business-onboarding.md`; fila en `AGENTS.md`.

## Capas / archivos principales

- `src/app/(app)/settings/branding/page.tsx`
- Componente formulario (reutilizar `Field`, `Input`, inputs `type=color`)
- `src/app/(app)/home/HomeDashboard.tsx` — checklist
- `scripts/verify-tenant-branding.ts` + `package.json`

## Verificación manual

1. Owner en `/home` → enlace a branding → guardar colores → sidebar y fondo actualizados.
2. Recargar `/home` → checklist marca branding completado.

## Referencias

- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Phase A
- [`docs/frontend/style-guidelines.md`](../frontend/style-guidelines.md)
