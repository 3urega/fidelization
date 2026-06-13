## Objetivo

Página **Ficha de cliente** en `/customers/[id]`: resumen, actividad reciente, programas activos (sellos), recompensas entregadas y acciones rápidas (placeholder).

## Contexto

Phase L — [`zona-clientes.md`](../zona-clientes.md). Depende de **L2** (`GET /api/loyalty/customers/[id]`) y **L5** (navegación desde tabla).

## Alcance

| In | Fuera |
|----|-------|
| `src/app/(app)/customers/[id]/page.tsx` + `CustomerDetailPanel` | Total gastado (POS) |
| Secciones: Resumen, Actividad, Programas activos, Recompensas entregadas | Implementar «Regalar sello/recompensa/nota» |
| Botones acción deshabilitados o «Próximamente» | Edición datos cliente |
| Link volver a `/customers` | |

## Criterios de aceptación

- [ ] Owner abre ficha desde tabla; 404 cliente ajeno al tenant
- [ ] Actividad muestra transacciones recientes (tipo + fecha; label legible)
- [ ] Progreso sellos `current / required` por campaña activa
- [ ] Tokens theme; mobile-first

## Capas / archivos principales

- `src/app/(app)/customers/[id]/page.tsx`
- `src/app/_components/loyalty/customer-zone/CustomerDetailPanel.tsx`

## Issues relacionadas

- L2: API detalle (`customer-zone-api.md`)
- L5: tabla (`customer-zone-table-ui.md`)

## Referencias

- [zona-clientes.md](../zona-clientes.md)
