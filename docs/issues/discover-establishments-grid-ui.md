## Objetivo

Componentes visuales del catálogo: recuadros 2×N en móvil, imagen difuminada (o placeholder), nombre sobreimpreso e infinite scroll.

## Contexto

Phase I2 — requiere I1 (`GET /api/user/establishments`). Decisión de producto: cada local es un recuadro clicable; sin logo → placeholder con inicial del nombre.

## Alcance

| In | Fuera |
|----|-------|
| `EstablishmentDiscoverCard` (blur + overlay nombre) | Skeleton loaders elaborados |
| `EstablishmentDiscoverGrid` (grid `grid-cols-2`, IntersectionObserver) | Virtualización / react-window |
| `platformFetch` contra API paginada | Mapa o lista 1 columna desktop |

## Criterios de aceptación

- [ ] Grid 2 columnas en viewport móvil
- [ ] Con `logoUrl`: fondo imagen difuminada + nombre centrado encima
- [ ] Sin `logoUrl`: placeholder genérico (inicial) + nombre
- [ ] Infinite scroll carga `page+1` mientras `hasMore`
- [ ] Tap en recuadro → `/home/establishments/[slug]`
- [ ] Tokens de tema (sin colores hardcodeados fuera de tokens)

## Capas / archivos principales

- `src/app/_components/platform-app/EstablishmentDiscoverCard.tsx`
- `src/app/_components/platform-app/EstablishmentDiscoverGrid.tsx`

## Issues relacionadas

- [#46](https://github.com/3urega/fidelization/issues/46) (cerrada)
- `discover-establishments-home-integration.md`

## Referencias

- [style-guidelines.md](../frontend/style-guidelines.md)
- [customer-platform-app.md](../domain/customer-platform-app.md)
