-- CreateTable
CREATE TABLE "stamp_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stamp_types_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "stamp_campaigns" ADD COLUMN "stamp_type_id" TEXT;

-- CreateIndex
CREATE INDEX "stamp_types_tenant_id_idx" ON "stamp_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stamp_types_tenant_id_slug_key" ON "stamp_types"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "stamp_campaigns_stamp_type_id_idx" ON "stamp_campaigns"("stamp_type_id");

-- AddForeignKey
ALTER TABLE "stamp_types" ADD CONSTRAINT "stamp_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stamp_campaigns" ADD CONSTRAINT "stamp_campaigns_stamp_type_id_fkey" FOREIGN KEY ("stamp_type_id") REFERENCES "stamp_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
