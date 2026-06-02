-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('superadmin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "platform_role" "PlatformRole";
