## Objetivo

Añadir la sección **Todos los clientes** en `/customers`: tabla con columnas Nombre, Última visita, Visitas, Sellos, Recompensas y badge de **Estado** (Activo, En riesgo, Inactivo, VIP).

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Depende de **L4** (página base). Consume `GET /api/loyalty/customers?segment=all`.

## Alcance

| In | Fuera |
|----|-------|
| `CustomerZoneAllCustomersTable` con fetch segment=all | Ordenación multi-columna avanzada |
| Badges estado con tokens theme (sin emojis obligatorios; texto + estilo OK) | Export CSV |
| Mobile: scroll horizontal `overflow-x-auto` o stack responsivo | Filtros complejos |
| Filas clicables → `/customers/[id]` (ruta L6; puede ser link preparado) | |

## Criterios de aceptación

- [ ] Tabla lista todos los clientes del tenant (limit documentado en API)
- [ ] Columnas y estados según spec
- [ ] Mobile-first legible
- [ ] Click en fila navega a ficha (L6) o deshabilitado hasta L6 merge

## Capas / archivos principales

- `src/app/_components/loyalty/customer-zone/CustomerZoneAllCustomersTable.tsx`
- Integración en `src/app/(app)/customers/page.tsx`

## Issues relacionadas

- L4: segmentos (`customer-zone-segments-ui.md`)
- L6: ficha (`customer-zone-detail-ui.md`)

## Referencias

- [zona-clientes.md](../zona-clientes.md)
