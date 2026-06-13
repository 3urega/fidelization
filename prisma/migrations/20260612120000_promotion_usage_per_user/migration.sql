-- AlterEnum
ALTER TYPE "LoyaltyTransactionType" ADD VALUE 'promotion_used';

-- AlterTable
ALTER TABLE "promotions" ADD COLUMN "max_uses_per_user" INTEGER;

-- CreateTable
CREATE TABLE "customer_promotion_usages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_promotion_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_promotion_usages_tenant_id_idx" ON "customer_promotion_usages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_promotion_usages_customer_id_promotion_id_key" ON "customer_promotion_usages"("customer_id", "promotion_id");

-- AddForeignKey
ALTER TABLE "customer_promotion_usages" ADD CONSTRAINT "customer_promotion_usages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_promotion_usages" ADD CONSTRAINT "customer_promotion_usages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_promotion_usages" ADD CONSTRAINT "customer_promotion_usages_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
