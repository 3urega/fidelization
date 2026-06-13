## Objetivo

**Centro de comunicación** para el operador: enviar avisos a negocios o usuarios app (email primero; push preparado).

## Contexto

- Visión Fase 3: [`docs/superadmin.md`](../superadmin.md) § Centro de Comunicación.
- Infra email: no SMTP productivo aún; empezar con cola/log + preview.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/communications` compose: audiencia (todos owners / todos users / tenant) | Marketing automation drips |
| Preview + confirmación | Push FCM/APNs real (stub adapter) |
| Persistir `platform_broadcasts` + status sent/queued | Templates HTML ricos |
| Adapter interface `PlatformEmailSender` (console/log en dev) | |

## Criterios de aceptación

- [ ] En dev, «envío» registra filas auditables sin spam real sin confirmación.
- [ ] Solo superadmin; rate limit básico.
- [ ] Verify use case.

## Capas / archivos principales

- `shared/infrastructure` email port + noop/console impl
- API POST `/api/platform/communications/broadcasts`

## Issues relacionadas

- `platform-admin-system-settings.md` (P14)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
