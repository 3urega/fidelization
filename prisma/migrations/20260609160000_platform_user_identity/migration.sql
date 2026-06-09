-- AlterTable
ALTER TABLE "users" ADD COLUMN "qr_value" TEXT,
ADD COLUMN "oauth_provider" TEXT,
ADD COLUMN "oauth_subject" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_qr_value_key" ON "users"("qr_value");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_subject_key" ON "users"("oauth_subject");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_tenant_id_key" ON "customers"("user_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
