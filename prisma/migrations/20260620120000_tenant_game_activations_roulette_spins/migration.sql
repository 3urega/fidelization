-- CreateTable
CREATE TABLE "tenant_game_activations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "game_slug" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_game_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roulette_spins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "segment_index" INTEGER NOT NULL,
    "prize_type" TEXT NOT NULL,
    "prize_payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "trigger_source" TEXT NOT NULL,
    "trigger_ref" TEXT,
    "idempotency_key" TEXT,
    "config_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMP(3),

    CONSTRAINT "roulette_spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_game_activations_tenant_id_idx" ON "tenant_game_activations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_game_activations_tenant_id_game_slug_key" ON "tenant_game_activations"("tenant_id", "game_slug");

-- CreateIndex
CREATE UNIQUE INDEX "roulette_spins_idempotency_key_key" ON "roulette_spins"("idempotency_key");

-- CreateIndex
CREATE INDEX "roulette_spins_tenant_id_customer_id_created_at_idx" ON "roulette_spins"("tenant_id", "customer_id", "created_at");

-- AddForeignKey
ALTER TABLE "tenant_game_activations" ADD CONSTRAINT "tenant_game_activations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roulette_spins" ADD CONSTRAINT "roulette_spins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roulette_spins" ADD CONSTRAINT "roulette_spins_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
