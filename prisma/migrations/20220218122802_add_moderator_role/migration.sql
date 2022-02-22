/*
  Warnings:

  - Made the column `dictionaryWriteRole` on table `GuildSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GuildSettings" ADD COLUMN     "moderatorRole" TEXT,
ALTER COLUMN "dictionaryWriteRole" SET NOT NULL;
