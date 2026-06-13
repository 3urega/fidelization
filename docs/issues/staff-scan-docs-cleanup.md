## Objetivo

Actualizar documentación y limpiar referencias al modelo Phase H (scan por `stampTypeId` / multi-campaña) tras implementar M2–M5.

## Contexto

Phase M sustituye Phase H3 ([`staff-stamp-scan-targeted.md`](staff-stamp-scan-targeted.md)). Tras M3–M5, docs y AGENTS deben describir scan target-first, no «elige tipo de consumición».

## Alcance

| In | Fuera |
|----|-------|
| `AGENTS.md`: scan + verify commands Phase M | Cámara QR |
| `docs/domain/post-onboarding-mvp-roadmap.md` Phase H/M | Reescribir todo el roadmap |
| `docs/domain/staff-scan-flow.md` status → Implemented | |
| Nota en H3: superseded by Phase M | Cerrar issues GitHub H3 automáticamente |
| Aclarar: `stampTypeId` en campañas = metadata owner en settings, no router scan | |
| Política `POST /api/loyalty/promotions/[id]/use`: delega a scan use case o 410 | |

## Criterios de aceptación

- [ ] `AGENTS.md` sin «+1 sello por campaña activa» ni «elige tipo antes de escanear»
- [ ] `AGENTS.md` lista `verify:staff-scan-*` y scripts migrados (M5)
- [ ] Roadmap Phase H: nota «scan tipado por tipo → reemplazado por Phase M target-first»
- [ ] `staff-scan-flow.md` status Implemented con fecha
- [ ] Comentario en issue H3 cerrada o doc `staff-stamp-scan-targeted.md` con banner superseded
- [ ] Settings `/settings/stamps`: copy opcional «el tipo etiqueta la campaña; el empleado elige la tarjeta en /scan»

## Capas / archivos principales

- `AGENTS.md`
- `docs/domain/post-onboarding-mvp-roadmap.md`
- `docs/domain/staff-scan-flow.md`
- `docs/issues/staff-stamp-scan-targeted.md` (banner)
- `src/app/(app)/scan/page.tsx` (copy PageHeader si aplica)

## Issues relacionadas

- [#65](https://github.com/3urega/fidelization/issues/65)–[#69](https://github.com/3urega/fidelization/issues/69)

## Referencias

- [staff-scan-flow.md](../domain/staff-scan-flow.md)
