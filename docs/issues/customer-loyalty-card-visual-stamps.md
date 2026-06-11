## Objetivo

Mostrar progreso de sellos con sprites visuales en la tarjeta de fidelización del cliente (tenant `/app/card` y app personal).

## Contexto

Phase J6 — depende de J3 + J4. Cierra Phase J para el usuario final.

## Alcance

| In | Fuera |
|----|-------|
| Sección Sellos de `LoyaltyCard` usa `LoyaltyProgress` por campaña | Rediseño completo de QR/puntos |
| Platform app: `PlatformEstablishmentDetail`, resúmenes si aplica | Promociones texto como sprites |
| Respeta `visualTemplate` de API; fallback `generic` | |

## Criterios de aceptación

- [ ] Cliente ve fila visual de sellos (no solo `7 / 10` texto) por campaña activa
- [ ] Colores coherentes con branding tenant / theme tokens
- [ ] `npm run verify:customer-stamp-progress` + `verify:platform-app-establishment-detail` OK
- [ ] Campaña completada: estado visual distinguible (`completed`)

## Capas / archivos principales

- `src/app/_components/loyalty/LoyaltyCard.tsx`
- `src/app/_components/loyalty/CustomerCardContent.tsx`
- `src/app/(mobile)/home/establishments/[slug]/PlatformEstablishmentDetail.tsx`
- `src/app/_components/platform-app/formatStampProgressLine.ts` (ajuste o convivencia)

## Issues relacionadas

- `owner-stamp-campaign-visual-picker.md` (J5)
- `loyalty-progress-component.md` (J3)

## Referencias

- [`visual-assets-system.md`](../domain/visual-assets-system.md)
