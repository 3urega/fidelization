-- AlterTable
ALTER TABLE "roulette_spin_eligibilities" ADD COLUMN "authorized_purchase_euros" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "roulette_participations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL,
    "period_ends_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roulette_participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roulette_participations_tenant_id_customer_id_idx" ON "roulette_participations"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "roulette_participations_tenant_id_customer_id_key" ON "roulette_participations"("tenant_id", "customer_id");

-- AddForeignKey
ALTER TABLE "roulette_participations" ADD CONSTRAINT "roulette_participations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roulette_participations" ADD CONSTRAINT "roulette_participations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
