## Objetivo

Permitir al owner definir tipos de consumición (Café, Menú…) que el empleado verá al escanear.

## Contexto

Phase H — [`post-onboarding-mvp-roadmap.md`](../domain/post-onboarding-mvp-roadmap.md). Depende de Phase C (stamp campaigns).

## Alcance

| In | Fuera |
|----|-------|
| Tabla `stamp_types`, dominio + API owner | Iconos, drag-and-drop reorder |
| `GET/POST /api/loyalty/stamp-types`, `PATCH …/[id]` | Employee POST/PATCH |
| UI en `/settings/stamps` | |

## Criterios de aceptación

- [ ] Owner crea/desactiva tipos; employee 403 en mutaciones
- [ ] `npm run verify:stamp-types-use-case`
- [ ] `npm run verify:stamp-types` (dev + DATABASE_URL)

## Verify

```bash
npm run verify:stamp-types-use-case
npm run verify:stamp-types
```
