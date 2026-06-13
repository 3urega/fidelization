Aquí es donde suele cometerse otro error enorme.

Muchos SaaS crean un superadmin que acaba siendo:

```text id="l80swd"
Usuarios
Negocios
Planes
Configuración
```

Y ya está.

Pero tú eres el propietario de Fideli.

Tu dashboard debe ayudarte a gestionar el negocio.

---

# Mi regla

El dashboard del superadmin debe responder:

```text id="x6o2ec"
¿Está creciendo Fideli?

¿Está generando dinero?

¿Hay problemas?

¿Qué comercios funcionan mejor?

¿Qué clientes usan más la plataforma?
```

---

# 1. Dashboard Principal

Lo primero que vería al entrar.

Cards:

```text id="95w8iw"
Negocios activos

Usuarios registrados

MRR

Promociones activas

Sellos emitidos hoy

Escaneos QR hoy
```

---

# 2. Comercios

CRUD completo.

Ver:

```text id="3s5rhz"
Nombre

Plan

Estado

Fecha alta

Usuarios

Actividad
```

Acciones:

```text id="ce1x5i"
Crear

Editar

Suspender

Eliminar

Cambiar plan

Impersonar
```

---

# 3. Comerciantes

Listado de propietarios.

```text id="jlwmjr"
Nombre

Email

Negocios

Plan

Último acceso
```

---

Acciones:

```text id="5on0a0"
Editar

Bloquear

Reset password

Impersonar
```

---

# 4. Clientes

Todos los usuarios finales.

---

Filtros:

```text id="9h9p6m"
Más activos

Sin actividad

Nuevos

VIP
```

---

Acciones:

```text id="1z8eu2"
Ver perfil

Bloquear

Eliminar
```

---

# 5. Planes

Muy importante.

---

Crear:

```text id="p95wr2"
Free

Starter

Pro

Enterprise
```

---

Configurar:

```text id="iq8f42"
Precio

Límites

Módulos
```

---

# 6. Feature Flags

Probablemente lo más importante de todo.

---

Aquí decides:

```text id="yq9wtw"
Juego de ruleta

Activo
```

---

```text id="9p36v0"
Rasca y gana

Activo
```

---

```text id="5twj6r"
Ranking

Beta
```

---

```text id="j7px0m"
Referidos

Desactivado
```

---

Puedes:

```text id="4i53jk"
Global

Por plan

Por comercio
```

---

# 7. Biblioteca de Juegos

Tú crearás juegos.

---

Ejemplos:

```text id="c4sv20"
Ruleta

Rasca

Caja misteriosa

Desafíos
```

---

Acciones:

```text id="d09zw5"
Crear

Editar

Duplicar

Desactivar
```

---

# 8. Biblioteca de Campañas

Plantillas globales.

---

Ejemplo:

```text id="k8lqgt"
10 cafés = 1 gratis

8 croissants = 1 gratis

5 matchas = 1 gratis
```

---

Acciones:

```text id="azlc9r"
Crear

Editar

Publicar
```

---

# 9. Facturación

Muy importante.

---

Ver:

```text id="cmv7zf"
MRR

ARR

Ingresos hoy

Ingresos mes
```

---

Listado:

```text id="r7gb7z"
Suscripciones

Facturas

Pagos fallidos
```

---

# 10. Analytics

Oro puro.

---

Ver:

```text id="ysn4d0"
Sellos emitidos

Premios entregados

QR escaneados

Usuarios activos
```

---

También:

```text id="ccqz73"
Top negocios

Top promociones

Top campañas
```

---

# 11. Moderación

Para el futuro.

---

Ver:

```text id="9v0vuk"
Negocios reportados

Promociones fraudulentas

Contenido pendiente
```

---

# 12. Sistema

Configuración global.

---

Ejemplos:

```text id="vzxzmx"
Nombre plataforma

Logo

SMTP

Stripe

Emails
```

---

# 13. Centro de Comunicación

Muy útil.

---

Enviar:

```text id="cyekef"
Email a todos los negocios

Email a clientes

Notificaciones push
```

---

# 14. Impersonación

Obligatorio.

---

Botón:

```text id="fk4h85"
Entrar como comercio
```

---

Esto te ahorrará cientos de horas de soporte.

---

# Lo que yo implementaría primero

## Fase 1

```text id="0q1ul5"
Dashboard

Comercios

Comerciantes

Planes

Facturación

Feature Flags
```

---

## Fase 2

```text id="l8xjua"
Biblioteca de Juegos

Biblioteca de Campañas

Analytics
```

---

## Fase 3

```text id="m3m3ih"
Comunicación

Moderación

Sistema
```

Y hay una funcionalidad que considero crítica para Fideli desde el día 1:

```text id="r0nqax"
Impersonar comercio
```

Porque cuando tengas 50, 100 o 500 cafeterías, será la herramienta que más usarás de todo el panel.

---

# GitHub issues (Phase P)

Publicadas en GitHub · manifest: [`manifest.phase-p-superadmin.json`](issues/manifest.phase-p-superadmin.json)

| Phase | GitHub | Ámbito |
|-------|--------|--------|
| P1 | [#71](https://github.com/3urega/fidelization/issues/71) ✅ **Implemented** (2026-06-13) | KPI home + `/platform/tenants` |
| P2 | [#72](https://github.com/3urega/fidelization/issues/72) ✅ **Implemented** (2026-06-13) | Detalle tenant + plan |
| P3 | [#73](https://github.com/3urega/fidelization/issues/73) ✅ **Implemented** (2026-06-13) | Impersonar owner (crítico) |
| P4 | [#74](https://github.com/3urega/fidelization/issues/74) ✅ **Implemented** (2026-06-13) | Comerciantes |
| P5 | [#75](https://github.com/3urega/fidelization/issues/75) ✅ **Implemented** (2026-06-13) | Planes Basic/Pro/Premium |
| P6 | [#76](https://github.com/3urega/fidelization/issues/76) ✅ **Implemented** (2026-06-13) | Facturación / MRR |
| P7 | [#77](https://github.com/3urega/fidelization/issues/77) ✅ **Implemented** (2026-06-13) | Feature flags |
| P8 | [#78](https://github.com/3urega/fidelization/issues/78) ✅ **Implemented** (2026-06-13) | Analítica |
| P9 | [#79](https://github.com/3urega/fidelization/issues/79) ✅ **Implemented** (2026-06-13) | Usuarios app |
| P10 | [#80](https://github.com/3urega/fidelization/issues/80) ✅ **Implemented** (2026-06-13) | Plantillas campañas |
| P11 | [#81](https://github.com/3urega/fidelization/issues/81) ✅ **Implemented** (2026-06-13) | Biblioteca juegos |
| P12 | [#82](https://github.com/3urega/fidelization/issues/82) | Comunicación |
| P13 | [#83](https://github.com/3urega/fidelization/issues/83) | Moderación |
| P14 | [#84](https://github.com/3urega/fidelization/issues/84) | Sistema / integraciones |

**Orden recomendado:** P1 → P2 → **P3** (impersonación) → P4 → P5 → P6 → P7 → P8 → P9 → P10–P14.

**Base ya cerrada:** [#8](https://github.com/3urega/fidelization/issues/8) superadmin auth, [#9](https://github.com/3urega/fidelization/issues/9) listado tenants mínimo.

**Notas PO/dev:** planes = Basic/Pro/Premium (no Free/Starter/Enterprise); identidad unificada `users` ([`customer-platform-app.md`](domain/customer-platform-app.md)); arquitectura [`saas-architecture.md`](domain/saas-architecture.md).
