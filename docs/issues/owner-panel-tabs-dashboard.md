## Objetivo

Reorganizar `/panel` en dos pestañas — **Dashboard** (métricas de sellos, owner) y **Configuración** (checklist actual) — con navegación por clic y swipe en mobile.

## Contexto

Phase K — [`stamp-campaign-owner-dashboard.md`](../domain/stamp-campaign-owner-dashboard.md). Puede desarrollarse en paralelo con K1/K2 usando datos mock; integración final con K4. Patrón URL: [`PlatformUserDashboard`](../../src/app/(mobile)/home/PlatformUserDashboard.tsx) (`?tab=`).

## Alcance

| In | Fuera |
|----|-------|
| `OwnerHomeTabs` en `/panel` con tabs Dashboard · Configuración | Cambiar rutas del shell nav |
| Extraer checklist actual a `OwnerConfigurationPanel` | Contenido del tab Dashboard (K4) |
| Sincronización URL `/panel?tab=dashboard|config` (default `dashboard` para owner) | Swipe en más de 2 tabs |
| Hook/componente swipe horizontal (~50px) + accesibilidad `role="tablist"` | Analítica backend |
| Empleado: solo tab Configuración (sin Dashboard) | |

## Criterios de aceptación

- [ ] Owner ve dos pestañas; contenido previo de [`HomeDashboard`](../../src/app/(app)/panel/HomeDashboard.tsx) intacto bajo **Configuración**
- [ ] Clic en pestaña cambia panel y actualiza `?tab=` sin recargar
- [ ] Swipe izquierda/derecha en mobile alterna pestañas (con clic como fallback)
- [ ] Empleado no ve pestaña Dashboard ni URL `?tab=dashboard` (redirect a `config`)
- [ ] Header «Hola, …» compartido fuera de tabs o duplicado de forma coherente
- [ ] `npm run verify:owner-login` sigue pasando

## Capas / archivos principales

- `src/app/(app)/panel/HomeDashboard.tsx` → refactor a `OwnerHomeTabs.tsx` + `OwnerConfigurationPanel.tsx`
- `src/app/_components/shell/useSwipeableTabs.ts` (o similar)
- `src/app/(app)/panel/page.tsx` (import actualizado)

## Issues relacionadas

- K1/K2: datos API (`stamp-campaign-dashboard-domain.md`, `stamp-campaign-dashboard-api.md`)
- K4: contenido tab Dashboard (`stamp-campaign-dashboard-ui.md`)

## Referencias

- [stamp-campaign-owner-dashboard.md](../domain/stamp-campaign-owner-dashboard.md)
