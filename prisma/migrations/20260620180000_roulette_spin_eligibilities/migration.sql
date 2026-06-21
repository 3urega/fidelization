-- CreateTable
CREATE TABLE "roulette_spin_eligibilities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "consumed_spin_id" TEXT,
    "trigger_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roulette_spin_eligibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roulette_spin_eligibilities_tenant_id_customer_id_consumed_at_expires_at_idx" ON "roulette_spin_eligibilities"("tenant_id", "customer_id", "consumed_at", "expires_at");

-- AddForeignKey
ALTER TABLE "roulette_spin_eligibilities" ADD CONSTRAINT "roulette_spin_eligibilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roulette_spin_eligibilities" ADD CONSTRAINT "roulette_spin_eligibilities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
