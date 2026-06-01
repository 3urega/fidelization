# Legacy reference contexts

Código de referencia (MOOC, Femturisme, retention) del proyecto RAG original.

- **No está registrado** en [`diod.config.ts`](../shared/infrastructure/dependency-injection/diod.config.ts).
- **No hay rutas API activas** bajo `src/app/api/` para estos módulos.
- Úsalo como museo de patrones: hexagonal, RAG, eventos, criterios.

El producto activo del starter vive en `identity`, `billing` y `shared`.

SQL histórico: [`databases/legacy/`](../../../databases/legacy/).

Para infra RAG opcional: `docker compose --profile legacy up`.
