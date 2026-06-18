-- AlterTable
ALTER TABLE "users" ADD COLUMN "search_zone_label" TEXT;
ALTER TABLE "users" ADD COLUMN "search_zone_latitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "search_zone_longitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "search_zone_updated_at" TIMESTAMP(3);
