## Objetivo

Integrar el grid de exploración en `/home` y `/home/discover`, documentar la decisión de producto y cerrar con verify E2E.

## Contexto

Phase I3 — cierra Phase I. El usuario autenticado ve el catálogo al entrar en la app (`/home`), encima de «Mis negocios» / «Mis locales». `/home/discover` reutiliza el grid + formulario unirse por slug.

## Alcance

| In | Fuera |
|----|-------|
| `EstablishmentDiscoverGrid` en `PlatformUserDashboard` | Reemplazar sección «Mis locales» |
| `/home/discover` con grid + join por slug | Eliminar join manual |
| Docs `customer-platform-app.md` + roadmap Phase I | Búsqueda / categorías |
| `verify:platform-app-discover-establishments` | Publicar en stores |

## Criterios de aceptación

- [ ] `/home` muestra sección «Explorar locales» con grid tras login
- [ ] `/home/discover` muestra el mismo grid (sin heading duplicado) + unirse por identificador
- [ ] Documentación actualizada en dominio y `AGENTS.md` (scripts verify)
- [ ] `npm run verify:platform-app-discover-establishments` (dev server + sesión user)

## Capas / archivos principales

- `src/app/(mobile)/home/PlatformUserDashboard.tsx`
- `src/app/(mobile)/home/discover/page.tsx`
- `docs/domain/customer-platform-app.md`
- `docs/domain/post-onboarding-mvp-roadmap.md`
- `AGENTS.md`
- `package.json` (scripts verify)
- `scripts/verify-platform-app-discover-establishments.ts`

## Issues relacionadas

- [#46](https://github.com/3urega/fidelization/issues/46) (cerrada)
- [#47](https://github.com/3urega/fidelization/issues/47) (cerrada)

## Referencias

- [post-onboarding-mvp-roadmap.md](../domain/post-onboarding-mvp-roadmap.md) — Phase I

## Verify

```bash
npm run verify:platform-app-discover-establishments
```
