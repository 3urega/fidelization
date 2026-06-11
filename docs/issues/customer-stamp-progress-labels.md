## Objetivo

El cliente ve qué carril de sellos corresponde a cada campaña (`stampTypeLabel`).

## Contexto

Phase H4 — UI en `LoyaltyCard` + APIs GET me / establishment detail.

## Alcance

| In | Fuera |
|----|-------|
| `stampTypeLabel` en `stampProgress[]` | Canje al completar sello |

## Criterios de aceptación

- [ ] Genéricas muestran «Visita general»
- [ ] Tipadas muestran etiqueta del catálogo
- [ ] `verify:customer-stamp-progress*` extendido

## Verify

```bash
npm run verify:customer-stamp-progress-use-case
npm run verify:customer-stamp-progress
```
