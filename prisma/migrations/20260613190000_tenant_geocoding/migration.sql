-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN "geocoding_provider" TEXT;
ALTER TABLE "tenants" ADD COLUMN "geocoded_at" TIMESTAMP(3);
