## Objetivo

Introducir el **puerto hexagonal de geocoding** con dos adaptadores de infraestructura (Mapbox y Google Maps Geocoding API), seleccionables por variable de entorno. En dev usamos **Mapbox**; Google queda listo para producción o cambio futuro sin tocar casos de uso.

## Contexto

- Spec de producto: [`docs/localization.md`](../localization.md) (geocoding + filtro por distancia).
- Patrón de referencia: `StripeCheckoutGateway` + `StripeCheckoutGatewayStripe` en `contexts/billing/stripe/`.
- Env centralizado: [`src/lib/env.ts`](../../src/lib/env.ts), [`docs/backend/external-services-env.md`](../backend/external-services-env.md).

## Alcance

| In | Fuera |
|----|-------|
| Nuevo contexto `shared/geocoding` o `tenants/geocoding` con puerto `GeocodingGateway` | Persistencia en `tenants` |
| VO dominio: `Coordinates`, `GeocodingResult` (`latitude`, `longitude`, `provider`, `geocodedAt`) | Reverse geocoding |
| Errores dominio: `GeocodingFailed`, `GeocodingNotConfigured` | UI / formularios |
| Infra Mapbox: `GeocodingGatewayMapbox` (forward geocoding REST) | PostGIS |
| Infra Google: `GeocodingGatewayGoogle` (Geocoding API REST) | Exponer API keys al cliente |
| Selección DI: `GEOCODING_PROVIDER=mapbox` (default dev) \| `google` | Geocodificar en cada búsqueda discover |
| Variables: `MAPBOX_ACCESS_TOKEN`, `GOOGLE_MAPS_GEOCODING_API_KEY` | |

### Diseño DDD propuesto

```
contexts/shared/geocoding/
├── domain/
│   ├── GeocodingGateway.ts          # abstract geocodeAddress(query: string)
│   ├── Coordinates.ts
│   ├── GeocodingResult.ts
│   ├── GeocodingProvider.ts         # 'mapbox' | 'google'
│   └── GeocodingFailed.ts
├── application/
│   └── GeocodeAddressString.ts      # use case fino sobre el puerto
└── infrastructure/
    ├── GeocodingGatewayMapbox.ts
    ├── GeocodingGatewayGoogle.ts
    └── resolveGeocodingGateway.ts   # factory según env
```

- Caso de uso `GeocodeAddressString`: recibe string de dirección (p. ej. `"Carrer Major 10, Igualada"`), delega al gateway activo, devuelve `GeocodingResult`.
- **Nunca** llamar a Mapbox/Google desde rutas API ni componentes React.
- Gateway inactivo (sin token del proveedor seleccionado) → `GeocodingNotConfigured` (no throw genérico).

## Criterios de aceptación

- [ ] `GeocodingGateway` abstracto + implementaciones Mapbox y Google compilando.
- [ ] `GEOCODING_PROVIDER=mapbox` usa Mapbox; `=google` usa Google cuando la key está presente.
- [ ] Claves solo en servidor (`env.ts`); documentadas en `.env.example` y `external-services-env.md`.
- [ ] DI en `diod.config.ts` registra el gateway activo (mismo patrón que Stripe).
- [ ] `npm run verify:geocoding-gateway-use-case` (stub HTTP o mock; sin llamada real obligatoria en CI).

## Verify

```bash
npm run verify:geocoding-gateway-use-case
```

## Capas / archivos principales

- `src/contexts/shared/geocoding/**`
- `src/lib/env.ts` — getters geocoding
- `src/contexts/shared/infrastructure/dependency-injection/diod.config.ts`
- `.env.example`, `docs/backend/external-services-env.md`
- `package.json` — script verify
- `AGENTS.md` — entrada verify

## Issues relacionadas

- `tenant-geocoding-on-profile-save.md` (Q2)
- `discover-establishments-near-filter.md` (Q3)
- `discover-grid-cerca-de-mi-ui.md` (Q4)

## Referencias

- [`docs/localization.md`](../localization.md)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)
