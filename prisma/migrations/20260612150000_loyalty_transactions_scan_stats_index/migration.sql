-- CreateIndex
CREATE INDEX "loyalty_transactions_tenant_id_type_created_at_idx" ON "loyalty_transactions"("tenant_id", "type", "created_at");
