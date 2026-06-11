## Objetivo

Vincular cada campaña de sellos a un tipo de consumición (o «Visita general» si no hay tipo).

## Contexto

Phase H2 — requiere H1 (`stamp_types`).

## Alcance

| In | Fuera |
|----|-------|
| `stamp_type_id` en `stamp_campaigns` | Cambiar reglas de `requiredStamps` |
| Extender CRUD campañas + dropdown en settings | |

## Criterios de aceptación

- [ ] POST campaña con `stampTypeId` opcional
- [ ] Campaña tipada no avanza en escaneo de otro tipo (H3)
- [ ] `verify:stamp-campaigns*` actualizado

## Verify

```bash
npm run verify:stamp-campaigns-use-case
npm run verify:stamp-campaigns
```
