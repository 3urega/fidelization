Sí. Lo que necesitas se llama **geocoding**: convertir una dirección tipo `"Carrer Major 10, Igualada"` en coordenadas `lat/lng`. Google Maps y Mapbox lo ofrecen oficialmente; Nominatim/OpenStreetMap también, pero su servicio público tiene política de uso limitada y no lo usaría para producción SaaS sin proveedor dedicado o instancia propia. ([Google for Developers][1])

Yo lo haría así:

## Recomendación para Fideli

Cuando el comercio crea o edita su perfil, añades estos campos:

```ts
address_line
city
province
postal_code
country
latitude
longitude
geocoding_provider
geocoded_at
```

Flujo:

```text
El comercio introduce dirección
↓
Backend llama al proveedor de geocoding
↓
Guardas latitude / longitude
↓
El grid puede filtrar por distancia
```

No geocodifiques cada vez que el usuario filtra. Geocodifica **una vez al guardar la dirección**.

## Proveedor

Para MVP usaría:

```text
Google Maps Geocoding API
```

Motivo: buena precisión en direcciones comerciales y España. La API convierte direcciones en latitud/longitud. ([Google for Developers][1])

Alternativa buena:

```text
Mapbox Geocoding API
```

También hace forward geocoding, convirtiendo texto en coordenadas. ([Mapbox][2])

## Issue para Cursor

```md
# Issue: Add geocoding support for business locations

## Objective

Allow businesses to store geographic coordinates based on their postal address so the app can filter establishments by location and distance.

## Scope

### 1. Extend business/location model

Add fields to the business/tenant location table:

- address_line
- city
- province
- postal_code
- country
- latitude
- longitude
- geocoding_provider
- geocoded_at

### 2. Create geocoding service

Create a backend service:

- `geocodeAddress(address: BusinessAddress): Promise<Coordinates>`

The service must:

- Build a complete address string
- Call the configured geocoding provider
- Return latitude and longitude
- Handle errors gracefully
- Never expose provider API keys to the frontend

### 3. Trigger geocoding on create/update

When a business address is created or updated:

- Validate required address fields
- Call geocoding service
- Store latitude and longitude
- Store geocoding provider
- Store geocoded_at timestamp

### 4. Distance filtering preparation

Prepare query support for filtering businesses near a coordinate.

Input:

- user_latitude
- user_longitude
- radius_km

Output:

- businesses within radius
- distance_km

### Acceptance Criteria

- A business address can be converted into coordinates
- Coordinates are stored in the database
- Geocoding is executed only on address changes
- API keys are server-side only
- Businesses can later be filtered by distance
```

La siguiente issue sería ya: **“Filter businesses by distance using user location”**. Ahí necesitarás pedir permiso de ubicación al usuario o permitirle buscar por ciudad/código postal.

---

## GitHub issues (Phase Q — location discovery)

**Decisión de implementación:** DDD con puerto `GeocodingGateway`; **Mapbox en dev** (`GEOCODING_PROVIDER=mapbox`); adaptador **Google Maps** listo para prod. Geocodificar al guardar perfil; filtro near en API discover; UI «Cerca de mí» en grid.

Manifest: [`docs/issues/manifest.phase-q-location-discovery.json`](issues/manifest.phase-q-location-discovery.json)

| # | Issue | Capas |
|---|-------|-------|
| [#85](https://github.com/3urega/fidelization/issues/85) | Q1: Geocoding gateway port (Mapbox + Google) — **Implemented** 2026-06-13 | domain port, infra, env, DI |
| [#86](https://github.com/3urega/fidelization/issues/86) | Q2: Tenant geocoding on profile save — **Implemented** 2026-06-13 | migración, UpdateTenantProfile |
| [#87](https://github.com/3urega/fidelization/issues/87) | Q3: Discover near filter (lat/lng/radiusKm) — **Implemented** 2026-06-13 | use case, repo Haversine, API |
| [#88](https://github.com/3urega/fidelization/issues/88) | Q4: Grid «Cerca de mí» + distancia en cards — **Implemented** 2026-06-13 | hook geolocation, UI |

*(Publicado 2026-06-13.)*

## GitHub issues (Phase R — tenant geocoding feedback)

Seguimiento post-Q: el owner debe **ver si su dirección se geocodificó**, **preview en mapa** y checklist coherente. Sin geocode silencioso.

Manifest: [`docs/issues/manifest.phase-r-tenant-geocoding-feedback.json`](issues/manifest.phase-r-tenant-geocoding-feedback.json)

| # | Issue | Capas |
|---|-------|-------|
| [#89](https://github.com/3urega/fidelization/issues/89) | R1: Geocoding status API + regeocode — **Implemented** 2026-06-13 | dominio, API |
| [#90](https://github.com/3urega/fidelization/issues/90) | R2: Profile feedback UI (banner / reintentar) — **Implemented** 2026-06-13 | UI owner |
| [#91](https://github.com/3urega/fidelization/issues/91) | R3: Mapa estático con pin en perfil — **Implemented** 2026-06-13 | UI + proxy map URL |
| [#92](https://github.com/3urega/fidelization/issues/92) | R4: Checklist panel vs coords reales | panel |

*(Publicado 2026-06-13.)*

[1]: https://developers.google.com/maps/documentation/geocoding?utm_source=chatgpt.com "Google Maps Platform Documentation | Geocoding API"
[2]: https://docs.mapbox.com/api/search/geocoding/?utm_source=chatgpt.com "Geocoding API | API Docs"
