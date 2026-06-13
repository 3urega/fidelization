## Objetivo

Listar **usuarios finales de la app personal** (`users` sin ser superadmin) con señales de actividad para soporte y growth.

## Contexto

- Modelo unificado: [`customer-platform-app.md`](../domain/customer-platform-app.md).
- Relaciones vía `customers.user_id`, escaneos globales QR (#44).
- Visión: [`docs/superadmin.md`](../superadmin.md) § Clientes.

## Alcance

| In | Fuera |
|----|-------|
| `/platform/users` listado paginado | Eliminar GDPR bulk |
| Filtros: nuevos (7d), sin actividad, con locales join | Segmento «VIP» (definir reglas v2) |
| Columnas: nombre, email, qr_value, # locales, última transacción | Editar perfil desde UI |
| `GET /api/platform/users` | Bloquear cuenta (v2) |
| Enlace a detalle read-only (relaciones + transacciones recientes) | |

## Criterios de aceptación

- [ ] Excluye `platform_role=superadmin`.
- [ ] Lazy `qr_value` visible (EnsureUserQrValue regresión).
- [ ] Verify use case + E2E.

## Capas / archivos principales

- `ListPlatformAppUsers` query Prisma
- Detalle opcional `/platform/users/[userId]`

## Issues relacionadas

- `platform-admin-owners-list.md` (P4)

## Referencias

- [`docs/superadmin.md`](../superadmin.md)
