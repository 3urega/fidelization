-- AlterTable
ALTER TABLE "stamp_campaigns" ADD COLUMN "visual_template" TEXT NOT NULL DEFAULT 'generic';
ALTER TABLE "stamp_campaigns" ADD COLUMN "card_background_variant" TEXT NOT NULL DEFAULT 'coffee-photo';
