## Objetivo

Componente React `LoyaltyProgress` que compone sprites SVG según progreso de sellos (filled / empty / reward).

## Contexto

Phase J3 — depende de J2 (sprites en `public/assets/loyalty/`).

## Alcance

| In | Fuera |
|----|-------|
| `<LoyaltyProgress template current required completed? />` | Integración en LoyaltyCard (J6) |
| Algoritmo de render del doc (última posición = reward) | Persistencia / API |
| Tamaños 40 / 56 / 64 px + reward ~1.15× | Animaciones complejas |

## Criterios de aceptación

- [ ] Props tipadas; template inválido → fallback `generic`
- [ ] `current=7`, `required=10` → 7 filled + 2 empty + 1 reward visible
- [ ] Empty al 30% opacity; reward con acento dorado (token theme)
- [ ] Export en `src/app/_components/loyalty/LoyaltyProgress.tsx` (+ helper `loyaltyVisualTemplates.ts` si aplica)
- [ ] Story o verify mínimo documentado en comentario / script opcional

## Capas / archivos principales

- `src/app/_components/loyalty/LoyaltyProgress.tsx`
- `src/app/_components/loyalty/loyaltyVisualTemplates.ts` (registry + paths)

## Issues relacionadas

- `loyalty-svg-sprite-library.md` (J2)
- `stamp-campaign-visual-template-api.md` (J4)

## Referencias

- [`visual-assets-system.md`](../domain/visual-assets-system.md)
