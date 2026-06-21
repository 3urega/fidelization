-- CreateTable
CREATE TABLE "platform_broadcasts" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "audience_type" TEXT NOT NULL,
    "tenant_id" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "platform_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_broadcast_deliveries" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "delivery_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_broadcast_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_broadcasts_created_by_user_id_created_at_idx" ON "platform_broadcasts"("created_by_user_id", "created_at");

-- CreateIndex
CREATE INDEX "platform_broadcast_deliveries_broadcast_id_idx" ON "platform_broadcast_deliveries"("broadcast_id");

-- AddForeignKey
ALTER TABLE "platform_broadcasts" ADD CONSTRAINT "platform_broadcasts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_broadcasts" ADD CONSTRAINT "platform_broadcasts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_broadcast_deliveries" ADD CONSTRAINT "platform_broadcast_deliveries_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "platform_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
