CREATE TABLE "platform_games" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "required_feature" TEXT NOT NULL DEFAULT 'gamification',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_games_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_games_slug_key" ON "platform_games"("slug");

CREATE INDEX "platform_games_status_sort_order_idx" ON "platform_games"("status", "sort_order");
