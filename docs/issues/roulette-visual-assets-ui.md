## Objetivo

Integrar la ruleta en la app del cliente: componente animado, assets visuales en `public/assets/games/ruleta/`, CTA en detalle del local y flujo completo spin → resultado. Las **imágenes las genera un agente externo** con los prompts de esta issue; el implementador las coloca en rutas indicadas y cablea la UI.

## Contexto

Phase V — [`roulette-game.md`](../domain/roulette-game.md). Depende de **V4** (APIs spin). Sigue [`visual-assets-system.md`](../domain/visual-assets-system.md): SVG preferido, theme tokens para tintes, sin colores hardcodeados en componentes.

## Alcance

| In | Fuera |
|----|-------|
| Componente `RouletteWheel` (client-only, animación ~3–4s) | Generación de imágenes (prompts abajo; otro agente) |
| Integración en `PlatformEstablishmentDetail` — CTA si `canSpin` | Editor owner con preview rico (V3 usa preview mínimo) |
| Ruta/modal `/home/establishments/[slug]/ruleta` | Sonido/haptic Capacitor (v2) |
| Registry `rouletteAssets.ts` — paths + metadata | WebGL / librerías 3D pesadas |
| Pantalla resultado premio + estados locked/empty | Confetti animado en canvas (PNG estático OK) |
| `npm run verify:roulette-spin-e2e` (UI smoke con dev server) | Canje staff (V7) |

## Criterios de aceptación

- [ ] Animación **después** de `POST spin`; ángulo derivado de `segmentIndex` devuelto por servidor
- [ ] Colores de segmentos: tenant primary + palette theme; iconos desde assets
- [ ] Todos los assets listados abajo existen en `public/assets/games/ruleta/` (SVG o PNG @2x según prompt)
- [ ] `canSpin === false` muestra ilustración locked + copy claro
- [ ] Mobile-first; usable en Capacitor WebView
- [ ] `npm run verify:roulette-spin-e2e`

## Capas / archivos principales

- `public/assets/games/ruleta/*` (generados externamente)
- `src/app/_components/loyalty/games/rouletteAssets.ts`
- `src/app/_components/loyalty/games/RouletteWheel.tsx`
- `src/app/_components/loyalty/games/RouletteSpinModal.tsx` (o página dedicada)
- Cambios en `PlatformEstablishmentDetail.tsx`
- `scripts/verify-roulette-spin-e2e.ts`

## Issues relacionadas

- `roulette-spin-api.md` (previa)
- `roulette-scan-eligibility.md` (CTA real tras visita)

---

## Prompts para generación de imágenes (agente especializado)

**Guía de estilo global (aplicar a TODOS los prompts):**

> Flat vector illustration for a mobile loyalty app aimed at cafés and small restaurants. Warm, friendly, premium-but-accessible. Rounded shapes, soft shadows, no photorealism. Palette base: warm browns (#6F4E37 coffee), cream (#F5F0E8), accent gold (#D4A853), success green (#4A9B6E). Transparent background unless noted. Output SVG preferred; if PNG, 1024×1024 @2x with alpha. Consistent line weight ~2px, no tiny text inside icons. Must work on light and dark UI (avoid pure white fills; use cream/off-white).

### 1. `wheel-pointer.svg`

**Ruta:** `public/assets/games/ruleta/wheel-pointer.svg`

**Prompt:**

> Flat vector roulette pointer/indicator fixed at the top center of a wheel. Downward-pointing teardrop or triangular pin with rounded tip, coffee-brown body (#6F4E37) and gold highlight stripe (#D4A853). Small subtle shadow beneath tip. Symmetrical, ~80×100px viewBox. Transparent background. Mobile game UI asset, friendly café loyalty style.

### 2. `wheel-center-button.svg`

**Ruta:** `public/assets/games/ruleta/wheel-center-button.svg`

**Prompt:**

> Circular spin button for center of a prize wheel. Diameter ~120px viewBox. Gold gradient ring (#D4A853 to #B8893A), cream inner circle (#F5F0E8), subtle coffee-brown border. Center text "GIRAR" in bold rounded sans-serif, dark brown #3D2B1F — legible at small size. Flat vector with soft drop shadow. Café loyalty app, inviting and tappable.

### 3. `wheel-outer-ring.svg`

**Ruta:** `public/assets/games/ruleta/wheel-outer-ring.svg`

**Prompt:**

> Decorative outer ring/frame for a circular roulette wheel, donut shape with transparent center (70% inner cutout). Ornate but clean: double gold rim (#D4A853) with small tick marks around circumference suggesting segments. Coffee-brown accents (#6F4E37). 512×512 viewBox, transparent outside ring. Flat vector, no segment fills — frame only.

### 4. `wheel-background-pattern.svg`

**Ruta:** `public/assets/games/ruleta/wheel-background-pattern.svg`

**Prompt:**

> Subtle seamless circular background texture for roulette wheel face. Very light cream (#F5F0E8) with faint coffee bean silhouettes and steam swirls at 8% opacity. 512×512, suitable as CSS background under colored segments. Flat vector, elegant, not busy.

### 5. `prize-icon-points.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-points.svg`

**Prompt:**

> Icon for "bonus points" prize on a loyalty wheel segment. Stack of three golden coins with a small "+" sparkle. Colors: gold #D4A853, brown shadow #6F4E37. 96×96 viewBox, transparent background. Flat vector, readable at 32px display size.

### 6. `prize-icon-stamp.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-stamp.svg`

**Prompt:**

> Icon for "bonus stamp" prize on loyalty wheel. Coffee cup stamp badge: circular seal outline with coffee cup silhouette inside, one checkmark. Colors coffee brown #6F4E37, cream fill #F5F0E8, gold star accent #D4A853. 96×96, flat vector, transparent background.

### 7. `prize-icon-promo.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-promo.svg`

**Prompt:**

> Icon for "discount promotion" wheel segment. Price tag or ticket with "%" symbol, folded corner ribbon. Green accent #4A9B6E, brown outline #6F4E37, cream tag body. 96×96 flat vector, transparent background, friendly café promo style.

### 8. `prize-icon-gift.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-gift.svg`

**Prompt:**

> Icon for physical prize (free coffee/item). Small gift box with ribbon bow, coffee cup peeking from top. Brown box #6F4E37, gold ribbon #D4A853, cream cup. 96×96 flat vector, transparent background, celebratory but not cluttered.

### 9. `prize-icon-jackpot.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-jackpot.svg`

**Prompt:**

> Icon for rare jackpot segment on loyalty wheel. Trophy cup or crown with three stars burst behind. Gold #D4A853 dominant, coffee brown details #6F4E37, tiny sparkle dots. 96×96 flat vector, transparent background, premium feel.

### 10. `prize-icon-none.svg`

**Ruta:** `public/assets/games/ruleta/prize-icon-none.svg`

**Prompt:**

> Icon for "no prize / try again" wheel segment. Friendly neutral face or four-leaf clover crossed out softly — not sad or negative. Muted gray-brown #9A8B7A, cream accent, gentle expression. 96×96 flat vector, transparent background, encouraging tone ("¡Suerte la próxima!").

### 11. `state-locked.svg`

**Ruta:** `public/assets/games/ruleta/state-locked.svg`

**Prompt:**

> Illustration for locked roulette state (user cannot spin yet). Roulette wheel silhouette faded at 40% opacity with padlock icon overlay centered. Coffee brown and cream palette, flat vector. 240×240 viewBox, transparent background. Mobile empty state, clear "come back after visit" feeling without text in image.

### 12. `state-win-banner.svg`

**Ruta:** `public/assets/games/ruleta/state-win-banner.svg`

**Prompt:**

> Horizontal celebration banner for roulette win screen. Confetti ribbons, small stars, coffee cup cheering — no legible text (UI adds copy). Gold #D4A853, green #4A9B6E, cream #F5F0E8, brown #6F4E37. 600×200 viewBox, transparent sides, flat vector festive illustration for mobile modal header.

### 13. `modal-backdrop.svg`

**Ruta:** `public/assets/games/ruleta/modal-backdrop.svg`

**Prompt:**

> Soft decorative backdrop for full-screen roulette modal. Radial glow cream-to-transparent from center, faint circular dotted lines suggesting wheel motion, very subtle coffee steam curves at edges. 390×844 mobile portrait viewBox. Low contrast (~15% opacity elements), must not compete with wheel UI on top. Flat vector.

### 14. `segment-texture-alt-a.svg` y `segment-texture-alt-b.svg`

**Rutas:** `public/assets/games/ruleta/segment-texture-alt-a.svg`, `segment-texture-alt-b.svg`

**Prompt (generar 2 variantes alternas):**

> Subtle wedge/segment texture tile for alternating roulette slices. Variant A: light cream base #F5F0E8 with faint diagonal lines. Variant B: slightly warmer cream #EDE4D6 with faint dot pattern. Each 128×128, one corner at center point (90° wedge or repeatable arc texture). Flat vector, very subtle — segment color tint applied via CSS on top.

---

**Notas para el implementador**

- Tras recibir assets, registrar en `rouletteAssets.ts` con map `prizeType → icon`.
- Segment fill colors vienen de CSS (`--tenant-primary`, tokens theme); no bakear colores de tenant en SVG salvo iconos.
- Comprimir SVG (SVGO) antes de commit; objetivo < 15 KB por icono.
- `npm run verify:loyalty-visual-assets` es referencia de patrón, no aplica directamente.

## Referencias

- [`docs/domain/roulette-game.md`](../domain/roulette-game.md)
- [`docs/domain/visual-assets-system.md`](../domain/visual-assets-system.md)
- [`docs/frontend/style-guidelines.md`](../frontend/style-guidelines.md)

## Verify

```bash
npm run verify:roulette-spin-e2e
```
