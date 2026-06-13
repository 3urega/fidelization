CREATE TABLE "platform_impersonation_events" (
    "id" TEXT NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "impersonated_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_impersonation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_impersonation_events_tenant_id_created_at_idx" ON "platform_impersonation_events"("tenant_id", "created_at");
