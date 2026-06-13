## Objetivo

Implementar en `/customers` las secciones **Insights**, **Clientes destacados**, **Clientes en riesgo** y **Cumpliendo objetivos** consumiendo la API L2.

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Depende de **L2** (API) y **L3** (ruta + nav). Prioridad producto: bloques 1–3 + insights antes que tabla completa (L5).

## Alcance

| In | Fuera |
|----|-------|
| `CustomerZonePage` / componentes en `_components/loyalty/customer-zone/` | Tabla completa (L5) |
| Fetch `GET .../insights` + listados `featured`, `at_risk`, `near_reward` | Botón «Enviar recompensa» funcional |
| Cards mobile-first por cliente (nombre, visitas mes, última visita, progreso premio) | Ficha detalle (L6) |
| Estados loading / error / empty por sección | Colores hardcodeados |
| Insights: VIP, en riesgo, cerca de premio, nuevos este mes | |

## Criterios de aceptación

- [ ] Owner en `/customers` ve 4 bloques insights + 3 listas segmentadas
- [ ] Copy en español alineado con spec (última visita relativa: «Hace X días», «Hoy»)
- [ ] UI theme tokens; legible en viewport estrecho (stack, sin overflow roto)
- [ ] En riesgo muestra CTA deshabilitado o link «Próximamente» para recompensa (sin backend acción)

## Capas / archivos principales

- `src/app/(app)/customers/page.tsx`
- `src/app/_components/loyalty/customer-zone/CustomerZoneInsights.tsx`
- `src/app/_components/loyalty/customer-zone/CustomerSegmentSection.tsx`
- `src/lib/loyalty/customerZone.ts` — tipos respuesta API

## Issues relacionadas

- L3: nav (`customer-zone-nav-shell.md`)
- L5: tabla (`customer-zone-table-ui.md`)

## Referencias

- [zona-clientes.md](../zona-clientes.md)
- [style-guidelines.md](../frontend/style-guidelines.md)
