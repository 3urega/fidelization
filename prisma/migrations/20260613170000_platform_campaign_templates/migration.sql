CREATE TABLE "platform_campaign_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "required_stamps" INTEGER NOT NULL,
    "suggested_stamp_type_label" TEXT NOT NULL DEFAULT '',
    "visual_template" TEXT NOT NULL DEFAULT 'generic',
    "card_background_variant" TEXT NOT NULL DEFAULT 'coffee-photo',
    "conditions" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_campaign_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_campaign_templates_is_active_sort_order_idx" ON "platform_campaign_templates"("is_active", "sort_order");
