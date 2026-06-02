-- CreateTable
CREATE TABLE "stamp_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required_stamps" INTEGER NOT NULL,
    "reward_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stamp_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_stamp_progress" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "current_stamps" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_stamp_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stamp_campaigns_tenant_id_idx" ON "stamp_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_stamp_progress_tenant_id_idx" ON "customer_stamp_progress"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_stamp_progress_customer_id_campaign_id_key" ON "customer_stamp_progress"("customer_id", "campaign_id");

-- AddForeignKey
ALTER TABLE "stamp_campaigns" ADD CONSTRAINT "stamp_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_campaigns" ADD CONSTRAINT "stamp_campaigns_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_stamp_progress" ADD CONSTRAINT "customer_stamp_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_stamp_progress" ADD CONSTRAINT "customer_stamp_progress_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_stamp_progress" ADD CONSTRAINT "customer_stamp_progress_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "stamp_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
