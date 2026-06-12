-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "cover_image_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tenants" ADD COLUMN "discovery_tags" JSONB NOT NULL DEFAULT '[]';
