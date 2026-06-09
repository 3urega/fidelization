## Objetivo

UI owner en **`/settings/team`**: formulario para invitar empleado, lista del equipo, checklist en `/home` (*Invita a tu empleado*), y verify E2E que cierra Phase D para empleados.

Slice **D4** — depende de **tenant-employees-api**.

## Contexto

- API de empleados implementada en issue previa del batch.
- Patrón UI: [`StampCampaignsForm`](../../src/app/_components/loyalty/StampCampaignsForm.tsx), [`/settings/stamps`](../../src/app/(app)/settings/stamps/page.tsx), nav owner-only en [`navItems.ts`](../../src/app/_components/shell/navItems.ts).

## Alcance

| In | Fuera |
|----|-------|
| `/settings/team` + nav «Equipo» (owner-only) | Email invite / SSO |
| `TenantEmployeesForm` — crear + listar | Editar rol / desactivar empleado |
| Checklist item en [`HomeDashboard.tsx`](../../src/app/(app)/home/HomeDashboard.tsx) | Permisos granulares por ruta |
| `verify:tenant-employees` E2E: owner crea employee → employee login → `/scan` 200 | Capacitor |

## Criterios de aceptación

- [ ] Owner ve formulario nombre + email + contraseña temporal; tras crear, empleado aparece en lista.
- [ ] Nav «Equipo» solo visible para owner.
- [ ] `/home` marca checklist completado cuando hay ≥1 empleado (o tras primera invitación exitosa).
- [ ] E2E: empleado inicia sesión en tenant host → `GET /home` 200 → `POST /api/loyalty/scan` OK con QR de cliente demo.
- [ ] `verify:tenant-employees` pasa (dev + `DATABASE_URL`).
- [ ] `AGENTS.md` + `post-onboarding-mvp-roadmap.md` actualizados; Phase D employees marcada.

## Capas / archivos principales

- `src/app/(app)/settings/team/page.tsx`
- `src/app/_components/tenant/TenantEmployeesForm.tsx` (o `loyalty/`)
- `src/app/_components/shell/navItems.ts`, `NavIcon.tsx`
- `src/app/(app)/home/HomeDashboard.tsx`
- `scripts/verify-tenant-employees.ts`
- `package.json`, `AGENTS.md`, roadmap

## Issues relacionadas

- **tenant-employees-api** — prerrequisito
- **rewards-crud-api**, **customer-reward-redeem** — mismo batch Phase D

## Referencias

- [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md) — Phase D
- Issue #21 VS3 pattern — nav + checklist + verify E2E
