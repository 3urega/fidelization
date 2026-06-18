# Perfil app personal y zona de búsqueda (Phase S)

## Problema

Tras Phase Q (#85–#88) el grid «Explorar» filtra por GPS bajo demanda («Cerca de mí»), pero:

- No hay **perfil de usuario** en la app personal (`/home`): datos, preferencias ni resumen de fidelización.
- La ubicación del cliente **no se persiste**: cada sesión depende del permiso del navegador.
- El vacío *«No hay locales cerca de ti en este radio»* expone un concepto técnico (radio 25 km) que el usuario no configuró ni entiende.
- Muchos usuarios quieren explorar **una zona concreta** (p. ej. «Terrassa») sin compartir GPS en tiempo real.

## Visión de producto

La app personal necesita un **perfil con tabs** accesible desde `/home/profile`:

| Tab | Contenido |
|-----|-----------|
| **Información personal** | Nombre, email, avatar (futuro), **zona de búsqueda** |
| **Mis tarjetas** | Resumen de campañas de sellos activas y completadas en todos los locales |

### Zona de búsqueda

Preferencia persistida en `users`:

- **Etiqueta legible** — p. ej. `Terrassa, Barcelona` (no coordenadas crudas).
- **Coordenadas** — lat/lng del pin confirmado (geocodificación server-side, reutilizando `GeocodingGateway`).
- **Uso** — ancla por defecto del grid «Explorar» para ordenar/filtrar por distancia.

Flujo en el tab Información personal:

1. Usuario escribe o elige un lugar («Terrassa, Barcelona»).
2. Pulsa **Buscar en mapa** → backend geocodifica → preview con pin (mapa estático o interactivo, patrón Phase R #91).
3. Ajusta si hace falta y pulsa **Confirmar zona**.
4. La zona queda guardada y el grid la usa como referencia.

### Grid «Explorar»

Tres modos de proximidad (no mutuamente excluyentes en copy, sí en filtro activo):

| Modo | Origen coords | Cuándo |
|------|---------------|--------|
| **Todos** | Sin filtro near | Sin zona guardada y sin GPS |
| **En mi zona** | `users.search_zone_*` | Zona confirmada en perfil (default si existe) |
| **Ahora cerca de mí** | GPS del dispositivo | Toggle opt-in (Phase Q4, renombrar copy) |

**CTA en grid:** botón **Establecer zona de búsqueda** → `/home/profile?tab=personal` (sección zona).

**Chip de contexto** cuando hay zona: `Cerca de Terrassa` (editable), no «radio 25 km».

**Vacío mejorado:** *«No hay locales cerca de Terrassa. Prueba otra zona o explora todos los locales.»* + enlace a establecer zona.

Radio backend (`radiusKm`, default 25) permanece en API; **no se muestra al usuario** salvo ajuste avanzado futuro en perfil.

## Alcance Phase S

| In | Fuera |
|----|-------|
| Migración + dominio + API zona en `users` | Perfil owner/tenant (`/settings/profile`) |
| `/home/profile` con tabs | Notificaciones push |
| Editor zona (geocode + pin + confirmar) | Radio configurable en UI (fase posterior) |
| Tab resumen tarjetas sellos | Edición nombre/email (fase posterior) |
| Grid integrado + copy UX | Mapa interactivo Mapbox GL completo (MVP: static preview + pin) |

## Dependencias

- Phase Q (#87–#88): filtro near en API y grid.
- Phase R (#91): patrón mapa estático tenant → reutilizar proxy/builder para preview de zona usuario.
- `GeocodingGateway` (#85): geocode forward del texto de búsqueda.

## Issues GitHub (Phase S)

Manifest: [`docs/issues/manifest.phase-s-user-profile-search-zone.json`](../issues/manifest.phase-s-user-profile-search-zone.json)

| # | Issue | Valor |
|---|-------|-------|
| [#93](https://github.com/3urega/fidelization/issues/93) | S1: User search zone domain + API | Persistencia y contrato — **Implemented** 2026-06-18 |
| [#94](https://github.com/3urega/fidelization/issues/94) | S2: Perfil app shell + tabs | Navegación y estructura — **Implemented** 2026-06-18 |
| [#95](https://github.com/3urega/fidelization/issues/95) | S3: Editor zona de búsqueda | Geocode + mapa + confirmar |
| [#96](https://github.com/3urega/fidelization/issues/96) | S4: Tab mis tarjetas de sellos | Resumen fidelización |
| [#97](https://github.com/3urega/fidelization/issues/97) | S5: Grid discover + zona guardada + copy | UX integrada |

*(Publicado 2026-06-18.)*

**Relacionado:** [`customer-platform-app.md`](customer-platform-app.md), [`localization.md`](../localization.md).
